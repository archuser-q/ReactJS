/**
 * Màn làm việc của 1 đơn — nơi thợ dùng nhiều nhất:
 * bản đồ + dẫn đường, gọi/nhắn khách, tiến độ (vuốt để xác nhận), ảnh trước/sau,
 * báo giá phát sinh, theo dõi khách thanh toán qua app, xem đánh giá & bảo hành.
 * Bản đồ chỉ hiện khi còn phải di chuyển (đã nhận / đang đi); chạm vào để xem toàn màn hình.
 * Đã đến nơi trở đi: bỏ bản đồ, nhường chỗ cho checklist an toàn, ảnh, báo giá.
 */
import { useMemo, useState } from 'react';
import { Linking, Modal, Platform, Pressable, RefreshControl, ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../components/Text';
import { useIsFocused } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';
import { api, errMsg, qk, type JobDetail } from '../../api';
import { useWorkerMe } from '../../auth/AuthContext';
import { Avatar, Banner, Card, Divider, KeyValue, SectionTitle, StarRating, Tag } from '../../components/Bits';
import { Button } from '../../components/Button';
import { Icon, type IconName } from '../../components/Icon';
import { AppMap, type MapData, type MapMarker } from '../../components/map/AppMap';
import { SafetyChecklist, safetyDone } from '../../components/Safety';
import { useOverlay } from '../../components/Overlay';
import { MAX_PICK, PhotoGrid, useUploadImages } from '../../components/Photos';
import { FocusStatusBar } from '../../components/Brand';
import { Header, Screen } from '../../components/Screen';
import { StateView } from '../../components/StateView';
import { SwipeButton } from '../../components/SwipeButton';
import type { ScreenProps } from '../../navigation/types';
import { SUPPORT_PHONE } from '../../config/env';
import { colors, palette, radius, shadow, tabular } from '../../theme';
import { QuoteSheet } from './QuoteSheet';
import {
  etaMinutes,
  fmtDate,
  fmtDateTime,
  fmtKm,
  fmtTime,
  fmtWhenInline,
  haversineKm,
  JOB_STATUS,
  JOB_STEPS,
  money,
  orderCode,
  PAYMENT_LABEL,
  serviceIcon,
  stepIndex,
} from '../../utils/format';

const CANCEL_BEFORE = ['Xe hỏng / sự cố cá nhân', 'Không liên lạc được khách', 'Khách yêu cầu hủy', 'Không đủ dụng cụ / vật tư', 'Lý do khác'];
const CANCEL_AT_SITE = ['Khách không có mặt', 'Khách không đồng ý giá', 'Công việc vượt khả năng / nguy hiểm', 'Lý do khác'];
const INFLIGHT = ['accepted', 'on_the_way', 'arrived', 'in_progress'];

const ADVANCE_TOAST: Record<string, string> = {
  on_the_way: 'Đã báo khách bạn đang tới',
  arrived: 'Đã báo khách bạn đã đến',
  in_progress: 'Bắt đầu sửa chữa',
  completed: 'Hoàn thành công việc! Khách thanh toán qua app, tiền tự vào ví của bạn',
};

export default function JobDetailScreen({ route, navigation }: ScreenProps<'JobDetail'>) {
  const { orderId } = route.params;
  const focused = useIsFocused();
  const qc = useQueryClient();
  const ui = useOverlay();
  const insets = useSafeAreaInsets();
  const q = useQuery({ queryKey: qk.job(orderId), queryFn: () => api.job(orderId), refetchInterval: focused ? 6000 : false });
  useRefetchOnFocus(q.refetch); // quay lại từ màn chat / báo cáo
  const j = q.data;
  const inflight = !!j && INFLIGHT.includes(j.status);
  const me = useWorkerMe({ poll: focused && inflight ? 15000 : undefined });
  const before = useUploadImages();
  const after = useUploadImages();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [solidHead, setSolidHead] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [onMap, setOnMap] = useState(false);
  const [refit, setRefit] = useState(0);
  const { height: winH } = useWindowDimensions();

  const setJob = (d: JobDetail) => qc.setQueryData(qk.job(orderId), d);
  const refreshLists = () => {
    void qc.invalidateQueries({ queryKey: qk.home });
    void qc.invalidateQueries({ queryKey: ['jobs'] });
  };

  if (!j) {
    return (
      <Screen>
        <Header title={orderCode(orderId)} />
        <StateView loading={q.isLoading} error={q.error ? errMsg(q.error) : null} onRetry={() => void q.refetch()} />
      </Screen>
    );
  }

  const loc = me.data?.profile.location;
  const wpos = loc ? { lat: loc.latitude, lng: loc.longitude } : null;
  const km = wpos ? haversineKm(wpos.lat, wpos.lng, j.latitude, j.longitude) : j.distance_km;
  const markers: MapMarker[] = [{ id: 'c', lat: j.latitude, lng: j.longitude, kind: 'customer' }];
  if (wpos && inflight) markers.unshift({ id: 'w', lat: wpos.lat, lng: wpos.lng, kind: 'worker' });
  const beforePhotos = j.photos.filter((x) => x.kind === 'before');
  const afterPhotos = j.photos.filter((x) => x.kind === 'after');
  const approvedExtra = j.extra_quotes.filter((x) => x.status === 'approved').reduce((s, x) => s + x.amount, 0);
  const pendingExtra = j.extra_quotes.filter((x) => x.status === 'pending').reduce((s, x) => s + x.amount, 0);
  // Hoàn thành rồi thì giá đã chốt (không còn phát sinh); trước đó là tạm tính = công cơ bản + phát sinh đã duyệt
  const priceFinal = !!j.earning || j.status === 'completed';
  const rate = me.data?.settings.commission_rate ?? 0.15;
  const pendingPayment = j.payments.find((x) => x.status === 'pending');

  // ---------- Hành động ----------

  const call = () => {
    if (j.customer.phone) void Linking.openURL(`tel:${j.customer.phone}`);
    else void ui.alert('Khách chưa có số điện thoại', 'Hãy nhắn tin cho khách trong app.', 'info');
  };
  const chat = () => navigation.navigate('Chat', { orderId: j.id, customerName: j.customer.full_name, customerPhone: j.customer.phone });
  const navigate = async () => {
    const google = `https://www.google.com/maps/dir/?api=1&destination=${j.latitude},${j.longitude}&travelmode=driving`;
    if (Platform.OS === 'ios') {
      const pick = await ui.choose({ title: 'Dẫn đường bằng', choices: ['Google Maps', 'Apple Maps'], confirmText: 'Mở' });
      if (pick === 'Apple Maps') return void Linking.openURL(`maps://?daddr=${j.latitude},${j.longitude}&dirflg=d`);
      if (!pick) return;
    }
    void Linking.openURL(google);
  };

  const uploadPhotos = async (kind: 'before' | 'after') => {
    const up = kind === 'before' ? before : after;
    const have = (kind === 'before' ? beforePhotos : afterPhotos).length;
    const urls = await up.run({
      multiple: true,
      limit: MAX_PICK - have,
      title: kind === 'before' ? 'Ảnh hiện trạng trước khi sửa' : 'Ảnh sau khi sửa xong',
    });
    if (!urls.length) return false;
    try {
      setJob(await api.addPhotos(j.id, kind, urls));
      ui.toast(`Đã lưu ${urls.length} ảnh`);
      return true;
    } catch (e) {
      void ui.alert('Chưa lưu được ảnh', errMsg(e), 'danger');
      return false;
    }
  };

  const removePhoto = async (photoId: number) => {
    if (!(await ui.confirm({ title: 'Xóa ảnh này?', tone: 'danger', confirmText: 'Xóa' }))) return;
    try {
      setJob(await api.deletePhoto(j.id, photoId));
    } catch (e) {
      ui.toast(errMsg(e), 'error');
    }
  };

  const advance = async () => {
    const next = j.next_status;
    if (!next) return;
    if (next === 'arrived' && km !== null && km !== undefined && km > 0.5) {
      const ok = await ui.confirm({
        title: 'Bạn đã đến nơi chưa?',
        message: `Theo GPS bạn còn cách khách khoảng ${fmtKm(km)}. Vẫn báo khách là đã đến?`,
        confirmText: 'Đã đến',
        tone: 'warning',
      });
      if (!ok) return;
    }
    if (next === 'in_progress' && !safetyDone(j.id)) {
      return void ui.alert(
        'Kiểm tra an toàn điện trước',
        'Hãy tick đủ các mục "Kiểm tra an toàn trước khi sửa" (ngắt nguồn, thử điện, đồ bảo hộ, báo khách) rồi mới bắt đầu.',
        'warning',
      );
    }
    if (next === 'in_progress' && !beforePhotos.length) {
      const take = await ui.confirm({
        title: 'Chụp ảnh hiện trạng?',
        message: 'Ảnh trước khi sửa là bằng chứng bảo vệ bạn khi có tranh chấp. Nên chụp 1–2 ảnh.',
        confirmText: 'Chụp ngay',
        cancelText: 'Bỏ qua',
      });
      if (take && !(await uploadPhotos('before'))) return;
    }
    if (next === 'completed') {
      if (j.has_pending_quote) {
        return void ui.alert('Chờ khách duyệt báo giá', 'Còn báo giá phát sinh khách chưa trả lời. Đợi khách duyệt hoặc rút lại báo giá.', 'warning');
      }
      if (j.needs_after_photo) {
        await ui.alert('Chụp ảnh sau khi sửa', 'Cần ít nhất 1 ảnh kết quả để hoàn thành đơn (bằng chứng + bảo hành).', 'info');
        if (!(await uploadPhotos('after'))) return;
      }
      const ok = await ui.confirm({
        title: 'Xác nhận hoàn thành?',
        message: `Tổng tiền khách cần trả: ${money(j.total_amount)}.\nKhách sẽ nhận thông báo thanh toán và đánh giá.`,
        confirmText: 'Hoàn thành',
        tone: 'success',
      });
      if (!ok) return;
    }
    try {
      const res = await api.advance(j.id, next, next === 'in_progress' && safetyDone(j.id));
      setJob(res);
      ui.toast(ADVANCE_TOAST[next] ?? 'Đã cập nhật');
      refreshLists();
    } catch (e) {
      void ui.alert('Chưa cập nhật được', errMsg(e), 'danger');
      void q.refetch();
    }
  };

  const cancelJob = async () => {
    const reason = await ui.choose({
      title: j.cancel_requeues ? 'Hủy nhận việc?' : 'Hủy đơn tại nơi làm?',
      message: j.cancel_requeues
        ? 'Đơn sẽ được giao cho thợ khác. Hủy nhiều lần sẽ ảnh hưởng điểm tin cậy và thứ hạng nhận đơn.'
        : 'Đơn sẽ bị hủy. Chỉ dùng khi khách vắng mặt hoặc không thể làm việc.',
      choices: j.cancel_requeues ? CANCEL_BEFORE : CANCEL_AT_SITE,
      confirmText: 'Xác nhận hủy',
      tone: 'danger',
    });
    if (!reason) return;
    try {
      const res = await api.cancelJob(j.id, reason);
      ui.toast(res.status === 'cancelled' ? 'Đã huỷ đơn' : 'Đã huỷ nhận đơn, hệ thống sẽ tìm thợ khác cho khách', 'info');
      refreshLists();
      if (res.status === 'cancelled') void q.refetch();
      else navigation.goBack();
    } catch (e) {
      void ui.alert('Không hủy được', errMsg(e), 'danger');
    }
  };

  const report = () => navigation.navigate('ReportIssue', { orderId: j.id });

  const more = async () => {
    const live = j.status !== 'completed' && j.status !== 'cancelled';
    const choices = [
      ...(live ? ['Chia sẻ địa chỉ đang làm cho người thân'] : []),
      ...(j.can_report ? ['Báo cáo sự cố'] : []),
      ...(SUPPORT_PHONE ? [`Gọi tổng đài hỗ trợ ${SUPPORT_PHONE}`] : []),
      ...(j.can_cancel ? [j.cancel_requeues ? 'Hủy nhận việc' : 'Hủy đơn (khách vắng mặt...)'] : []),
    ];
    const pick = await ui.choose({ title: 'Tùy chọn', choices, confirmText: 'Chọn' });
    if (!pick) return;
    if (pick.startsWith('Hủy')) void cancelJob();
    else if (pick === 'Báo cáo sự cố') report();
    else if (pick.startsWith('Chia sẻ')) {
      void Share.share({
        message: `Mình đang làm đơn ${orderCode(j)} (${j.service_name}) của Thợ Nhanh tại: ${j.address_text}.\nBản đồ: https://maps.google.com/?q=${j.latitude},${j.longitude}`,
      }).catch(() => undefined);
    }
    else if (SUPPORT_PHONE) void Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`);
  };

  // ---------- Giao diện ----------

  const stepAt = stepIndex(j.status);
  // Diễn biến đơn: lịch sử trạng thái + mốc xác nhận an toàn điện (server lưu khi bắt đầu sửa)
  // Cùng thời điểm thì mốc an toàn điện đứng trước "Đang sửa chữa" (xác nhận xong mới bắt đầu sửa)
  // Diễn biến: tính từ lần tìm thợ gần nhất (đơn có thể từng do thợ khác nhận rồi huỷ — không hiện phần của họ)
  const lastMatch = j.history.map((h) => h.status).lastIndexOf('matching');
  const requeued = j.history.filter((h) => h.status === 'matching').length > 1;
  const timeline = [
    ...j.history
      .filter((h, i) => h.status !== 'pending' && i >= Math.max(0, lastMatch))
      .map((h) => ({
        label: h.status === 'matching' ? (requeued ? 'Đơn được giao lại cho thợ khác' : 'Khách đặt đơn') : (JOB_STATUS[h.status]?.label ?? h.status),
        color: JOB_STATUS[h.status]?.color ?? colors.faint,
        at: h.created_at,
        safety: false,
      })),
    ...(j.safety_checked_at ? [{ label: 'Đã kiểm tra an toàn điện', color: colors.success, at: j.safety_checked_at, safety: true }] : []),
  ].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : Number(b.safety) - Number(a.safety)));
  const showMap = j.status === 'accepted' || j.status === 'on_the_way';
  const mapH = Math.round(winH * 0.32);
  const headH = insets.top + 62;
  const solid = solidHead || !showMap;
  const swipeLabel: Record<string, string> = {
    on_the_way: 'Vuốt để bắt đầu di chuyển',
    arrived: 'Vuốt khi đã đến nơi',
    in_progress: 'Vuốt để bắt đầu sửa',
    completed: 'Vuốt để hoàn thành',
  };
  const st = JOB_STATUS[j.status];
  const headline =
    j.status === 'accepted'
      ? j.scheduled_at
        ? `Lịch hẹn ${fmtWhenInline(j.scheduled_at)}`
        : 'Đã nhận việc, xuất phát thôi'
      : j.status === 'on_the_way'
        ? 'Đang trên đường tới khách'
        : j.status === 'arrived'
          ? 'Đã tới nơi, kiểm tra an toàn rồi bắt đầu'
          : j.status === 'in_progress'
            ? 'Đang sửa chữa'
            : j.status === 'completed'
              ? j.paid
                ? 'Đã hoàn thành và thanh toán'
                : 'Đã hoàn thành, chờ thanh toán'
              : 'Đơn đã hủy';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FocusStatusBar style="dark" />
      <ScrollView
        scrollEnabled={!onMap}
        contentContainerStyle={{ paddingBottom: 28 + (j.next_status && j.next_action ? 0 : insets.bottom) }}
        scrollEventThrottle={32}
        onScroll={(e) => {
          const next = e.nativeEvent.contentOffset.y > mapH - 30;
          if (next !== solidHead) setSolidHead(next);
        }}
        refreshControl={
          <RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.primary} progressViewOffset={showMap ? 0 : headH} />
        }
      >
        {showMap ? (
          <View style={{ height: mapH + insets.top }}>
            {/* Kéo / chụm 2 ngón trên bản đồ chỉ di chuyển bản đồ: lúc ngón tay đang chạm, trang tạm khóa cuộn */}
            <JobMap markers={markers} topInset={insets.top} refit={refit} onTouchActive={setOnMap} />
            <Pressable style={styles.expand} onPress={() => setMapOpen(true)} hitSlop={6}>
              <Icon name="arrow-expand" size={15} color={colors.navy} />
              <Text style={styles.expandText}>Xem bản đồ lớn</Text>
            </Pressable>
            <Pressable onPress={() => setRefit((k) => k + 1)} style={[styles.recenter, shadow.md]} hitSlop={6} accessibilityLabel="Căn vừa thợ và khách">
              <Icon name="crosshairs-gps" size={20} color={colors.navy} />
            </Pressable>
          </View>
        ) : (
          <View style={{ height: headH }} />
        )}

        <View style={[styles.sheet, !showMap && styles.sheetFlat]}>
          {/* Trạng thái + tiến độ */}
          <View style={styles.headRow}>
            <View style={[styles.statusChip, { backgroundColor: st.bg }]}>
              <Icon name={st.icon} size={14} color={st.color} />
              <Text style={[styles.statusChipText, { color: st.color }]}>{st.label}</Text>
            </View>
            <Text style={styles.code}>{orderCode(j)}</Text>
          </View>
          <Text style={styles.headline}>{headline}</Text>
          {j.status !== 'cancelled' ? (
            <View style={{ gap: 6 }}>
              <View style={styles.segs}>
                {JOB_STEPS.map((s, i) => {
                  const done = i < stepAt || j.status === 'completed';
                  const current = i === stepAt && j.status !== 'completed';
                  return <View key={s.status} style={[styles.seg, done && styles.segDone, current && styles.segNow]} />;
                })}
              </View>
              <View style={styles.segLabels}>
                {JOB_STEPS.map((s, i) => (
                  <Text key={s.status} style={[styles.segLabel, i === stepAt && j.status !== 'completed' && styles.segLabelNow]} numberOfLines={1}>
                    {s.label}
                  </Text>
                ))}
              </View>
            </View>
          ) : (
            <Banner tone="danger" text={j.cancel_reason ? `Lý do: ${j.cancel_reason}` : 'Đơn đã hủy'} />
          )}

          {/* Khách + liên hệ + dẫn đường */}
          <View style={styles.customer}>
            <Avatar name={j.customer.full_name} uri={j.customer.avatar_url} size={50} color={colors.navy} />
            <View style={{ flex: 1 }}>
              <Text style={styles.custName}>{j.customer.full_name}</Text>
              <Text style={styles.custSub}>{j.customer.phone ?? 'Liên hệ qua tin nhắn trong app'}</Text>
            </View>
            {j.can_chat ? (
              <>
                <Pressable onPress={chat} style={styles.round} accessibilityLabel="Nhắn tin">
                  <Icon name="message-text-outline" size={21} color={colors.navy} />
                  {j.unread_messages ? <View style={styles.dot} /> : null}
                </Pressable>
                <Pressable onPress={call} style={[styles.round, styles.roundCall]} accessibilityLabel="Gọi khách">
                  <Icon name="phone" size={21} color={colors.navy} />
                </Pressable>
              </>
            ) : null}
          </View>
          <View style={styles.addrRow}>
            <Icon name="map-marker" size={20} color={colors.dangerMid} />
            <Text style={styles.addr}>{j.address_text}</Text>
          </View>
          {showMap ? (
            <View style={styles.navRow}>
              <Pressable onPress={navigate} style={styles.navBtn}>
                <Icon name="navigation-variant" size={20} color={palette.volt} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.navTitle}>Dẫn đường</Text>
                  <Text style={styles.navSub}>
                    {km !== null && km !== undefined ? `${fmtKm(km)} đường chim bay, khoảng ${etaMinutes(km)} phút` : 'Mở Google Maps'}
                  </Text>
                </View>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          {j.needs_safety_check ? <SafetyChecklist orderId={j.id} /> : null}

          {/* Công việc */}
          <Card style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.svcIcon}>
                <Icon name={serviceIcon(j.service_name)} size={22} color={palette.volt} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.service}>{j.service_name}</Text>
                <Text style={styles.category}>{j.category_name}{j.scheduled_at ? `, hẹn ${fmtWhenInline(j.scheduled_at)}` : ''}</Text>
              </View>
            </View>
            <Text style={styles.desc}>{j.description || 'Khách không để lại mô tả.'}</Text>
            {j.image_urls.length ? (
              <View style={{ marginTop: 6 }}>
                <PhotoGrid photos={j.image_urls.map((u) => ({ url: u }))} />
              </View>
            ) : null}
          </Card>

          {/* Ảnh trước / sau */}
          {j.status !== 'accepted' && j.status !== 'on_the_way' && j.status !== 'cancelled' ? (
            <Card style={{ gap: 12 }}>
              <SectionTitle>Ảnh công việc</SectionTitle>
              <PhotoLine
                title="Trước khi sửa"
                photos={beforePhotos}
                canAdd={j.can_add_photos}
                adding={before.uploading}
                onAdd={() => void uploadPhotos('before')}
                onRemove={j.status === 'completed' ? undefined : (id) => void removePhoto(id)}
              />
              <PhotoLine
                title="Sau khi sửa"
                required={j.status === 'in_progress'}
                photos={afterPhotos}
                canAdd={j.status === 'in_progress'}
                adding={after.uploading}
                onAdd={() => void uploadPhotos('after')}
                onRemove={j.status === 'completed' ? undefined : (id) => void removePhoto(id)}
              />
              <Text style={styles.small}>Ảnh là bằng chứng hoàn thành và căn cứ bảo hành nếu khách khiếu nại.</Text>
            </Card>
          ) : null}

          {/* Chi phí */}
          <Card style={{ gap: 2 }}>
            <SectionTitle>Chi phí</SectionTitle>
            <KeyValue label="Công cơ bản (bảng giá)" value={money(j.estimated_price)} />
            {j.extra_quotes.map((x) => {
              const off = x.status === 'cancelled' || x.status === 'rejected';
              const items = quoteItems(x.description);
              return (
                <View key={x.id} style={styles.quote}>
                  <View style={styles.quoteHead}>
                    <Text style={[styles.quoteTitle, off && styles.quoteOff]} numberOfLines={items.length > 1 ? 1 : 2}>
                      {items.length > 1 ? `Báo giá phát sinh (${items.length} mục)` : (items[0]?.name ?? x.description)}
                    </Text>
                    {/* Gạch ngang chỉ cho khoản không tính (đã rút / khách từ chối); khoản chờ duyệt tô vàng */}
                    <Text style={[styles.quoteAmt, x.status === 'pending' && { color: colors.warning }, off && styles.strike]}>+{money(x.amount)}</Text>
                  </View>
                  {items.length > 1
                    ? items.map((it, i) => (
                        <View key={i} style={styles.quoteItem}>
                          <Text style={[styles.quoteItemName, off && styles.quoteOff]}>{it.name}</Text>
                          {it.amount ? <Text style={[styles.quoteItemAmt, off && styles.quoteOff]}>{it.amount}</Text> : null}
                        </View>
                      ))
                    : null}
                  <View style={styles.quoteFoot}>
                    <QuoteStatus status={x.status} />
                    {x.status === 'pending' ? (
                      <Pressable
                        onPress={async () => {
                          if (!(await ui.confirm({ title: 'Rút lại báo giá này?', message: 'Khách sẽ không thấy báo giá này nữa. Bạn có thể gửi báo giá mới.', confirmText: 'Rút lại', tone: 'danger' }))) return;
                          try {
                            setJob(await api.cancelQuote(j.id, x.id));
                            ui.toast('Đã rút lại báo giá', 'info');
                          } catch (e) {
                            ui.toast(errMsg(e), 'error');
                          }
                        }}
                        hitSlop={8}
                      >
                        <Text style={styles.withdraw}>Rút lại</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
            <Divider style={{ marginVertical: 6 }} />
            <KeyValue label={priceFinal ? 'Khách trả' : 'Khách trả tạm tính'} value={money(j.total_amount)} strong />
            <KeyValue
              label={`Phí nền tảng ${Math.round(rate * 100)}%`}
              value={`-${money(j.earning?.commission_amount ?? Math.round((j.total_amount ?? 0) * rate))}`}
              color={colors.danger}
            />
            <View style={styles.netRow}>
              <Text style={styles.netLabel}>{priceFinal ? 'Bạn thực nhận' : 'Bạn nhận tạm tính'}</Text>
              <Text style={styles.netValue}>{money(j.earning?.net_amount ?? j.estimated_earning)}</Text>
            </View>
            {approvedExtra ? <Text style={styles.small}>Đã gồm {money(approvedExtra)} phát sinh khách đã đồng ý.</Text> : null}
            {pendingExtra ? (
              <View style={{ marginTop: 8 }}>
                <Banner
                  tone="warning"
                  icon="timer-sand"
                  text={`Chờ khách duyệt báo giá ${money(pendingExtra)}. Khách đồng ý thì bạn nhận thêm ${money(Math.round(pendingExtra * (1 - rate)))}, tổng ${money(
                    (j.earning?.net_amount ?? j.estimated_earning ?? 0) + Math.round(pendingExtra * (1 - rate)),
                  )}.`}
                />
              </View>
            ) : j.can_quote ? (
              <Button title="Báo giá phát sinh" icon="plus-circle-outline" variant="secondary" onPress={() => setQuoteOpen(true)} style={{ marginTop: 10 }} />
            ) : null}
          </Card>

          {/* Thanh toán */}
          {j.status === 'completed' ? (
            <Card style={{ gap: 10 }}>
              <SectionTitle>Thanh toán</SectionTitle>
              {/* Không nhận tiền mặt: khách trả qua MoMo / VNPay trên app khách, phần thực nhận tự vào ví thợ */}
              {j.paid ? (
                <Banner
                  tone="success"
                  text={`Khách đã thanh toán ${money(j.total_amount)} qua ${PAYMENT_LABEL[j.payment_method ?? ''] ?? 'app'}.${
                    j.earning ? ` Đã cộng ${money(j.earning.net_amount)} vào ví của bạn.` : ''
                  }`}
                />
              ) : pendingPayment ? (
                <Banner tone="info" icon="cellphone-check" text={`Khách đang thanh toán ${money(j.amount_due ?? j.total_amount)} qua ${PAYMENT_LABEL[pendingPayment.method] ?? 'app'}.`} />
              ) : (
                <Banner
                  tone="warning"
                  icon="cellphone-arrow-down"
                  text={`Chờ khách thanh toán ${money(j.amount_due ?? j.total_amount)} qua app (MoMo / VNPay). Khách trả xong, hệ thống tự xác nhận và cộng ${money(
                    Math.round((j.amount_due ?? j.total_amount) * (1 - rate)),
                  )} vào ví của bạn, bạn không cần bấm gì.`}
                />
              )}
              {j.awaiting_payment && !pendingPayment ? (
                <Text style={styles.small}>Thợ Nhanh không nhận tiền mặt. Nếu khách hỏi, hướng dẫn khách mở app Thợ Nhanh, vào đơn {orderCode(j)} và chọn Thanh toán.</Text>
              ) : null}
            </Card>
          ) : null}

          {/* Đánh giá của khách cho chính đơn này (ngoài màn "Đánh giá từ khách hàng" tổng hợp) */}
          {j.review ? (
            <Card style={{ gap: 6 }}>
              <SectionTitle>Khách đánh giá</SectionTitle>
              <StarRating value={j.review.rating} size={20} />
              {j.review.comment ? <Text style={styles.quoteText}>“{j.review.comment}”</Text> : <Text style={styles.small}>Khách không để lại nhận xét</Text>}
              <View style={styles.reviewFoot}>
                <Text style={styles.small}>{fmtDateTime(j.review.created_at)}</Text>
                {j.review.rating <= 3 ? (
                  <Pressable
                    onPress={() => navigation.navigate('ReportIssue', { orderId: j.id, type: 'Đánh giá không đúng sự thật' })}
                    hitSlop={8}
                    style={styles.dispute}
                  >
                    <Icon name="flag-outline" size={14} color={colors.muted} />
                    <Text style={styles.disputeText}>Khiếu nại đánh giá</Text>
                  </Pressable>
                ) : null}
              </View>
            </Card>
          ) : j.status === 'completed' ? (
            <Card style={{ gap: 4 }}>
              <SectionTitle>Khách đánh giá</SectionTitle>
              <Text style={styles.small}>Khách chưa đánh giá đơn này. Có đánh giá mới bạn sẽ nhận được thông báo.</Text>
            </Card>
          ) : null}

          {j.warranty ? (
            <Banner
              icon="shield-check-outline"
              tone="success"
              text={`${j.warranty.terms ?? 'Bảo hành'}, đến ${fmtDate(j.warranty.end_date)}${j.warranty.claim_status && ['open', 'processing'].includes(j.warranty.claim_status) ? '. Khách đang yêu cầu bảo hành.' : j.warranty.status === 'expired' ? ' (đã hết hạn)' : ''}`}
            />
          ) : null}

          {/* Lịch sử */}
          <Card style={{ gap: 0 }}>
            <SectionTitle>Diễn biến đơn</SectionTitle>
            {timeline.map((h, i) => (
              <View key={i} style={styles.hist}>
                <View style={styles.histRail}>
                  <View style={[styles.histDot, { backgroundColor: h.color }]} />
                  {i < timeline.length - 1 ? <View style={styles.histLine} /> : null}
                </View>
                <Text style={styles.histText}>{h.label}</Text>
                <Text style={styles.histTime}>{fmtDateTime(h.at)}</Text>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>

      {/* Nút nổi trên bản đồ; cuộn qua bản đồ thì thành thanh tiêu đề trắng */}
      <View
        style={[styles.floatTop, { paddingTop: insets.top + 8 }, solid && styles.floatTopSolid]}
        pointerEvents="box-none"
      >
        <Pressable onPress={() => navigation.goBack()} style={[styles.floatBtn, !solid && shadow.md]} accessibilityLabel="Quay lại">
          <Icon name="arrow-left" size={22} color={colors.navy} />
        </Pressable>
        {solid ? (
          <View style={{ flex: 1 }}>
            <Text style={styles.headTitle} numberOfLines={1}>
              {orderCode(j)}, {j.service_name}
            </Text>
            <Text style={[styles.headSub, { color: st.color }]}>{st.label}</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <Pressable onPress={more} style={[styles.floatBtn, !solid && shadow.md]} accessibilityLabel="Tùy chọn">
          <Icon name="dots-horizontal" size={22} color={colors.navy} />
        </Pressable>
      </View>

      {j.next_status && j.next_action ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {j.next_status === 'completed' && j.has_pending_quote ? (
            <Text style={styles.footerNote}>Chờ khách duyệt báo giá phát sinh trước khi hoàn thành</Text>
          ) : j.next_status === 'completed' && j.needs_after_photo ? (
            <Text style={styles.footerNote}>Vuốt để chụp ảnh kết quả và hoàn thành</Text>
          ) : j.next_status === 'in_progress' && !safetyDone(j.id) ? (
            <Text style={styles.footerNote}>Tick đủ 4 mục an toàn ở trên để bắt đầu sửa</Text>
          ) : j.start_available_at ? (
            <Text style={[styles.footerNote, { color: colors.muted }]}>
              Hẹn {fmtWhenInline(j.scheduled_at)}. Bắt đầu di chuyển được từ {fmtTime(j.start_available_at)}.
            </Text>
          ) : null}
          <SwipeButton
            label={swipeLabel[j.next_status] ?? `Vuốt để ${j.next_action.charAt(0).toLowerCase()}${j.next_action.slice(1)}`}
            variant={j.next_status === 'completed' ? 'success' : 'primary'}
            onConfirm={advance}
            disabled={(j.next_status === 'completed' && j.has_pending_quote) || !!j.start_available_at}
          />
        </View>
      ) : null}

      <FullMap
        visible={mapOpen}
        onClose={() => setMapOpen(false)}
        markers={markers}
        address={j.address_text}
        distance={km !== null && km !== undefined ? `${fmtKm(km)} đường chim bay, khoảng ${etaMinutes(km)} phút` : null}
        onNavigate={() => void navigate()}
      />

      <QuoteSheet
        visible={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        rate={rate}
        onSubmit={async (desc, amount) => {
          try {
            setJob(await api.createQuote(j.id, desc, amount));
            setQuoteOpen(false);
            ui.toast('Đã gửi báo giá, chờ khách xác nhận');
            return true;
          } catch (e) {
            void ui.alert('Chưa gửi được', errMsg(e), 'danger');
            return false;
          }
        }}
      />
    </View>
  );
}

/** Bản đồ đầu màn: vị trí thợ và khách (không vẽ đường nối: đường chim bay dễ hiểu nhầm là đường đi). Kéo/chụm được. */
function JobMap({
  markers,
  topInset,
  refit,
  onTouchActive,
}: {
  markers: MapMarker[];
  topInset: number;
  refit: number;
  onTouchActive: (active: boolean) => void;
}) {
  const data: MapData = useMemo(
    () => ({
      markers,
      fit: true,
      fitKey: `${markers.length}-${refit}`,
      zoom: 15.5,
      // Đáy: tấm trắng che 26 px + dòng ghi công bản đồ + nút "Xem bản đồ lớn" -> chừa đủ để biểu tượng không đè lên chữ
      padding: { top: topInset + 40, bottom: 62, left: 8, right: 56 },
      chromeBottom: 26,
      chromeLeft: 180,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(markers), topInset, refit],
  );
  return <AppMap data={data} style={StyleSheet.absoluteFill} onTouchActive={onTouchActive} />;
}

/** Bản đồ toàn màn hình: kéo/zoom tự do, nút về khung vừa thợ + khách, dẫn đường */
function FullMap({
  visible,
  onClose,
  markers,
  address,
  distance,
  onNavigate,
}: {
  visible: boolean;
  onClose: () => void;
  markers: MapMarker[];
  address: string;
  distance: string | null;
  onNavigate: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [refit, setRefit] = useState(0);
  const [cardH, setCardH] = useState(170);
  const data: MapData = useMemo(
    () => ({
      markers,
      fit: true,
      fitKey: `full-${refit}-${markers.length}`,
      zoom: 15.5,
      padding: { top: insets.top + 56, bottom: cardH, left: 8, right: 8 },
      chromeBottom: cardH,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(markers), refit, insets.top, cardH],
  );
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: colors.mapBg }}>
        {visible ? <AppMap data={data} style={StyleSheet.absoluteFill} /> : null}
        <View style={[styles.fullTop, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
          <Pressable onPress={onClose} style={[styles.floatBtn, shadow.md]} accessibilityLabel="Đóng bản đồ">
            <Icon name="arrow-left" size={22} color={colors.navy} />
          </Pressable>
          <Pressable onPress={() => setRefit((k) => k + 1)} style={[styles.floatBtn, shadow.md]} accessibilityLabel="Căn vừa thợ và khách">
            <Icon name="crosshairs-gps" size={22} color={colors.navy} />
          </Pressable>
        </View>
        <View
          style={[styles.fullCard, shadow.lg, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}
          onLayout={(e) => setCardH(Math.round(e.nativeEvent.layout.height))}
        >
          <View style={styles.addrRow}>
            <Icon name="map-marker" size={20} color={colors.dangerMid} />
            <View style={{ flex: 1 }}>
              <Text style={styles.addr}>{address}</Text>
              {distance ? <Text style={styles.custSub}>{distance}</Text> : null}
            </View>
          </View>
          <Button title="Dẫn đường bằng Google Maps" icon="navigation-variant" variant="accent" onPress={onNavigate} size="lg" />
        </View>
      </View>
    </Modal>
  );
}

function PhotoLine({
  title,
  photos,
  canAdd,
  adding,
  onAdd,
  onRemove,
  required,
}: {
  title: string;
  photos: { id: number; url: string }[];
  canAdd: boolean;
  adding: boolean;
  onAdd: () => void;
  onRemove?: (id: number) => void;
  required?: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={styles.photoTitle}>{title}</Text>
        {required && !photos.length ? <Tag label="Bắt buộc" color={colors.danger} /> : null}
        <View style={{ flex: 1 }} />
        {canAdd || photos.length ? (
          <Text style={styles.photoCount}>
            {photos.length}/{MAX_PICK}
          </Text>
        ) : null}
      </View>
      <PhotoGrid
        photos={photos}
        max={MAX_PICK}
        onAdd={canAdd ? onAdd : undefined}
        adding={adding}
        onRemove={onRemove ? (i) => onRemove(photos[i].id) : undefined}
        emptyText="Chưa có ảnh"
      />
    </View>
  );
}

/** Báo giá nhiều mục được gửi dạng "Tên x2: 190.000đ; Tên khác: 50.000đ" -> tách lại để hiện từng dòng */
function quoteItems(desc: string): { name: string; amount: string | null }[] {
  return desc
    .split('; ')
    .map((part) => {
      const m = /^(.*): ([\d.]+đ)$/.exec(part.trim());
      return m ? { name: m[1], amount: m[2] } : { name: part.trim(), amount: null };
    })
    .filter((x) => x.name);
}

function QuoteStatus({ status }: { status: string }) {
  const map: Record<string, [string, string, IconName]> = {
    pending: ['Chờ khách duyệt', colors.warning, 'timer-sand'],
    approved: ['Khách đã đồng ý', colors.success, 'check-circle-outline'],
    rejected: ['Khách từ chối', colors.danger, 'close-circle-outline'],
    cancelled: ['Đã rút lại', colors.faint, 'undo'],
  };
  const [label, color, icon] = map[status] ?? [status, colors.faint, 'help-circle-outline'];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
      <Icon name={icon} size={12} color={color} />
      <Text style={{ fontSize: 12, color, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  expand: {
    position: 'absolute',
    left: 14,
    bottom: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    ...shadow.sm,
  },
  expandText: { fontSize: 12, fontWeight: '700', color: colors.navy },
  reviewFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dispute: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  disputeText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  recenter: {
    position: 'absolute',
    right: 14,
    bottom: 72,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullTop: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between' },
  fullCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: 18,
    gap: 14,
  },
  sheetFlat: { marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  sheet: {
    marginTop: -24,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: 18,
    paddingTop: 16,
    gap: 14,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  statusChipText: { fontSize: 13, fontWeight: '700' },
  code: { fontSize: 13, color: colors.faint, fontWeight: '600', ...tabular },
  headline: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.4, marginTop: -4 },
  segs: { flexDirection: 'row', gap: 5 },
  seg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.line },
  segDone: { backgroundColor: colors.navy },
  segNow: { backgroundColor: palette.volt },
  segLabels: { flexDirection: 'row', gap: 5 },
  segLabel: { flex: 1, fontSize: 11, color: colors.faint, fontWeight: '600' },
  segLabelNow: { color: colors.text, fontWeight: '800' },
  customer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  custName: { fontSize: 17, fontWeight: '700', color: colors.text },
  custSub: { fontSize: 13, color: colors.muted, marginTop: 2, ...tabular },
  round: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  roundCall: { backgroundColor: palette.volt },
  dot: { position: 'absolute', top: 9, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.dangerMid, borderWidth: 2, borderColor: '#fff' },
  addrRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  addr: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '600', lineHeight: 21 },
  navRow: { flexDirection: 'row', gap: 10 },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.lg, backgroundColor: colors.navy },
  navTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  navSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 1 },
  body: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },
  svcIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  service: { fontSize: 17, fontWeight: '700', color: colors.text },
  category: { fontSize: 13, color: colors.muted, marginTop: 1 },
  desc: { fontSize: 15, color: colors.body, lineHeight: 22, marginTop: 6 },
  quoteText: { fontSize: 15, color: colors.body, lineHeight: 22, fontWeight: '500' },
  photoTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  photoCount: { fontSize: 12, fontWeight: '600', color: colors.faint, fontVariant: ['tabular-nums'] },
  quote: { paddingVertical: 8, gap: 4, borderTopWidth: 1, borderTopColor: colors.line, marginTop: 4 },
  quoteHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  quoteTitle: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '700' },
  quoteOff: { color: colors.faint },
  quoteItem: { flexDirection: 'row', gap: 10, paddingLeft: 10 },
  quoteItemName: { flex: 1, fontSize: 13, color: colors.body },
  quoteItemAmt: { fontSize: 13, color: colors.muted, ...tabular },
  quoteFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  quoteAmt: { fontSize: 14, fontWeight: '700', color: colors.text, ...tabular },
  strike: { color: colors.faint, textDecorationLine: 'line-through' },
  withdraw: { fontSize: 13, color: colors.danger, fontWeight: '700' },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.successBg,
  },
  netLabel: { fontSize: 15, fontWeight: '700', color: colors.success },
  netValue: { fontSize: 20, fontWeight: '800', color: colors.success, ...tabular },
  small: { fontSize: 12, color: colors.faint, lineHeight: 17 },
  hist: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, minHeight: 30 },
  histRail: { width: 10, alignItems: 'center', alignSelf: 'stretch', paddingTop: 5 },
  histDot: { width: 10, height: 10, borderRadius: 5 },
  histLine: { flex: 1, width: 2, backgroundColor: colors.line, marginTop: 2 },
  histText: { flex: 1, fontSize: 14, color: colors.body, fontWeight: '600' },
  histTime: { fontSize: 12, color: colors.faint, ...tabular },
  floatTop: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 14, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  floatTopSolid: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.line },
  floatBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  headTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  headSub: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  footer: { backgroundColor: colors.white, paddingHorizontal: 16, paddingTop: 12, gap: 8, ...shadow.lg },
  footerNote: { textAlign: 'center', fontSize: 12, color: colors.warning, fontWeight: '700' },
});
