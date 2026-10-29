import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { api, qk } from '../../api';
import { useAuth, useWorkerMe } from '../../auth/AuthContext';
import { Avatar } from '../../components/Bits';
import { LevelBadge, LevelProgress } from '../../components/LevelBadge';
import { MenuItem, MenuSection } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { useOverlay } from '../../components/Overlay';
import { apiUrl } from '../../config/env';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';
import { useRootNav } from '../../navigation/types';
import { colors, radius } from '../../theme';
import { fmtRating, money } from '../../utils/format';

const certs = (d: { documents: { doc_type: string; status: string }[] } | undefined) =>
  d?.documents.filter((x) => x.doc_type === 'certificate' && x.status === 'approved').length ?? 0;

export default function AccountScreen() {
  const navigation = useRootNav();
  const insets = useSafeAreaInsets();
  const ui = useOverlay();
  const { logout } = useAuth();
  const me = useWorkerMe();
  const wallet = useQuery({ queryKey: qk.wallet, queryFn: api.wallet });
  const d = me.data;
  useRefetchOnFocus(me.refetch, wallet.refetch);
  const state = d?.profile.review_state;
  const docsSub =
    state === 'approved'
      ? `Đã xác minh CCCD ✓${certs(d) ? ` · ${certs(d)} chứng chỉ` : ''}`
      : state === 'pending'
        ? 'Đang chờ quản trị viên duyệt'
        : state === 'rejected'
          ? 'Chưa được duyệt, cần cập nhật giấy tờ'
          : 'Chưa nộp, cần có để bật nhận đơn';

  const trust = Math.round((d?.profile.trust_score ?? 0) * 100);

  const confirmLogout = async () => {
    const ok = await ui.confirm({ title: 'Đăng xuất?', message: 'App sẽ tắt nhận đơn trước khi đăng xuất.', confirmText: 'Đăng xuất', tone: 'danger' });
    if (ok) void logout();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={me.isRefetching} onRefresh={() => void me.refetch()} tintColor={colors.primary} />}
      >
        <View style={[styles.head, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.title}>Hồ sơ thợ</Text>
          {/* Thẻ đối tác */}
          <Pressable onPress={() => navigation.navigate('PersonalInfo')} style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Avatar name={d?.user.full_name} uri={d?.user.avatar_url} size={64} color={colors.volt} />
                {d?.profile.verification_status === 'approved' ? (
                  <View style={styles.verified}>
                    <Icon name="check-decagram" size={15} color={colors.navy} />
                  </View>
                ) : null}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {d?.user.full_name}
                </Text>
                <Text style={styles.sub}>
                  Thợ điện, {d?.profile.experience_years ? `${d.profile.experience_years} năm kinh nghiệm` : 'mới vào nghề'}
                </Text>
                {d ? <LevelBadge level={d.profile.level} /> : null}
              </View>
              <Icon name="chevron-right" size={22} color="rgba(255,255,255,0.5)" />
            </View>
            <View style={styles.cardStats}>
              <View style={styles.cardStat}>
                <Text style={styles.cardStatValue}>{d?.profile.rating_avg ? fmtRating(d.profile.rating_avg) : 'Mới'}</Text>
                <Text style={styles.cardStatLabel}>{d?.profile.rating_count ?? 0} đánh giá</Text>
              </View>
              <View style={styles.cardDiv} />
              <View style={styles.cardStat}>
                <Text style={styles.cardStatValue}>{d?.profile.total_jobs ?? 0}</Text>
                <Text style={styles.cardStatLabel}>đơn hoàn thành</Text>
              </View>
              <View style={styles.cardDiv} />
              <View style={styles.cardStat}>
                <Text style={styles.cardStatValue}>{trust}</Text>
                <Text style={styles.cardStatLabel}>điểm tin cậy</Text>
              </View>
            </View>
          </Pressable>
          {d ? (
            <Pressable onPress={() => navigation.navigate('Performance')} style={styles.levelBox}>
              <LevelProgress level={d.profile.level} rating={d.profile.rating_avg} />
            </Pressable>
          ) : null}
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <MenuSection title="Hồ sơ nghề nghiệp">
            <MenuItem
              icon="lightning-bolt-outline"
              label="Nhóm dịch vụ nhận làm"
              sub={d ? (d.skills.length ? d.skills.map((s) => s.category_name).slice(0, 3).join(', ') + (d.skills.length > 3 ? '...' : '') : 'Chưa chọn') : ''}
              onPress={() => navigation.navigate('Skills')}
            />
            <MenuItem icon="map-marker-radius-outline" label="Khu vực nhận việc" sub={d ? `Bán kính ${String(d.profile.service_radius_km).replace('.', ',')} km quanh vị trí hiện tại` : ''} onPress={() => navigation.navigate('ServiceArea')} last />
          </MenuSection>

          <MenuSection title="Xác minh & chứng nhận">
            <MenuItem
              icon="card-account-details-outline"
              label="Giấy tờ xác minh"
              sub={d ? docsSub : ''}
              onPress={() => navigation.navigate('Documents')}
              iconColor={state === 'approved' ? colors.success : state === 'rejected' ? colors.danger : colors.warning}
              last
            />
          </MenuSection>

          <MenuSection title="Đánh giá & hiệu suất">
            <MenuItem icon="star-outline" label="Đánh giá từ khách hàng" sub={d?.profile.rating_avg ? `★ ${fmtRating(d.profile.rating_avg)} · ${d.profile.rating_count} đánh giá` : 'Chưa có đánh giá'} onPress={() => navigation.navigate('Reviews')} iconColor={colors.warning} />
            <MenuItem icon="chart-line" label="Hiệu suất làm việc" sub="Điểm tin cậy, tỷ lệ nhận đơn, hoàn thành, hủy" onPress={() => navigation.navigate('Performance')} last />
          </MenuSection>

          <MenuSection title="Tài chính">
            <MenuItem icon="bank-outline" label="Ngân hàng liên kết" sub={d?.bank_account ? `${d.bank_account.bank_name} · ****${d.bank_account.account_number.slice(-4)}` : 'Chưa liên kết'} onPress={() => navigation.navigate('BankAccount')} />
            <MenuItem icon="bank-transfer-out" label="Rút tiền" sub={wallet.data ? `Số dư: ${money(wallet.data.balance)}` : undefined} onPress={() => navigation.navigate('Withdraw')} />
            <MenuItem icon="history" label="Lịch sử ví" onPress={() => navigation.navigate('WalletHistory')} last />
          </MenuSection>

          <MenuSection title="Hỗ trợ">
            <MenuItem icon="help-circle-outline" label="Trung tâm trợ giúp" onPress={() => navigation.navigate('Help')} />
            <MenuItem icon="alert-circle-outline" label="Báo cáo sự cố" sub="Khách vắng mặt, không thanh toán..." onPress={() => navigation.navigate('ReportIssue')} />
            <MenuItem icon="file-document-outline" label="Báo cáo đã gửi" onPress={() => navigation.navigate('Reports')} last />
          </MenuSection>

          <MenuSection title="Cài đặt">
            <MenuItem icon="lock-reset" label="Đổi mật khẩu" onPress={() => navigation.navigate('ChangePassword')} />
            <MenuItem icon="bell-outline" label="Thông báo" onPress={() => navigation.navigate('Notifications')} />
            <MenuItem icon="server-network" label="Máy chủ" sub={apiUrl()} last />
          </MenuSection>

          <MenuSection>
            <MenuItem icon="logout" label="Đăng xuất" danger onPress={confirmLogout} last />
          </MenuSection>
          <Text style={styles.version}>Thợ Nhanh Đối Tác, phiên bản {Constants.expoConfig?.version ?? '2.1.0'}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { backgroundColor: colors.white, paddingHorizontal: 16, paddingBottom: 16, borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl, gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  card: { backgroundColor: colors.navy, borderRadius: radius.xl, padding: 16, gap: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  verified: { position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.volt, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.navy },
  name: { fontSize: 19, fontWeight: '800', color: colors.white },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  cardStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', paddingTop: 14 },
  cardStat: { flex: 1, alignItems: 'center' },
  cardStatValue: { fontSize: 20, fontWeight: '800', color: colors.volt, fontVariant: ['tabular-nums'] },
  cardStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  cardDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  levelBox: { backgroundColor: colors.bg, borderRadius: radius.lg, padding: 14 },
  version: { textAlign: 'center', fontSize: 12, color: colors.faint, marginTop: 20 },
});
