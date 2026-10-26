import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { PulseDot } from '../components/PulseDot';
import { Header, Screen } from '../components/Screen';
import { StateView } from '../components/StateView';
import { api, errMsg, type OrderDetail, type OrderUpdatedEvent, type WorkerLocationEvent } from '../api';
import { useApi, useInterval } from '../hooks/useApi';
import { ORDER_STATUS, WAITING_STATUSES, etaMinutes, fmtKm, fmtTime, haversineKm, money } from '../utils/format';
import { useSocketEvent } from '../realtime/socket';
import { confirmCancel } from '../utils/cancel';
import { useNav } from '../navigation/NavigationContext';
import { colors, mono, op } from '../theme';

// Realtime (Socket.IO) là chính; hỏi lại server định kỳ để phòng mất kết nối
const POLL_MS = 15000;

const MODE_LABEL = { instant: 'tức thời', batch: 'theo lô', auto: 'tự động' } as const;

/** Dòng tiến độ tìm thợ: đợt mời, số lời mời đã gửi, giờ hệ thống tự huỷ nếu chưa có thợ */
function searchingText(order: OrderDetail): string {
  const s = order.searching;
  if (order.scheduled_at && !s?.offers_sent) return 'Đơn hẹn giờ: hệ thống sẽ mời thợ trước giờ hẹn';
  if (!s || s.offers_sent === 0) return 'Đang tìm thợ đang bật nhận đơn gần bạn...';
  const parts = [`Đợt mời ${Math.max(1, s.rounds)} · đã mời ${s.offers_sent} thợ (ghép ${MODE_LABEL[s.mode] ?? s.mode})`];
  if (s.deadline_at && !order.scheduled_at) parts.push(`chờ tối đa tới ${fmtTime(s.deadline_at)}`);
  return parts.join(' · ');
}

