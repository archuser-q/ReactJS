import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../components/Icon';
import { DetailHeader, Screen } from '../components/Screen';
import { StateView } from '../components/StateView';
import { api, type AppNotification } from '../api';
import { useApi } from '../hooks/useApi';
import { useSocketEvent } from '../realtime/socket';
import { fmtDateTime } from '../utils/format';
import { useNav } from '../navigation/NavigationContext';
import { colors } from '../theme';

// type do backend đặt (src/services/customer/notify.service.js)
const TYPE_ICON: Record<string, IconName> = {
  order: 'navigation-outline',
  chat: 'message-text-outline',
  quote: 'file-document-edit-outline',
  payment: 'cash',
  review: 'star-outline',
  complaint: 'alert-circle-outline',
  warranty: 'shield-check-outline',
};

export default function NotificationsScreen() {
  const { navigate } = useNav();
  const q = useApi(() => api.listNotifications({ pageSize: 50 }), []);
  useSocketEvent('notification:new', () => q.reload(true));
  const items = q.data?.items ?? [];
  const hasUnread = items.some((n) => !n.is_read);

  const open = async (n: AppNotification) => {
    if (!n.is_read) {
      q.setData((d) => d && { ...d, items: d.items.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)) });
      api.markNotificationRead(n.id).catch(() => {});
    }
    const orderId = n.data?.order_id;
    if (!orderId) return;
    if (n.type === 'chat') navigate('chat', { orderId });
    else navigate('track', { orderId });
  };

  const readAll = async () => {
    q.setData((d) => d && { ...d, items: d.items.map((x) => ({ ...x, is_read: true })) });
    await api.markAllNotificationsRead().catch(() => {});
  };

  return (
    <Screen bg={colors.pageBg}>
      <DetailHeader title="Thông báo" />
      {!q.data ? (
        <StateView loading={q.loading} error={q.error} onRetry={() => q.reload()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          {hasUnread && (
            <Pressable onPress={readAll} style={{ alignSelf: 'flex-end' }} hitSlop={8}>
              <Text style={styles.readAll}>Đánh dấu đã đọc tất cả</Text>
            </Pressable>
          )}
          {items.length === 0 && <StateView empty="Chưa có thông báo nào" icon="bell-outline" />}
          {items.map((n) => (
            <Pressable key={n.id} style={[styles.card, !n.is_read && styles.unread]} onPress={() => open(n)}>
              <View style={styles.icon}>
                <Icon name={TYPE_ICON[n.type ?? ''] ?? 'bell-outline'} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, !n.is_read && { fontWeight: '700' }]}>{n.title}</Text>
                {n.body ? <Text style={styles.text} numberOfLines={2}>{n.body}</Text> : null}
                <Text style={styles.time}>{fmtDateTime(n.created_at)}</Text>
              </View>
              {!n.is_read && <View style={styles.dot} />}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  readAll: { fontSize: 12, fontWeight: '600', color: colors.primary, marginBottom: 4 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: colors.gray100, padding: 14,
  },
  unread: { borderColor: colors.primaryMuted, backgroundColor: colors.primaryLight },
  icon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.gray100,
  },
  title: { fontSize: 14, fontWeight: '500', color: colors.text },
  text: { fontSize: 12, color: colors.gray500, marginTop: 2, lineHeight: 17 },
  time: { fontSize: 11, color: colors.gray400, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
});
