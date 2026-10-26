import { useState } from 'react';
import { Alert, Image, Linking, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppMap, type MapMarker } from '../components/map/AppMap';
import { mediaUri } from '../config/env';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { GradientButton } from '../components/GradientButton';
import { Icon } from '../components/Icon';
import { PulseDot } from '../components/PulseDot';
import { Header, Screen } from '../components/Screen';
import { StateView } from '../components/StateView';
import { api, errMsg, type OrderDetail, type OrderUpdatedEvent, type PaymentMethod, type WorkerLocationEvent } from '../api';
import { useSocketEvent } from '../realtime/socket';
import { useApi, useInterval } from '../hooks/useApi';
import { useCurrentOrderId } from '../hooks/useCurrentOrder';
import { confirmCancel } from '../utils/cancel';
import {
  PAYMENT_METHOD_LABEL,
  etaMinutes,
  fmtDate,
  fmtDateTime,
  fmtKm,
  haversineKm,
  money,
  orderSteps,
} from '../utils/format';
import { useNav } from '../navigation/NavigationContext';
import { colors, common, shadowSm } from '../theme';

// Realtime (Socket.IO) là chính; hỏi lại server định kỳ để phòng mất kết nối
const POLL_MS = 15000;

/** Bản đồ thật: nhà khách + vị trí thợ (khi đang tới), tự căn khung nhìn */
function TrackMap({ markers, topInset }: { markers: MapMarker[]; topInset: number }) {
  const key = markers.map((m) => m.id).join('-');
  return (
    <AppMap
      style={StyleSheet.absoluteFill}
      data={{
        markers,
        line: markers.length > 1,
        fit: true,
        fitKey: key,
        zoom: 15,
        padding: { top: topInset + 70, bottom: 40, left: 40, right: 40 },
      }}
    />
  );
}

const QUOTE_STATUS: Record<string, string> = { approved: 'đã duyệt', rejected: 'đã từ chối', cancelled: 'thợ đã rút', pending: 'chờ duyệt' };

/** Dòng chữ trên viên thuốc ở bản đồ */
function pillText(o: OrderDetail, km: number | null): string {
  switch (o.status) {
    case 'pending':
    case 'matching':
      return 'Đang tìm thợ';
    case 'accepted':
      return 'Thợ đã nhận đơn';
    case 'on_the_way':
      return km !== null ? `Thợ đang trên đường · ${etaMinutes(km)} phút` : 'Thợ đang trên đường';
    case 'arrived':
      return 'Thợ đã đến nơi';
    case 'in_progress':
      return 'Thợ đang sửa chữa';
    case 'completed':
      return 'Đã hoàn thành';
    case 'cancelled':
      return 'Đơn đã hủy';
  }
}

// Thợ Nhanh không nhận tiền mặt
const PAY_METHODS: PaymentMethod[] = ['momo', 'vnpay'];