export default function MatchScreen() {
  const { navigate, orderId } = useNav();
  const [cancelling, setCancelling] = useState(false);

  const q = useApi(async () => {
    if (!orderId) return null;
    const order = await api.getOrder(orderId);
    if (!order.worker) return { order, worker: null, tracking: null };
    const [worker, tracking] = await Promise.all([api.getWorker(order.worker.id), api.getTracking(order.id)]);
    return { order, worker, tracking };
  }, [orderId]);

  const order = q.data?.order;
  const waiting = !!order && WAITING_STATUSES.includes(order.status);
  useInterval(() => q.reload(true), POLL_MS, waiting);
  // Thợ nhận đơn / đơn đổi trạng thái / thợ di chuyển -> tải lại ngay
  useSocketEvent<OrderUpdatedEvent>('order:updated', (e) => e.order_id === orderId && q.reload(true), !!orderId);
  useSocketEvent<WorkerLocationEvent>('worker:location', (e) => e.order_id === orderId && q.reload(true), !!orderId);
  useSocketEvent('connect', () => q.reload(true), !!orderId);

  if (!orderId) {
    return (
      <Screen>
        <Header title="Thợ phù hợp" />
        <StateView empty="Chưa có yêu cầu nào đang tìm thợ" icon="account-search-outline" actionLabel="Đặt dịch vụ" onAction={() => navigate('home')} />
      </Screen>
    );
  }
  if (!q.data || !order) {
    return (
      <Screen>
        <Header title="Thợ phù hợp" />
        <StateView loading={q.loading} error={q.error} onRetry={() => q.reload()} />
      </Screen>
    );
  }

  const cancel = () =>
    confirmCancel(async (reason) => {
      setCancelling(true);
      try {
        await api.cancelOrder(order.id, reason);
        await q.reload(true);
      } catch (e) {
        Alert.alert('Không hủy được', errMsg(e));
      } finally {
        setCancelling(false);
      }
    });

  const w = q.data.worker;
  const t = q.data.tracking;
  const km =
    t?.worker_lat != null && t.worker_lng != null ? haversineKm(t.worker_lat, t.worker_lng, order.lat, order.lng) : null;
  const avg = w && w.rating_count > 0 ? w.rating_avg : null;
  const trust = Math.round((w?.trust_score ?? 0) * 100);

  const subtitle =
    WAITING_STATUSES.includes(order.status)
      ? 'Đang tìm thợ gần bạn...'
      : order.status === 'cancelled'
        ? 'Yêu cầu đã hủy'
        : 'Đã tìm được thợ cho bạn';

  return (
    <Screen>
      <Header title="Thợ phù hợp" subtitle={subtitle} />
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View style={styles.info}>
          <Icon name="lightning-bolt" size={14} color={colors.blue500} />
          <Text style={styles.infoText}>
            Hệ thống tự gửi lời mời cho thợ phù hợp nhất theo{' '}
            <Text style={{ fontWeight: '700' }}>khoảng cách, độ tin cậy, kinh nghiệm</Text>. Ai nhận trước sẽ đến; đông đơn thì
            hệ thống ghép theo lô (Hungarian) để mọi người đều có thợ gần.
          </Text>
        </View>

        {/* Thông tin yêu cầu */}
        <View style={styles.card}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{order.service_name}</Text>
            <Text style={[styles.price, { color: colors.primary }]}>{money(order.total_amount)}</Text>
          </View>
          <Text style={styles.spec} numberOfLines={2}>{order.code} · {order.address_text}</Text>
          <View style={[styles.meta, { marginTop: 10 }]}>
            {waiting ? (
              <View style={styles.metaItem}>
                <PulseDot size={6} color={colors.primary} />
                <Text style={[styles.metaText, { color: colors.primary, fontWeight: '600', flexShrink: 1 }]}>
                  {searchingText(order)}
                </Text>
              </View>
            ) : (
              <View style={styles.metaItem}>
                <Text style={[styles.metaText, { color: ORDER_STATUS[order.status].color, fontWeight: '600' }]}>
                  {ORDER_STATUS[order.status].label}
                </Text>
              </View>
            )}
          </View>
          {order.can_cancel && (
            <Pressable onPress={cancel} disabled={cancelling} style={[styles.cancel, cancelling && { opacity: 0.5 }]}>
              <Text style={styles.cancelText}>{cancelling ? 'Đang hủy...' : 'Hủy yêu cầu'}</Text>
            </Pressable>
          )}
        </View>

        {order.status === 'cancelled' && (
          <StateView empty={order.cancel_reason ? `Lý do: ${order.cancel_reason}` : 'Yêu cầu đã hủy'} icon="close-circle-outline" actionLabel="Đặt lại" onAction={() => navigate('home')} />
        )}

        {/* Thợ đã nhận đơn */}
        {w && (
          <View style={[styles.card, { borderColor: colors.primary, backgroundColor: op(colors.primary, 0.04) }]}>
            <View style={styles.row}>
              <View>
                <Avatar name={w.full_name} size={48} uri={w.avatar_url} />
                <View style={styles.verified}>
                  <Icon name="check" size={10} color="#fff" />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{w.full_name}</Text>
                  <Text style={[styles.price, { color: colors.primary }]}>{money(order.total_amount)}</Text>
                </View>
                <Text style={styles.spec}>
                  {w.level.name}
                  {w.experience_years ? ` · ${w.experience_years} năm kinh nghiệm` : ''}
                  {w.has_certificate ? ' · có chứng chỉ nghề điện' : ''}
                </Text>
                <View style={styles.meta}>
                  <View style={styles.metaItem}>
                    <Icon name="star" size={12} color={colors.amber400} />
                    <Text style={styles.rating}>{avg ? avg.toFixed(1) : 'Mới'}</Text>
                    <Text style={styles.metaText}>({w.rating_count})</Text>
                  </View>
                  {km !== null && (
                    <>
                      <View style={styles.metaItem}>
                        <Icon name="map-marker-outline" size={12} color={colors.gray400} />
                        <Text style={styles.metaText}>{fmtKm(km)}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Icon name="clock-outline" size={12} color={colors.gray400} />
                        <Text style={styles.metaText}>~{etaMinutes(km)} phút</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.trustRow}>
              <Icon name="shield-check" size={14} color={colors.emerald500} />
              <View style={styles.trackBar}>
                <View style={[styles.fill, { width: `${trust}%` }]} />
              </View>
              <Text style={styles.trust}>{trust}/100</Text>
            </View>

            <Pressable onPress={() => navigate('track', { orderId: order.id })} style={styles.choose}>
              <Text style={styles.chooseText}>Theo dõi thợ</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 12 },
  info: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12,
    backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: colors.blue100,
  },
  infoText: { flex: 1, fontSize: 12, color: colors.blue700, lineHeight: 17 },
  card: {
    padding: 16, borderRadius: 16, borderWidth: 2, borderColor: colors.gray100, backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  verified: {
    position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.blue500, borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 14, fontWeight: '700', color: colors.text },
  price: { fontSize: 14, fontWeight: '700' },
  spec: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { fontSize: 12, fontWeight: '600', color: colors.text },
  metaText: { fontSize: 12, color: colors.gray400 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trackBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.gray100, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.emerald500 },
  trust: { fontSize: 12, fontWeight: '700', color: colors.emerald600, fontFamily: mono },
  choose: {
    marginTop: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center',
  },
  chooseText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cancel: {
    marginTop: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.red100, alignItems: 'center',
  },
  cancelText: { color: colors.red500, fontSize: 14, fontWeight: '600' },
});
