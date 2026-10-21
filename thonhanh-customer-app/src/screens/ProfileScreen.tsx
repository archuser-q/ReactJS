import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { ProfileItem, ProfileSection } from '../components/ProfileParts';
import { Screen } from '../components/Screen';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useApi } from '../hooks/useApi';
import { money } from '../utils/format';
import { useNav } from '../navigation/NavigationContext';
import { DARK_GRADIENT, GRADIENT_PROPS, colors, mono } from '../theme';

export default function ProfileScreen() {
  const { navigate } = useNav();
  const { user, logout } = useAuth();

  const stats = useApi(async () => {
    const [all, active, completed, reviews, addresses, payments] = await Promise.all([
      api.listOrders({ pageSize: 1 }),
      api.listOrders({ group: 'active', pageSize: 1 }),
      api.listOrders({ group: 'completed', pageSize: 1 }),
      api.listMyReviews({ pageSize: 1 }),
      api.listAddresses(),
      api.listMyPayments({ pageSize: 100 }),
    ]);
    const spent = payments.items.filter((p) => p.status === 'success').reduce((sum, p) => sum + p.amount, 0);
    return {
      total: all.total,
      active: active.total,
      completed: completed.total,
      reviews: reviews.total,
      addresses: addresses.length,
      defaultAddress: addresses.find((a) => a.is_default)?.address_text ?? null,
      spent,
    };
  }, []);
  const st = stats.data;

  const confirmLogout = () =>
    Alert.alert('Đăng xuất', 'Bạn muốn đăng xuất khỏi tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => void logout() },
    ]);

  if (!user) return null;

  return (
    <Screen bg={colors.pageBg}>
      <View style={styles.top}>
        <Text style={styles.title}>Tài khoản</Text>
        <View style={styles.userRow}>
          <Avatar name={user.full_name} size={56} uri={user.avatar_url} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user.full_name}</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {user.phone}
              {st?.defaultAddress ? ` · ${st.defaultAddress}` : ''}
            </Text>
            <View style={styles.ratingRow}>
              <Icon name="clipboard-check-outline" size={12} color={colors.primary} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>{st?.total ?? '–'}</Text>
              <Text style={{ fontSize: 12, color: colors.gray400 }}>đơn đã đặt</Text>
            </View>
          </View>
          <Pressable onPress={() => navigate('personalInfo')} style={styles.editBtn}>
            <Text style={styles.editText}>Chỉnh sửa</Text>
          </Pressable>
        </View>

        <LinearGradient colors={DARK_GRADIENT} {...GRADIENT_PROPS} style={styles.wallet}>
          <Icon name="wallet-outline" size={22} color="#fff" />
          <View>
            <Text style={styles.walletLabel}>Tổng đã thanh toán</Text>
            <Text style={styles.walletAmount}>{st ? money(st.spent) : '—'}</Text>
          </View>
          <Pressable onPress={() => navigate('transactions')} style={styles.topUp}>
            <Text style={styles.topUpText}>Giao dịch</Text>
          </Pressable>
        </LinearGradient>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={stats.refreshing} onRefresh={stats.refresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <ProfileSection title="Đơn hàng">
          <ProfileItem
            label="Lịch sử đơn hàng"
            icon="clipboard-list-outline"
            sub={st ? `${st.completed} đơn đã hoàn thành` : undefined}
            onPress={() => navigate('history')}
          />
          <ProfileItem
            label="Đơn đang thực hiện"
            icon="navigation"
            sub={st ? (st.active ? `${st.active} đơn đang chạy` : 'Không có đơn nào') : undefined}
            badge={st?.active ? st.active : undefined}
            onPress={() => navigate('track', { orderId: null })}
          />
          <ProfileItem
            label="Đánh giá của tôi"
            icon="star-outline"
            sub={st ? `${st.reviews} đánh giá đã gửi` : undefined}
            onPress={() => navigate('reviewsMine')}
          />
        </ProfileSection>
        <ProfileSection title="Thanh toán">
          <ProfileItem label="Phương thức thanh toán" icon="cash" sub="Tiền mặt / MoMo / VNPay" onPress={() => navigate('payment')} />
          <ProfileItem label="Lịch sử giao dịch" icon="currency-usd" onPress={() => navigate('transactions')} />
        </ProfileSection>
        <ProfileSection title="Tài khoản">
          <ProfileItem
            label="Thông tin cá nhân"
            icon="account-outline"
            sub={`${user.full_name} · ${user.phone ?? 'chưa có SĐT'}`}
            onPress={() => navigate('personalInfo')}
          />
          <ProfileItem label="Đổi mật khẩu" icon="lock-reset" onPress={() => navigate('changePassword')} />
          <ProfileItem
            label="Địa chỉ của tôi"
            icon="map-marker-outline"
            sub={st ? `${st.addresses} địa chỉ đã lưu` : undefined}
            onPress={() => navigate('addresses')}
          />
          <ProfileItem label="Thông báo" icon="bell-outline" onPress={() => navigate('notifications', { returnTo: 'profile' })} />
        </ProfileSection>
        <ProfileSection title="Hỗ trợ">
          <ProfileItem label="Trung tâm trợ giúp" icon="help-circle-outline" onPress={() => navigate('help')} />
          <ProfileItem label="Liên hệ CSKH" icon="phone-outline" sub="Hỗ trợ 24/7" onPress={() => navigate('support')} />
        </ProfileSection>
        <View style={{ marginTop: 16 }}>
          <ProfileItem label="Đăng xuất" icon="logout" danger onPress={confirmLogout} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  editBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.primaryLight },
  editText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  wallet: { padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  walletAmount: { fontSize: 18, fontWeight: '700', color: '#fff', fontFamily: mono },
  topUp: {
    marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 8,
  },
  topUpText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  list: { paddingHorizontal: 20, paddingTop: 2, paddingBottom: 24 },
});
