import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { api, errMsg, qk, type AppNotification, type HomeData } from '../../api';
import { useWorkerMe } from '../../auth/AuthContext';
import { Icon, type IconName } from '../../components/Icon';
import { useOverlay } from '../../components/Overlay';
import { Header, Screen } from '../../components/Screen';
import { StateView } from '../../components/StateView';
import { useRootNav } from '../../navigation/types';
import { colors, op, radius } from '../../theme';
import { timeAgo } from '../../utils/format';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';

// Loại thông báo theo quy ước chung của backend (bảng notifications, cột type)
const TYPE: Record<string, { icon: IconName; color: string }> = {
  offer: { icon: 'bell-ring-outline', color: colors.primary },
  order: { icon: 'clipboard-check-outline', color: colors.primary },
  quote: { icon: 'file-document-edit-outline', color: colors.warning },
  payment: { icon: 'cash-check', color: colors.success },
  review: { icon: 'star-outline', color: colors.amber },
  chat: { icon: 'message-text-outline', color: colors.violet },
  verification: { icon: 'shield-account-outline', color: colors.success },
  warranty: { icon: 'shield-refresh-outline', color: colors.warning },
  complaint: { icon: 'alert-circle-outline', color: colors.danger },
};

/** Biểu tượng theo loại + chi tiết (nhắc lịch, huỷ đơn, rút tiền) */
function metaOf(n: AppNotification) {
  if (n.data?.kind === 'schedule_reminder') return { icon: 'alarm' as IconName, color: colors.primary };
  if (n.data?.withdrawal_id) return { icon: 'bank-transfer-out' as IconName, color: colors.success };
  if (n.type === 'order' && /huỷ|hủy|Chưa tìm được/i.test(n.title)) return { icon: 'close-circle-outline' as IconName, color: colors.danger };
  return TYPE[n.type] ?? { icon: 'bell-outline' as IconName, color: colors.primary };
}

export default function NotificationsScreen() {
  const navigation = useRootNav();
  const qc = useQueryClient();
  const ui = useOverlay();
  const me = useWorkerMe();
  const approved = me.data?.profile.verification_status === 'approved';
  const q = useInfiniteQuery({
    queryKey: qk.notifications,
    queryFn: ({ pageParam }) => api.notifications(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
  });
  useRefetchOnFocus(q.refetch);
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];

  const open = async (n: AppNotification) => {
    if (!n.is_read) {
      api.markNotificationRead(n.id).catch(() => undefined);
      qc.setQueryData(qk.notifications, (old: typeof q.data) =>
        old ? { ...old, pages: old.pages.map((p) => ({ ...p, items: p.items.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)) })) } : old,
      );
      void qc.invalidateQueries({ queryKey: qk.home });
    }
    const t = n.type ?? '';
    const orderId = n.data?.order_id;
    if (t === 'verification') return navigation.navigate(approved ? 'Documents' : 'Onboarding');
    if (!approved) return;
    if (n.data?.withdrawal_id) return navigation.navigate('WalletHistory');
    if (t === 'offer') return navigation.navigate('Main', { screen: 'Home' });
    if (orderId) {
      try {
        await api.job(orderId);
        navigation.navigate('JobDetail', { orderId });
      } catch {
        ui.toast('Đơn này không còn do bạn phụ trách', 'info');
      }
    }
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  const readAll = async () => {
    // Đổi giao diện ngay (không chờ máy chủ); số thông báo được đánh dấu lấy từ máy chủ (gồm cả trang chưa tải)
    qc.setQueryData(qk.notifications, (old: typeof q.data) =>
      old ? { ...old, pages: old.pages.map((p) => ({ ...p, items: p.items.map((x) => ({ ...x, is_read: true })) })) } : old,
    );
    try {
      const { updated } = await api.markAllNotificationsRead();
      ui.toast(updated ? `Đã đánh dấu đã đọc ${updated} thông báo` : 'Bạn đã đọc hết thông báo', updated ? 'success' : 'info');
      qc.setQueryData<HomeData>(qk.home, (h) => (h ? { ...h, unread_notifications: 0 } : h));
      void qc.invalidateQueries({ queryKey: qk.home });
    } catch (e) {
      void q.refetch();
      ui.toast(errMsg(e), 'error');
    }
  };

  return (
    <Screen>
      <Header
        title="Thông báo"
        subtitle={unreadCount ? `${unreadCount} chưa đọc` : items.length ? 'Đã đọc hết' : undefined}
        right={
          <Pressable onPress={() => void readAll()} style={[styles.readAll, !unreadCount && { opacity: 0.45 }]} hitSlop={8} accessibilityLabel="Đánh dấu đã đọc tất cả">
            <Icon name="check-all" size={16} color={colors.primary} />
            <Text style={styles.readAllText}>Đọc tất cả</Text>
          </Pressable>
        }
      />
      <FlatList
        data={items}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.primary} />}
        onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && void q.fetchNextPage()}
        renderItem={({ item: n }) => {
          const t = metaOf(n);
          return (
            <Pressable onPress={() => void open(n)} style={[styles.item, !n.is_read && styles.unread]}>
              <View style={[styles.icon, { backgroundColor: op(t.color, 0.12) }]}>
                <Icon name={t.icon} size={20} color={t.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, !n.is_read && { fontWeight: '800' }]}>{n.title}</Text>
                {n.body ? (
                  <Text style={styles.body} numberOfLines={3}>
                    {n.body}
                  </Text>
                ) : null}
                <Text style={styles.time}>{timeAgo(n.created_at)}</Text>
              </View>
              {!n.is_read ? <View style={styles.dot} /> : null}
            </Pressable>
          );
        }}
        ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : null}
        ListEmptyComponent={<StateView loading={q.isLoading} error={q.error ? errMsg(q.error) : null} empty="Chưa có thông báo" icon="bell-outline" />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: 12, padding: 14, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, alignItems: 'flex-start' },
  unread: { borderColor: colors.primarySoft, backgroundColor: '#F8FBFF' },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '600', color: colors.text },
  body: { fontSize: 13, color: colors.muted, marginTop: 3, lineHeight: 19 },
  time: { fontSize: 11, color: colors.faint, marginTop: 6 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary, marginTop: 6 },
  readAll: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight },
  readAllText: { fontSize: 13, fontWeight: '700', color: colors.primary },
});