export default function TrackScreen() {
  const { navigate, orderId: navOrderId } = useNav();
  const insets = useSafeAreaInsets();
  const mapH = 320 + insets.top;
  const cur = useCurrentOrderId(navOrderId);
  const orderId = cur.orderId;

  const q = useApi(async () => {
    if (!orderId) return null;
    const [order, tracking] = await Promise.all([api.getOrder(orderId), api.getTracking(orderId)]);
    return { order, tracking };
  }, [orderId]);

  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('momo');
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueText, setIssueText] = useState('');
  const [viewing, setViewing] = useState<string | null>(null);

  const o = q.data?.order;
  const live = !!o && o.status !== 'completed' && o.status !== 'cancelled';
  useInterval(() => q.reload(true), POLL_MS, live);
  // Đơn đổi trạng thái / báo giá / thanh toán, thợ di chuyển -> cập nhật ngay
  useSocketEvent<OrderUpdatedEvent>('order:updated', (e) => e.order_id === orderId && q.reload(true), !!orderId);
  useSocketEvent<WorkerLocationEvent>(
    'worker:location',
    (e) =>
      e.order_id === orderId &&
      q.setData((d) =>
        d ? { ...d, tracking: { ...d.tracking, worker_lat: e.lat, worker_lng: e.lng, location_updated_at: e.updated_at } } : d,
      ),
    !!orderId,
  );
  useSocketEvent('connect', () => q.reload(true), !!orderId);

  if (cur.resolving || (orderId && !o)) {
    return (
      <Screen>
        <Header title="Theo dõi đơn" />
        <StateView loading={cur.resolving || q.loading} error={cur.error ?? q.error} onRetry={() => (cur.error ? cur.retry() : q.reload())} />
      </Screen>
    );
  }
  if (!orderId || !o) {
    return (
      <Screen>
        <Header title="Theo dõi đơn" />
        <StateView empty="Bạn chưa có đơn nào đang thực hiện" icon="navigation-outline" actionLabel="Đặt dịch vụ" onAction={() => navigate('home')} />
      </Screen>
    );
  }

  const t = q.data!.tracking;
  const km =
    t.worker_lat != null && t.worker_lng != null
      ? haversineKm(t.worker_lat, t.worker_lng, t.destination_lat, t.destination_lng)
      : null;
  const markers: MapMarker[] = [{ id: 'c', lat: t.destination_lat, lng: t.destination_lng, kind: 'customer' }];
  if (t.worker_lat != null && t.worker_lng != null && live) markers.unshift({ id: 'w', lat: t.worker_lat, lng: t.worker_lng, kind: 'worker' });
  const before = o.photos.filter((p) => p.kind === 'before');
  const after = o.photos.filter((p) => p.kind === 'after');
  const steps = orderSteps(o.status);
  const cancelled = o.status === 'cancelled';
  const pendingQuotes = o.extra_quotes.filter((x) => x.status === 'pending');
  const paid = o.payments.find((p) => p.status === 'success');
  // Còn bảo hành và chưa có yêu cầu đang xử lý -> gửi yêu cầu bảo hành, ngược lại là khiếu nại
  const warrantyActive = o.can_claim_warranty;
  const canReport = o.can_complain || o.can_claim_warranty;
  const claimOpen = o.warranty?.claim_status === 'open' || o.warranty?.claim_status === 'processing';

  /** Chạy 1 thao tác rồi tải lại đơn, lỗi thì báo */
  const act = async (fn: () => Promise<unknown>, okMsg?: string) => {
    setBusy(true);
    try {
      await fn();
      await q.reload(true);
      if (okMsg) Alert.alert('Thành công', okMsg);
    } catch (e) {
      Alert.alert('Không thực hiện được', errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const pay = () =>
    act(async () => {
      const p = await api.createPayment(o.id, method);
      // Chưa tích hợp cổng thật: hỏi xác nhận để giả lập MoMo/VNPay sandbox báo thành công
      await new Promise<void>((resolve) =>
        Alert.alert(`${PAYMENT_METHOD_LABEL[method]} (sandbox)`, `Thanh toán ${money(p.amount)}?`, [
          { text: 'Hủy', style: 'cancel', onPress: () => resolve() },
          {
            text: 'Xác nhận thanh toán',
            onPress: async () => {
              try {
                await api.sandboxConfirm(p.id);
                Alert.alert('Thành công', 'Thanh toán thành công');
              } catch (e) {
                Alert.alert('Thanh toán thất bại', errMsg(e));
              }
              resolve();
            },
          },
        ]),
      );
    });

  const sendIssue = () => {
    const text = issueText.trim();
    if (text.length < 3) {
      Alert.alert('Thiếu nội dung', 'Vui lòng mô tả vấn đề (ít nhất 3 ký tự).');
      return;
    }
    void act(async () => {
      if (warrantyActive) await api.claimWarranty(o.id, text);
      else await api.createComplaint(o.id, `Khiếu nại đơn ${o.code}`, text);
      setIssueText('');
      setIssueOpen(false);
    }, warrantyActive ? 'Đã gửi yêu cầu bảo hành' : 'Đã gửi khiếu nại, CSKH sẽ liên hệ bạn sớm');
  };

  const details = [
    { label: 'Dịch vụ', value: o.service_name },
    { label: 'Mã đơn', value: o.code },
    { label: 'Địa chỉ', value: o.address_text },
    ...(o.scheduled_at ? [{ label: 'Lịch hẹn', value: fmtDateTime(o.scheduled_at) }] : []),
    ...(o.description ? [{ label: 'Mô tả', value: o.description }] : []),
    { label: o.final_price != null ? 'Thành tiền' : 'Giá ước tính', value: money(o.total_amount) },
    ...(paid ? [{ label: 'Đã thanh toán', value: `${PAYMENT_METHOD_LABEL[paid.method]} · ${fmtDate(paid.paid_at)}` }] : []),
    ...(o.warranty
      ? [{
          label: 'Bảo hành',
          value: o.warranty.active
            ? `Đến ${fmtDate(o.warranty.until)}${claimOpen ? ' · đang xử lý yêu cầu' : ''}`
            : `Đã hết hạn (${fmtDate(o.warranty.until)})`,
        }]
      : []),
    ...o.extra_quotes
      .filter((x) => x.status !== 'pending')
      .map((x) => ({ label: 'Phát sinh', value: `${x.description} · ${money(x.amount)} (${QUOTE_STATUS[x.status] ?? x.status})` })),
    ...(cancelled && o.cancel_reason ? [{ label: 'Lý do hủy', value: o.cancel_reason }] : []),
  ];

  return (
    <Screen noInset>
      <View style={{ height: mapH }}>
        <TrackMap markers={markers} topInset={insets.top} />
        <View style={[styles.mapBar, { top: insets.top + 12 }]}>
          <Pressable onPress={() => navigate('home')} style={styles.circleBtn}>
            <Icon name="arrow-left" size={16} color={colors.text} />
          </Pressable>
          <View style={styles.pill}>
            {live && <PulseDot size={6} color={colors.emerald500} />}
            <Text style={[styles.pillText, cancelled && { color: colors.red500 }]}>{pillText(o, km)}</Text>
          </View>
          <Pressable
            style={[styles.circleBtn, !o.worker && { opacity: 0.4 }]}
            disabled={!o.worker}
            onPress={() => o.worker && Linking.openURL(`tel:${o.worker.phone}`)}
          >
            <Icon name="phone-outline" size={16} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetBody}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {/* Thợ */}
        <View style={styles.workerRow}>
          {o.worker ? (
            <>
              <View>
                <Avatar name={o.worker.full_name} size={48} uri={o.worker.avatar_url} />
                {live && <View style={styles.online} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.wName}>{o.worker.full_name}</Text>
                <Text style={styles.wSub}>
                  {o.worker.level?.name ?? 'Thợ'}
                  {o.worker.has_certificate ? ' · có chứng chỉ' : ''} · {o.code}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                  <Icon name="shield-check" size={12} color={colors.emerald500} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>{Math.round(o.worker.trust_score * 100)}</Text>
                  <Text style={{ fontSize: 12, color: colors.gray400 }}>
                    ({o.worker.rating_count} đánh giá{km !== null && live ? ` · cách ${fmtKm(km)}` : ''})
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => navigate('chat', { orderId: o.id })} style={styles.chatBtn}>
                <Icon name="message-text-outline" size={18} color={colors.primary} />
              </Pressable>
            </>
          ) : (
            <>
              <View style={[styles.chatBtn, { width: 48, height: 48, borderRadius: 24 }]}>
                <Icon name="account-search-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.wName}>{cancelled ? 'Đơn đã hủy' : 'Đang tìm thợ phù hợp...'}</Text>
                <Text style={styles.wSub}>{o.service_name} · {o.code}</Text>
              </View>
              {!cancelled && (
                <Pressable onPress={() => navigate('match', { orderId: o.id })} style={styles.chatBtn}>
                  <Icon name="account-search-outline" size={18} color={colors.primary} />
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* Tiến trình */}
        {!cancelled && (
          <View style={styles.steps}>
            {steps.map((st, i) => {
              const lit = st.done || st.active;
              return (
                <View key={st.label} style={styles.stepCol}>
                  {i < steps.length - 1 && (
                    <View style={[styles.line, { backgroundColor: st.done ? colors.primary : colors.gray200 }]} />
                  )}
                  <View
                    style={[
                      styles.stepCircle,
                      {
                        backgroundColor: st.done ? colors.primary : '#fff',
                        borderColor: lit ? colors.primary : colors.gray200,
                      },
                    ]}
                  >
                    {st.done ? (
                      <Icon name="check" size={12} color="#fff" />
                    ) : st.active ? (
                      <PulseDot size={8} color={colors.primary} />
                    ) : null}
                  </View>
                  <Text style={[styles.stepLabel, { color: lit ? colors.primary : colors.gray300 }]}>{st.label}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Kiểm tra an toàn điện (thợ xác nhận trên app thợ trước khi sửa) */}
        {o.safety_checked_at && (
          <View style={styles.safety}>
            <Icon name="shield-check-outline" size={16} color={colors.emerald600} />
            <Text style={styles.safetyText}>
              Thợ đã kiểm tra an toàn điện (ngắt nguồn, thử điện, đồ bảo hộ) lúc {fmtDateTime(o.safety_checked_at)}
            </Text>
          </View>
        )}

        {/* Ảnh: khách gửi khi đặt, thợ chụp trước / sau khi sửa */}
        {[
          { title: 'Ảnh bạn gửi khi đặt', urls: o.image_urls },
          { title: 'Ảnh trước khi sửa', urls: before.map((p) => p.url) },
          { title: 'Ảnh sau khi sửa', urls: after.map((p) => p.url) },
        ]
          .filter((g) => g.urls.length > 0)
          .map((g) => (
            <View key={g.title} style={{ marginTop: 16 }}>
              <Text style={common.label}>{g.title}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {g.urls.map((u, i) => (
                  <Pressable key={u + i} onPress={() => setViewing(u)}>
                    <Image source={{ uri: mediaUri(u) }} style={styles.photo} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ))}

        {/* Báo giá phát sinh chờ duyệt */}
        {pendingQuotes.map((x) => (
          <View key={x.id} style={styles.quote}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Icon name="file-document-edit-outline" size={16} color={colors.blue600} />
              <Text style={styles.quoteTitle}>Thợ báo giá phát sinh</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={{ fontSize: 13, color: colors.body, flex: 1 }}>{x.description}</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>+{money(x.amount)}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <Pressable disabled={busy} onPress={() => act(() => api.respondQuote(o.id, x.id, false))} style={[styles.outlineBtn, { flex: 1 }]}>
                <Text style={[styles.outlineText, { color: colors.red500 }]}>Từ chối</Text>
              </Pressable>
              <Pressable disabled={busy} onPress={() => act(() => api.respondQuote(o.id, x.id, true))} style={[styles.solidBtn, { flex: 1 }]}>
                <Text style={styles.solidText}>Đồng ý</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {/* Chi tiết */}
        <View style={styles.details}>
          {details.map((d) => (
            <View key={d.label} style={styles.detailRow}>
              <Text style={{ fontSize: 12, color: colors.gray400 }}>{d.label}</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text, flexShrink: 1, textAlign: 'right' }}>
                {d.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Thanh toán */}
        {o.can_pay && (
          <View style={{ marginTop: 20 }}>
            <Text style={common.label}>Thanh toán</Text>
            <Text style={styles.note}>Thợ đã hoàn thành. Vui lòng thanh toán qua MoMo hoặc VNPay (Thợ Nhanh không nhận tiền mặt).</Text>
            <>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {PAY_METHODS.map((m) => {
                const on = method === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMethod(m)}
                    style={[styles.outlineBtn, { flex: 1 }, on && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  >
                    <Text style={[styles.outlineText, on && { color: '#fff' }]}>{PAYMENT_METHOD_LABEL[m]}</Text>
                  </Pressable>
                );
              })}
            </View>
            <GradientButton title={`Thanh toán ${money(o.total_amount)}`} onPress={pay} loading={busy} />
            </>
          </View>
        )}

        {/* Đánh giá */}
        {o.can_review && (
          <Pressable onPress={() => navigate('review', { orderId: o.id })} style={[styles.solidBtn, { marginTop: 12 }]}>
            <Text style={styles.solidText}>Đánh giá thợ</Text>
          </Pressable>
        )}
        {o.review && (
          <View style={[styles.note, { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 }]}>
            <Text style={{ fontSize: 12, color: colors.gray500 }}>Bạn đã đánh giá {o.review.rating}</Text>
            <Icon name="star" size={12} color={colors.amber400} />
          </View>
        )}

        {/* Bảo hành / khiếu nại */}
        {canReport && (
          <View style={{ marginTop: 16 }}>
            {!issueOpen ? (
              <Pressable onPress={() => setIssueOpen(true)} style={styles.linkRow} hitSlop={6}>
                <Icon name={warrantyActive ? 'shield-refresh-outline' : 'alert-circle-outline'} size={16} color={colors.gray500} />
                <Text style={styles.linkText}>{warrantyActive ? 'Yêu cầu bảo hành' : 'Báo sự cố / khiếu nại'}</Text>
              </Pressable>
            ) : (
              <View style={{ gap: 8 }}>
                <Text style={common.label}>{warrantyActive ? 'Yêu cầu bảo hành' : 'Khiếu nại'}</Text>
                <TextInput
                  style={common.textarea}
                  multiline
                  numberOfLines={3}
                  maxLength={2000}
                  placeholder={warrantyActive ? 'Mô tả lỗi cần bảo hành...' : 'Mô tả vấn đề bạn gặp...'}
                  placeholderTextColor={colors.gray400}
                  value={issueText}
                  onChangeText={setIssueText}
                  selectionColor={colors.primary}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable onPress={() => setIssueOpen(false)} style={[styles.outlineBtn, { flex: 1 }]}>
                    <Text style={styles.outlineText}>Đóng</Text>
                  </Pressable>
                  <Pressable disabled={busy} onPress={sendIssue} style={[styles.solidBtn, { flex: 1 }]}>
                    <Text style={styles.solidText}>Gửi</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Hủy đơn */}
        {o.can_cancel && (
          <Pressable
            disabled={busy}
            onPress={() => confirmCancel((reason) => act(() => api.cancelOrder(o.id, reason), 'Đã hủy đơn'))}
            style={[styles.linkRow, { marginTop: 16 }]}
            hitSlop={6}
          >
            <Icon name="close-circle-outline" size={16} color={colors.red500} />
            <Text style={[styles.linkText, { color: colors.red500 }]}>Hủy đơn</Text>
          </Pressable>
        )}

      </ScrollView>

      {/* Xem ảnh lớn */}
      <Modal visible={!!viewing} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <Pressable style={styles.viewer} onPress={() => setViewing(null)}>
          {viewing ? <Image source={{ uri: mediaUri(viewing) }} style={styles.viewerImg} resizeMode="contain" /> : null}
          <Text style={styles.viewerHint}>Chạm để đóng</Text>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapBar: {
    position: 'absolute', left: 12, right: 12, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  circleBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', ...shadowSm, elevation: 3,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, ...shadowSm, elevation: 3,
  },
  pillText: { fontSize: 12, fontWeight: '600', color: colors.emerald600 },
  sheet: {
    flex: 1, backgroundColor: '#fff', marginTop: -16,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  sheetBody: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  online: {
    position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.emerald500, borderWidth: 2, borderColor: '#fff',
  },
  wName: { fontSize: 14, fontWeight: '700', color: colors.text },
  wSub: { fontSize: 12, color: colors.gray400 },
  chatBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  steps: { flexDirection: 'row', marginBottom: 20 },
  stepCol: { flex: 1, alignItems: 'center' },
  line: { position: 'absolute', top: 11, left: '50%', width: '100%', height: 2 },
  stepCircle: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  stepLabel: { fontSize: 10, fontWeight: '500', marginTop: 4, textAlign: 'center' },
  details: { backgroundColor: colors.gray50, borderRadius: 16, padding: 16, gap: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  safety: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16, padding: 12, borderRadius: 12,
    backgroundColor: colors.emerald50,
  },
  safetyText: { flex: 1, fontSize: 12, color: colors.emerald600, lineHeight: 17 },
  photo: { width: 96, height: 96, borderRadius: 12, backgroundColor: colors.gray100 },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  viewerImg: { width: '100%', height: '80%' },
  viewerHint: { color: '#fff', opacity: 0.7, marginTop: 12, fontSize: 12 },
  quote: {
    backgroundColor: colors.blue50, borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: colors.blue100,
  },
  quoteTitle: { fontSize: 13, fontWeight: '700', color: colors.blue700 },
  outlineBtn: {
    paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.gray200,
    backgroundColor: '#fff', alignItems: 'center',
  },
  outlineText: { fontSize: 13, fontWeight: '600', color: colors.text },
  solidBtn: { paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  solidText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  note: { fontSize: 12, color: colors.gray500, marginBottom: 10, lineHeight: 17 },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  linkText: { fontSize: 13, fontWeight: '600', color: colors.gray500 },
});
