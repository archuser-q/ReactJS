import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { useIsFocused } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, errMsg, qk, type Period } from '../../api';
import { useWorkerMe } from '../../auth/AuthContext';
import { Banner, Card, SectionTitle, StatBox } from '../../components/Bits';
import { BarChart } from '../../components/Charts';
import { Segmented } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { StateView } from '../../components/StateView';
import { useRootNav } from '../../navigation/types';
import { colors, gradients, GRADIENT_PROPS, radius } from '../../theme';
import { fmtWhenInline, money, moneyShort, orderCode, PAYMENT_LABEL, vnTodayKey } from '../../utils/format';

export default function EarningsScreen() {
  const navigation = useRootNav();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const [period, setPeriod] = useState<Period>('week');
  const sum = useQuery({ queryKey: qk.earnings(period), queryFn: () => api.earningsSummary(period), refetchInterval: focused ? 30000 : false });
  const wallet = useQuery({ queryKey: qk.wallet, queryFn: api.wallet, refetchInterval: focused ? 30000 : false });
  const recent = useQuery({ queryKey: qk.earningItems, queryFn: () => api.earnings(1, 5) });
  const me = useWorkerMe();

  const s = sum.data;
  const w = wallet.data;
  const pctRate = `${Math.round((me.data?.settings.commission_rate ?? 0.15) * 100)}%`;
  const refresh = () => {
    void sum.refetch();
    void wallet.refetch();
    void recent.refetch();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.head, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Thu nhập</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={sum.isRefetching || wallet.isRefetching} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <LinearGradient colors={w && w.balance < 0 ? gradients.dark : gradients.primary} {...GRADIENT_PROPS} style={styles.wallet}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="wallet-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.walletLabel}>Số dư ví</Text>
          </View>
          <Text style={[styles.balance, w && w.balance < 0 && { color: '#FCA5A5' }]}>{w ? money(w.balance) : '...'}</Text>
          {/* Ví là nơi nền tảng và thợ "thanh toán bù trừ": đơn online tiền vào ví, đơn tiền mặt thì phí trừ từ ví */}
          {w && w.balance < 0 ? (
            <Text style={styles.walletNote}>
              Âm do phí {pctRate} của các đơn tiền mặt. Âm quá {money(Math.abs(w.debt_limit))} sẽ tạm ngừng nhận đơn, nạp tiền để bù.
            </Text>
          ) : (
            <Text style={styles.walletNote}>Đơn MoMo/VNPay: tiền vào ví sau khi trừ phí {pctRate}. Đơn tiền mặt: bạn giữ tiền, ví trừ phí {pctRate}.</Text>
          )}
          <View style={styles.walletBtns}>
            <Pressable onPress={() => navigation.navigate('Withdraw')} style={styles.walletBtn}>
              <Icon name="bank-transfer-out" size={16} color="#fff" />
              <Text style={styles.walletBtnText}>Rút tiền</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Topup')} style={styles.walletBtn}>
              <Icon name="plus-circle-outline" size={16} color="#fff" />
              <Text style={styles.walletBtnText}>Nạp tiền</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('WalletHistory')} style={styles.walletBtn}>
              <Icon name="history" size={16} color="#fff" />
              <Text style={styles.walletBtnText}>Lịch sử ví</Text>
            </Pressable>
          </View>
        </LinearGradient>

        <Segmented
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'today', label: 'Hôm nay' },
            { value: 'week', label: 'Tuần này' },
            { value: 'month', label: 'Tháng này' },
          ]}
        />

        {!s ? (
          <StateView loading={sum.isLoading} error={sum.error ? errMsg(sum.error) : null} onRetry={() => void sum.refetch()} />
        ) : (
          <>
            <Card style={{ gap: 4 }}>
              <Text style={styles.netLabel}>Thực nhận {s.label.toLowerCase()}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
                <Text style={styles.net}>{money(s.totals.net)}</Text>
                {s.change_percent !== null ? (
                  <View style={[styles.change, { backgroundColor: s.change_percent >= 0 ? colors.successBg : colors.dangerBg }]}>
                    <Icon name={s.change_percent >= 0 ? 'trending-up' : 'trending-down'} size={14} color={s.change_percent >= 0 ? colors.success : colors.danger} />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: s.change_percent >= 0 ? colors.success : colors.danger }}>
                      {s.change_percent > 0 ? '+' : ''}
                      {String(s.change_percent).replace('.', ',')}%
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.netSub}>
                Khách trả {money(s.totals.gross)}, phí nền tảng -{money(s.totals.commission)}
              </Text>
              {s.change_percent !== null ? (
                <Text style={styles.netSub}>
                  So với cùng kỳ {period === 'today' ? 'hôm qua' : period === 'week' ? 'tuần trước' : 'tháng trước'}: {money(s.previous_net)}
                </Text>
              ) : null}
              <View style={{ marginTop: 14 }}>
                <BarChart
                  data={s.chart.map((c) => ({ key: c.key, label: c.label, value: c.net }))}
                  highlightKey={vnTodayKey()}
                  height={150}
                />
              </View>
              <Text style={styles.chartNote}>{period === 'today' ? '7 ngày gần nhất' : period === 'week' ? 'Từ thứ 2 đến chủ nhật' : 'Từng ngày trong tháng'}</Text>
            </Card>

            <View style={styles.grid}>
              <StatBox label="Số đơn" value={String(s.totals.orders)} sub="đã thanh toán" />
              <StatBox label="TB / đơn" value={moneyShort(s.totals.avg_net_per_order)} sub="thực nhận" />
            </View>
            <View style={styles.grid}>
              <StatBox label="Tiền mặt đã thu" value={moneyShort(s.totals.cash_collected)} sub="đang giữ trong túi" />
              <StatBox label="Nhận qua ví" value={moneyShort(s.totals.online_received)} sub="MoMo / VNPay" color={colors.primary} />
            </View>

            {s.unpaid_orders ? (
              <Banner
                tone="warning"
                icon="cash-clock"
                text={`${s.unpaid_orders} đơn chờ thanh toán · ${money(s.unpaid_amount)}`}
                action="Xem"
                onPress={() => navigation.navigate('Main', { screen: 'Jobs', params: { group: 'completed' } })}
              />
            ) : null}
          </>
        )}

        <View>
          <SectionTitle
            right={
              <Pressable onPress={() => navigation.navigate('EarningHistory')} hitSlop={8}>
                <Text style={styles.link}>Xem tất cả</Text>
              </Pressable>
            }
          >
            Thu nhập gần đây
          </SectionTitle>
          <View style={styles.list}>
            {(recent.data?.items ?? []).map((e, i) => (
              <Pressable key={e.order_id} onPress={() => navigation.navigate('JobDetail', { orderId: e.order_id })} style={[styles.item, i > 0 && styles.line]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {e.service_name}
                  </Text>
                  <Text style={styles.itemSub}>
                    {orderCode({ id: e.order_id, code: e.code })} · {fmtWhenInline(e.created_at)} · {PAYMENT_LABEL[e.payment_method ?? ''] ?? '—'}
                  </Text>
                </View>
                <Text style={styles.itemMoney}>+{money(e.net_amount)}</Text>
              </Pressable>
            ))}
            {recent.data && !recent.data.items.length ? <Text style={styles.empty}>Chưa có thu nhập. Hoàn thành đơn đầu tiên nhé!</Text> : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  title: { fontSize: 22, fontWeight: '900', color: colors.text },
  body: { padding: 16, gap: 12, paddingBottom: 32 },
  wallet: { borderRadius: radius.xl, padding: 18 },
  walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  balance: { color: '#fff', fontSize: 30, fontWeight: '900', fontVariant: ['tabular-nums'], marginTop: 4 },
  walletNote: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  walletBtns: { flexDirection: 'row', gap: 8, marginTop: 14 },
  walletBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, paddingVertical: 9 },
  walletBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  netLabel: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  net: { fontSize: 28, fontWeight: '900', color: colors.text, fontVariant: ['tabular-nums'] },
  change: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginBottom: 5 },
  netSub: { fontSize: 12, color: colors.faint },
  chartNote: { fontSize: 11, color: colors.faint, textAlign: 'center', marginTop: 6 },
  grid: { flexDirection: 'row', gap: 10 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  list: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  line: { borderTopWidth: 1, borderTopColor: colors.line },
  itemTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  itemSub: { fontSize: 12, color: colors.faint, marginTop: 2 },
  itemMoney: { fontSize: 14, fontWeight: '800', color: colors.success, fontVariant: ['tabular-nums'] },
  empty: { padding: 16, color: colors.faint, fontSize: 13, textAlign: 'center' },
});
