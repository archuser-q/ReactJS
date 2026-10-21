import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/Avatar';
import { Screen } from '../components/Screen';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';
import { useSocketEvent } from '../realtime/socket';
import { ORDER_STATUS, WAITING_STATUSES, decorateService, fmtDate, money, serviceIcon } from '../utils/format';
import { useNav } from '../navigation/NavigationContext';
import { GRADIENT, GRADIENT_PROPS, colors, op } from '../theme';

const PREVIEW_COUNT = 6;

export default function HomeScreen() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const itemW = (width - 40 - 24) / 3;
  const [keyword, setKeyword] = useState('');
  const [showAll, setShowAll] = useState(false);

  const services = useApi(async () => (await api.listServices()).map(decorateService), []);
  const home = useApi(async () => {
    const [active, recent, unread] = await Promise.all([
      api.listOrders({ group: 'active', pageSize: 1 }),
      api.listOrders({ group: 'completed', pageSize: 2 }),
      api.unreadCount(),
    ]);
    return { active: active.items[0] ?? null, recent: recent.items, unread: unread.unread };
  }, []);

  // Đơn đang chạy đổi trạng thái / có thông báo mới -> cập nhật thẻ đơn và số chuông
  useSocketEvent('order:updated', () => home.reload(true));
  useSocketEvent('notification:new', () => home.reload(true));

  const refreshing = services.refreshing || home.refreshing;
  const onRefresh = () => {
    void services.refresh();
    void home.refresh();
  };

  const visible = useMemo(() => {
    const all = services.data ?? [];
    const k = keyword.trim().toLowerCase();
    if (k) return all.filter((s) => s.label.toLowerCase().includes(k));
    return showAll ? all : all.slice(0, PREVIEW_COUNT);
  }, [services.data, keyword, showAll]);

  const active = home.data?.active;
  const recent = home.data?.recent ?? [];
  const name = user?.full_name ?? '';

  return (
    <Screen>
      <View style={styles.top}>
        <View style={styles.greetRow}>
          <View>
            <Text style={styles.hello}>Xin chào 👋</Text>
            <Text style={styles.name}>{name}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable style={styles.bell} onPress={() => navigate('notifications')}>
              <Icon name="bell-outline" size={18} color={colors.primary} />
              {(home.data?.unread ?? 0) > 0 && <View style={styles.bellDot} />}
            </Pressable>
            <Pressable onPress={() => navigate('profile')}>
              <Avatar name={name || '?'} size={36} uri={user?.avatar_url} />
            </Pressable>
          </View>
        </View>
        <View style={styles.search}>
          <Icon name="magnify" size={18} color={colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm dịch vụ bạn cần..."
            placeholderTextColor={colors.gray400}
            selectionColor={colors.primary}
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="search"
          />
          {keyword ? (
            <Pressable onPress={() => setKeyword('')} hitSlop={8}>
              <Icon name="close-circle" size={16} color={colors.gray300} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {/* Đơn đang thực hiện */}
        {active && (
          <Pressable onPress={() => navigate(WAITING_STATUSES.includes(active.status) ? 'match' : 'track', { orderId: active.id })}>
            <LinearGradient colors={GRADIENT} {...GRADIENT_PROPS} style={styles.active}>
              <View style={styles.activeIcon}>
                <Icon name="navigation" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activeLabel}>Đơn đang thực hiện</Text>
                <Text style={styles.activeTitle} numberOfLines={1}>{active.service_name}</Text>
                <Text style={styles.activeSub} numberOfLines={1}>
                  {active.worker ? `Thợ ${active.worker.full_name} · ` : ''}
                  {ORDER_STATUS[active.status].label}
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </Pressable>
        )}

        {/* Dịch vụ */}
        <View>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>{keyword ? 'Kết quả tìm kiếm' : 'Dịch vụ'}</Text>
            {!keyword && (services.data?.length ?? 0) > PREVIEW_COUNT && (
              <Pressable onPress={() => setShowAll(!showAll)} hitSlop={8}>
                <Text style={styles.link}>{showAll ? 'Thu gọn' : 'Xem tất cả'}</Text>
              </Pressable>
            )}
          </View>
          {services.loading ? (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: 24 }} />
          ) : services.error ? (
            <Pressable onPress={() => services.reload()}>
              <Text style={styles.empty}>{services.error} · Chạm để thử lại</Text>
            </Pressable>
          ) : visible.length === 0 ? (
            <Text style={styles.empty}>{keyword ? 'Không tìm thấy dịch vụ phù hợp' : 'Chưa có dịch vụ nào'}</Text>
          ) : (
            <View style={styles.grid}>
              {visible.map((s) => (
                <Pressable key={s.id} onPress={() => navigate('book', { service: s })} style={[styles.svc, { width: itemW }]}>
                  <View style={[styles.svcIcon, { backgroundColor: s.bg }]}>
                    <Icon name={s.icon} size={22} color={s.color} />
                  </View>
                  <Text style={styles.svcLabel} numberOfLines={2}>{s.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Ưu đãi */}
        <View style={styles.promo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTag}>Ưu đãi hôm nay</Text>
            <Text style={styles.promoTitle}>Giảm 50.000đ cho lần đặt đầu tiên</Text>
            <Pressable
              style={styles.promoBtn}
              onPress={() => services.data?.[0] && navigate('book', { service: services.data[0] })}
            >
              <Text style={styles.promoBtnText}>Dùng ngay</Text>
            </Pressable>
          </View>
          <View style={styles.promoIcon}>
            <Icon name="creation" size={30} color={colors.primary} />
          </View>
        </View>

        {/* Đơn gần đây */}
        <View>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Đơn gần đây</Text>
            <Pressable onPress={() => navigate('history')}>
              <Text style={styles.link}>Xem lịch sử</Text>
            </Pressable>
          </View>
          {home.loading ? (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: 16 }} />
          ) : recent.length === 0 ? (
            <Text style={styles.empty}>Chưa có đơn hoàn thành nào</Text>
          ) : (
            recent.map((o, i) => (
              <Pressable
                key={o.id}
                onPress={() => navigate('track', { orderId: o.id })}
                style={[styles.order, i < recent.length - 1 && styles.orderBorder]}
              >
                <View style={styles.orderIcon}>
                  <Icon name={serviceIcon(o.service_name)} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderTitle} numberOfLines={1}>{o.service_name}</Text>
                  <Text style={styles.orderSub}>{o.worker?.full_name ?? '—'} · {fmtDate(o.completed_at ?? o.created_at)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.orderAmount}>{money(o.total_amount)}</Text>
                  <Text style={styles.orderStatus}>Hoàn thành</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, backgroundColor: colors.white },
  greetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  hello: { fontSize: 12, color: colors.gray400 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  bell: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute', top: 2, right: 2, width: 9, height: 9, borderRadius: 5,
    backgroundColor: colors.primary, borderWidth: 1, borderColor: '#fff',
  },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.gray100,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 8 },
  body: { paddingHorizontal: 20, paddingBottom: 24, gap: 20 },
  active: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  activeIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  activeLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500' },
  activeTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 2 },
  activeSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  link: { fontSize: 12, fontWeight: '500', color: colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  svc: {
    alignItems: 'center', gap: 8, padding: 12, borderRadius: 16, borderWidth: 1,
    borderColor: colors.gray100, backgroundColor: '#fff',
  },
  svcIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  svcLabel: { fontSize: 12, fontWeight: '500', color: colors.body, textAlign: 'center', lineHeight: 15 },
  promo: {
    borderRadius: 16, backgroundColor: colors.dark, padding: 16, flexDirection: 'row',
    alignItems: 'center', gap: 16,
  },
  promoTag: {
    fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase',
    color: colors.primary, marginBottom: 4,
  },
  promoTitle: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 19 },
  promoBtn: {
    alignSelf: 'flex-start', marginTop: 8, backgroundColor: colors.primary,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  promoBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  promoIcon: {
    width: 64, height: 64, borderRadius: 12, backgroundColor: op(colors.primary, 0.2),
    alignItems: 'center', justifyContent: 'center',
  },
  order: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  orderBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray50 },
  orderIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  orderTitle: { fontSize: 14, fontWeight: '500', color: colors.text },
  orderSub: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  orderAmount: { fontSize: 14, fontWeight: '600', color: colors.text },
  orderStatus: { fontSize: 12, fontWeight: '500', color: colors.emerald600 },
  empty: { fontSize: 12, color: colors.gray400, textAlign: 'center', paddingVertical: 16 },
});
