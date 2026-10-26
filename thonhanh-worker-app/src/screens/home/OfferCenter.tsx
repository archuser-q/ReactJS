/**
 * Lời mời nhận đơn — hiện toàn màn hình ở BẤT KỲ màn nào khi có đơn mới (giống app tài xế):
 * rung máy, đếm ngược, thông tin việc, khoảng cách, thu nhập dự kiến; Nhận / Bỏ qua (chọn lý do).
 * Lời mời đến ngay qua Socket.IO (offer:new / offer:closed). Hỏi server định kỳ chỉ để dự phòng:
 * 15 giây khi kênh realtime đang nối, 3 giây khi mất kết nối socket.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, Vibration, View } from 'react-native';
import { Text } from '../../components/Text';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, ApiError, errMsg, qk, type HomeData, type Offer } from '../../api';
import { Button } from '../../components/Button';
import { CountdownRing } from '../../components/Charts';
import { Icon, type IconName } from '../../components/Icon';
import { mediaUri } from '../../config/env';
import { AppMap, type MapData } from '../../components/map/AppMap';
import { useOverlay } from '../../components/Overlay';
import { getDemoLocation } from '../../hooks/useLocation';
import { navigationRef } from '../../navigation/types';
import { isRealtimeConnected } from '../../realtime/useRealtime';
import { colors, op, palette, radius, shadow, tabular } from '../../theme';
import { etaMinutes, fmtKm, fmtWhenInline, money, orderCode, serviceIcon } from '../../utils/format';

const REJECT_REASONS = ['Đang bận việc khác', 'Quá xa', 'Không đúng chuyên môn', 'Thiếu dụng cụ / vật tư', 'Giá chưa phù hợp', 'Lý do khác'];

type OfferCtx = { offer: Offer | null; secondsLeft: number; open: () => void; hidden: boolean };
const Ctx = createContext<OfferCtx>({ offer: null, secondsLeft: 0, open: () => undefined, hidden: false });
export const useOffer = () => useContext(Ctx);

export function OfferCenter({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const qc = useQueryClient();
  const ui = useOverlay();
  const q = useQuery({
    queryKey: qk.offer,
    queryFn: api.currentOffer,
    enabled,
    refetchInterval: () => (enabled ? (isRealtimeConnected() ? 15_000 : 3_000) : false),
    refetchIntervalInBackground: false,
  });
  const offer = enabled ? (q.data ?? null) : null;

  // Hạn chót tính theo đồng hồ máy khi lần đầu nhận offer (dùng số giây server trả để tránh lệch giờ)
  const deadlines = useRef(new Map<number, number>());
  const [hiddenId, setHiddenId] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null);
  const seen = useRef(new Set<number>());

  if (offer && !deadlines.current.has(offer.id)) {
    deadlines.current.set(offer.id, Date.now() + offer.expires_in_seconds * 1000);
  }
  const secondsLeft = offer ? Math.max(0, Math.round(((deadlines.current.get(offer.id) ?? 0) - now) / 1000)) : 0;

  useEffect(() => {
    if (!offer) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [offer]);

  // Rung khi có đơn mới
  useEffect(() => {
    if (!offer || seen.current.has(offer.id)) return;
    seen.current.add(offer.id);
    if (Platform.OS === 'web') {
      try {
        navigator.vibrate?.([300, 150, 300]);
      } catch {
        // ignore
      }
    } else {
      Vibration.vibrate([0, 400, 200, 400, 200, 400]);
    }
  }, [offer]);

  // Hết giờ
  useEffect(() => {
    if (offer && secondsLeft === 0) {
      ui.toast('Lời mời đã hết thời gian', 'info');
      deadlines.current.delete(offer.id);
      qc.setQueryData(qk.offer, null);
      void qc.invalidateQueries({ queryKey: qk.offer });
    }
  }, [offer, secondsLeft, qc, ui]);

  const close = useCallback(() => {
    qc.setQueryData(qk.offer, null);
    void qc.invalidateQueries({ queryKey: qk.offer });
    void qc.invalidateQueries({ queryKey: qk.home });
  }, [qc]);

  const accept = async () => {
    if (!offer) return;
    setBusy('accept');
    try {
      const job = await api.acceptOffer(offer.id);
      close();
      qc.setQueryData(qk.job(job.id), job);
      void qc.invalidateQueries({ queryKey: ['jobs'] });
      ui.toast('Đã nhận đơn! Liên hệ khách và xuất phát nhé');
      if (navigationRef.isReady()) navigationRef.navigate('JobDetail', { orderId: job.id });
    } catch (e) {
      close();
      void ui.alert(e instanceof ApiError && e.status === 409 ? 'Không kịp rồi' : 'Không nhận được đơn', errMsg(e), 'warning');
    } finally {
      setBusy(null);
    }
  };

  const reject = async () => {
    if (!offer) return;
    const reason = await ui.choose({ title: 'Bỏ qua đơn này?', message: 'Chọn lý do để hệ thống gợi ý đơn phù hợp hơn.', choices: REJECT_REASONS, confirmText: 'Bỏ qua đơn', tone: 'warning' });
    if (!reason) return;
    setBusy('reject');
    try {
      await api.rejectOffer(offer.id, reason);
    } catch {
      // đơn đã hết hạn / có người nhận: coi như đã bỏ qua
    } finally {
      setBusy(null);
      close();
    }
  };

  const value = useMemo(
    () => ({ offer, secondsLeft, open: () => setHiddenId(null), hidden: !!offer && hiddenId === offer.id }),
    [offer, secondsLeft, hiddenId],
  );
  const visible = !!offer && hiddenId !== offer.id && secondsLeft > 0;

  return (
    <Ctx.Provider value={value}>
      {children}
      {offer ? (
        <OfferModal
          visible={visible}
          offer={offer}
          secondsLeft={secondsLeft}
          busy={busy}
          onAccept={accept}
          onReject={reject}
          onMinimize={() => setHiddenId(offer.id)}
        />
      ) : null}
    </Ctx.Provider>
  );
}

function OfferModal({
  visible,
  offer,
  secondsLeft,
  busy,
  onAccept,
  onReject,
  onMinimize,
}: {
  visible: boolean;
  offer: Offer;
  secondsLeft: number;
  busy: 'accept' | 'reject' | null;
  onAccept: () => void;
  onReject: () => void;
  onMinimize: () => void;
}) {
  const insets = useSafeAreaInsets();
  const ui = useOverlay();
  const qc = useQueryClient();
  const { height: winH } = useWindowDimensions();
  const home = qc.getQueryData<HomeData>(qk.home);
  const me = home?.location ?? getDemoLocation();
  const km = offer.distance_km;
  const mapH = Math.round(winH * 0.34);
  const [refit, setRefit] = useState(0);

  // Bản đồ kéo/chụm được (không nằm trong vùng cuộn nên không tranh cử chỉ với trang); nút ⌖ căn lại vừa thợ + khách
  const mapData: MapData = useMemo(
    () => ({
      markers: [
        ...(me ? [{ id: 'me', lat: me.latitude, lng: me.longitude, kind: 'worker' as const }] : []),
        { id: 'c', lat: offer.latitude, lng: offer.longitude, kind: 'customer' as const },
      ],
      // Chỉ hiện vị trí thợ và khách, không vẽ đường nối (đường chim bay dễ bị hiểu nhầm là đường đi)
      fit: true,
      fitKey: `${offer.id}-${refit}`,
      zoom: 15,
      interactive: true,
      padding: { top: insets.top + 64, bottom: 56, left: 8, right: 8 },
      chromeBottom: 24,
      chromeLeft: 64,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [offer.id, me?.latitude, me?.longitude, insets.top, refit],
  );

  const rows: { icon: IconName; label: string; value: string }[] = [
    { icon: 'map-marker-outline', label: 'Địa chỉ', value: offer.address_text },
    { icon: 'clock-outline', label: 'Thời gian', value: offer.scheduled_at ? `Hẹn ${fmtWhenInline(offer.scheduled_at)}` : 'Làm ngay bây giờ' },
    { icon: 'text-box-outline', label: 'Khách mô tả', value: offer.description || 'Khách không để lại mô tả' },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onMinimize} transparent statusBarTranslucent>
      <View style={styles.wrap}>
        <View style={{ height: mapH }}>
          <AppMap data={mapData} style={StyleSheet.absoluteFill} />
          <View style={[styles.mapTop, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
            <Pressable onPress={onMinimize} style={[styles.min, shadow.md]} hitSlop={10} accessibilityLabel="Thu nhỏ">
              <Icon name="chevron-down" size={24} color={colors.navy} />
            </Pressable>
            <View style={[styles.ringWrap, shadow.md]}>
              <CountdownRing seconds={secondsLeft} total={offer.timeout_seconds} size={58} color={colors.navy} />
            </View>
          </View>
          <Pressable onPress={() => setRefit((k) => k + 1)} style={[styles.recenter, shadow.md]} hitSlop={8} accessibilityLabel="Căn vừa thợ và khách">
            <Icon name="crosshairs-gps" size={20} color={colors.navy} />
          </Pressable>
        </View>

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.kickerRow}>
              <View style={styles.kickerDot} />
              <Text style={styles.kicker}>{offer.scheduled_at ? 'Lịch hẹn mới cho bạn' : 'Đơn mới gần bạn'}</Text>
              <Text style={styles.code}>{orderCode({ id: offer.order_id, code: offer.code })}</Text>
            </View>

            <View style={styles.service}>
              <View style={styles.serviceIcon}>
                <Icon name={serviceIcon(offer.service_name)} size={26} color={palette.volt} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{offer.service_name}</Text>
                <Text style={styles.category}>
                  {offer.category_name}, khách {offer.customer_name}
                </Text>
              </View>
            </View>

            <View style={styles.earn}>
              <View style={{ flex: 1 }}>
                <Text style={styles.earnLabel}>Bạn nhận tạm tính</Text>
                <Text style={styles.earnValue} numberOfLines={1} adjustsFontSizeToFit>
                  {money(offer.estimated_earning)}
                </Text>
                <Text style={styles.earnSub}>
                  Công cơ bản {money(offer.estimated_price)}, phí nền tảng {Math.round(offer.commission_rate * 100)}%
                </Text>
              </View>
              {km !== null ? (
                <View style={styles.dist}>
                  <Text style={styles.distValue}>{fmtKm(km)}</Text>
                  <Text style={styles.distSub}>đường chim bay</Text>
                  <Text style={styles.distSub}>~{etaMinutes(km)} phút xe máy</Text>
                </View>
              ) : null}
            </View>
            {/* Giá giống app dịch vụ tại nhà: công cơ bản theo bảng giá niêm yết để khách biết trước khi đặt,
                vật tư / việc làm thêm thì thợ báo giá sau khi xem tận nơi, khách duyệt rồi mới cộng */}
            <View style={styles.priceNote}>
              <Icon name="information-outline" size={16} color={colors.muted} style={{ marginTop: 1 }} />
              <Text style={styles.priceNoteText}>
                Giá công theo bảng giá Thợ Nhanh. Cần thay vật tư hay làm thêm thì đến nơi báo giá phát sinh, khách đồng ý mới cộng vào.
              </Text>
            </View>

            <View>
              {rows.map((r, i) => (
                <View key={r.label} style={[styles.row, i > 0 && styles.rowLine]}>
                  <Icon name={r.icon} size={20} color={colors.navy} style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{r.label}</Text>
                    <Text style={styles.rowValue}>{r.value}</Text>
                  </View>
                </View>
              ))}
              {offer.image_urls.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 8 }}>
                  {offer.image_urls.map((u) => (
                    <Pressable key={u} onPress={() => ui.viewImage(u)}>
                      <Image source={{ uri: mediaUri(u) }} style={styles.thumb} />
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
            </View>

            {offer.match_score !== null ? (
              <View style={styles.match}>
                <Icon name="chart-donut" size={16} color={colors.muted} />
                <Text style={styles.matchText}>
                  Độ phù hợp {Math.round(offer.match_score * 100)}/100 theo thuật toán ghép{' '}
                  {offer.mode === 'batch' ? 'theo lô' : `tức thời, đợt mời ${offer.round}`}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <Button title="Bỏ qua" variant="outline" onPress={onReject} loading={busy === 'reject'} disabled={!!busy} style={{ flex: 1 }} size="lg" />
            <Button
              title="Nhận đơn"
              variant="accent"
              icon="check-bold"
              onPress={onAccept}
              loading={busy === 'accept'}
              disabled={!!busy}
              style={{ flex: 1.7 }}
              size="lg"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.mapBg },
  mapTop: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  min: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  ringWrap: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  recenter: {
    position: 'absolute',
    left: 14,
    bottom: 34,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    flex: 1,
    marginTop: -22,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: 20,
  },
  body: { paddingTop: 18, paddingBottom: 12, gap: 16 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kickerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.volt },
  kicker: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.navy },
  code: { fontSize: 13, color: colors.faint, fontWeight: '500', ...tabular },
  service: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  serviceIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  serviceName: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  category: { fontSize: 14, color: colors.muted, marginTop: 2 },
  earn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.xl,
    backgroundColor: colors.voltSoft,
  },
  earnLabel: { fontSize: 13, fontWeight: '600', color: colors.warning },
  earnValue: { fontSize: 34, fontWeight: '800', color: colors.navy, letterSpacing: -0.5, ...tabular },
  earnSub: { fontSize: 12, color: colors.body, marginTop: 2 },
  priceNote: { flexDirection: 'row', gap: 8, marginTop: -6 },
  priceNoteText: { flex: 1, fontSize: 12, color: colors.muted, lineHeight: 17 },
  dist: { alignItems: 'flex-end', paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: op(colors.navy, 0.12) },
  distValue: { fontSize: 22, fontWeight: '800', color: colors.navy, ...tabular },
  distSub: { fontSize: 12, color: colors.body, marginTop: 2 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', paddingVertical: 12 },
  rowLine: { borderTopWidth: 1, borderTopColor: colors.line },
  rowLabel: { fontSize: 12, color: colors.faint, fontWeight: '500' },
  rowValue: { fontSize: 15, color: colors.text, fontWeight: '600', marginTop: 2, lineHeight: 21 },
  thumb: { width: 84, height: 84, borderRadius: 12, backgroundColor: colors.line },
  match: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.bg },
  matchText: { flex: 1, fontSize: 12, color: colors.muted, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 12, paddingTop: 10 },
});
