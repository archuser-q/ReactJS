import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header, Screen } from '../components/Screen';
import { StateView } from '../components/StateView';
import { api, errMsg, type OrderItem } from '../api';
import { useApi } from '../hooks/useApi';
import { ORDER_STATUS, WAITING_STATUSES, fmtDate, money } from '../utils/format';
import { useNav } from '../navigation/NavigationContext';
import { colors, mono, shadowSm } from '../theme';

const PAGE_SIZE = 20;

export default function HistoryScreen() {
  const { navigate } = useNav();
  const q = useApi(() => api.listOrders({ page: 1, pageSize: PAGE_SIZE }), []);
  const [more, setMore] = useState<OrderItem[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  const items = [...(q.data?.items ?? []), ...more];
  const total = q.data?.total ?? 0;

  const refresh = async () => {
    setMore([]);
    setPage(1);
    await q.refresh();
  };

  const loadMore = async () => {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const res = await api.listOrders({ page: page + 1, pageSize: PAGE_SIZE });
      setMore((prev) => [...prev, ...res.items.filter((o) => !items.some((x) => x.id === o.id))]);
      setPage(page + 1);
    } catch (e) {
      setMoreError(errMsg(e));
    } finally {
      setLoadingMore(false);
    }
  };

  // Đơn chưa có thợ -> màn tìm thợ; còn lại -> màn theo dõi (có thanh toán, đánh giá, bảo hành)
  const open = (o: OrderItem) => navigate(WAITING_STATUSES.includes(o.status) ? 'match' : 'track', { orderId: o.id });

  return (
    <Screen>
      <Header title="Lịch sử đơn hàng" subtitle={total ? `${total} đơn` : undefined} />
      {!q.data ? (
        <StateView loading={q.loading} error={q.error} onRetry={() => q.reload()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />}
          onScroll={({ nativeEvent: e }) => {
            if (e.layoutMeasurement.height + e.contentOffset.y >= e.contentSize.height - 200) void loadMore();
          }}
          scrollEventThrottle={200}
        >
          {items.length === 0 && (
            <StateView empty="Bạn chưa có đơn hàng nào" icon="clipboard-list-outline" actionLabel="Đặt dịch vụ" onAction={() => navigate('home')} />
          )}
          {items.map((o) => {
            const s = ORDER_STATUS[o.status];
            return (
              <Pressable key={o.id} onPress={() => open(o)} style={styles.card}>
                <View style={styles.top}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.service}>{o.service_name}</Text>
                    <Text style={styles.sub}>{o.worker?.full_name ?? 'Chưa có thợ'} · {fmtDate(o.created_at)}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
                  </View>
                </View>
                <View style={styles.bottom}>
                  <Text style={styles.id}>{o.code}</Text>
                  <Text style={styles.amount}>{money(o.total_amount)}</Text>
                </View>
              </Pressable>
            );
          })}
          {loadingMore && <ActivityIndicator color={colors.primary} style={{ paddingVertical: 12 }} />}
          {moreError && (
            <Pressable onPress={loadMore}>
              <Text style={{ fontSize: 12, color: colors.red500, textAlign: 'center' }}>{moreError} · Chạm để thử lại</Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  card: {
    padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.gray100,
    backgroundColor: '#fff', ...shadowSm,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  service: { fontSize: 14, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  bottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.gray100,
  },
  id: { fontSize: 12, color: colors.gray400, fontFamily: mono },
  amount: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
