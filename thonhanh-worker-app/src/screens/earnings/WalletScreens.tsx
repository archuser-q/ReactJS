/** Ví: lịch sử giao dịch, lịch sử thu nhập, rút tiền, nạp tiền, tài khoản ngân hàng */
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errMsg, qk, type Paginated, type WalletTx, type Withdrawal } from '../../api';
import { Banner, Card, KeyValue, Tag } from '../../components/Bits';
import { Button } from '../../components/Button';
import { Chip, Segmented, TextField } from '../../components/Form';
import { Icon, type IconName } from '../../components/Icon';
import { useOverlay } from '../../components/Overlay';
import { Header, Screen } from '../../components/Screen';
import { StateView } from '../../components/StateView';
import type { ScreenProps } from '../../navigation/types';
import { colors, op, radius } from '../../theme';
import { fmtDateTime, formatVnd, money, orderCode, PAYMENT_LABEL } from '../../utils/format';

const TX: Record<WalletTx['type'], { label: string; icon: IconName }> = {
  earning: { label: 'Thu nhập đơn', icon: 'cash-plus' },
  commission: { label: 'Phí nền tảng', icon: 'percent-outline' },
  withdraw: { label: 'Rút tiền', icon: 'bank-transfer-out' },
  refund: { label: 'Hoàn tiền rút', icon: 'cash-refund' },
  topup: { label: 'Nạp tiền', icon: 'wallet-plus-outline' },
  adjustment: { label: 'Điều chỉnh', icon: 'tune-variant' },
};

function nextPage<T>(last: Paginated<T>) {
  return last.page * last.pageSize < last.total ? last.page + 1 : undefined;
}

// ---------------------------------------------------------------------------

export function WalletHistoryScreen() {
  const [tab, setTab] = useState<'tx' | 'wd'>('tx');
  const tx = useInfiniteQuery({
    queryKey: qk.walletTx,
    queryFn: ({ pageParam }) => api.walletTransactions(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPage<WalletTx>,
  });
  const wd = useInfiniteQuery({
    queryKey: qk.withdrawals,
    queryFn: ({ pageParam }) => api.withdrawals(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPage<Withdrawal>,
    enabled: tab === 'wd',
  });
  const q = tab === 'tx' ? tx : wd;
  const items: (WalletTx | Withdrawal)[] =
    tab === 'tx' ? (tx.data?.pages.flatMap((p) => p.items) ?? []) : (wd.data?.pages.flatMap((p) => p.items) ?? []);

  return (
    <Screen>
      <Header title="Lịch sử ví" />
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'tx', label: 'Giao dịch ví' },
            { value: 'wd', label: 'Yêu cầu rút tiền' },
          ]}
        />
      </View>
      <FlatList
        data={items}
        keyExtractor={(x) => `${tab}-${x.id}`}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.primary} />}
        onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && void q.fetchNextPage()}
        renderItem={({ item }) => (tab === 'tx' ? <TxRow t={item as WalletTx} /> : <WithdrawalRow w={item as Withdrawal} />)}
        ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : null}
        ListEmptyComponent={<StateView loading={q.isLoading} error={q.error ? errMsg(q.error) : null} empty="Chưa có giao dịch nào" icon="wallet-outline" />}
      />
    </Screen>
  );
}

function TxRow({ t }: { t: WalletTx }) {
  const plus = t.amount >= 0;
  const meta = TX[t.type] ?? TX.adjustment;
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: op(plus ? colors.success : colors.danger, 0.1) }]}>
        <Icon name={meta.icon} size={18} color={plus ? colors.success : colors.danger} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{meta.label}</Text>
        <Text style={styles.rowSub} numberOfLines={2}>
          {t.note ?? (t.order_id ? orderCode(t.order_id) : '')}
        </Text>
        <Text style={styles.rowTime}>{fmtDateTime(t.created_at)}</Text>
      </View>
      <Text style={[styles.rowMoney, { color: plus ? colors.success : colors.danger }]}>
        {plus ? '+' : '-'}
        {formatVnd(t.amount)}đ
      </Text>
    </View>
  );
}

function WithdrawalRow({ w }: { w: Withdrawal }) {
  const st = { pending: ['Chờ duyệt', colors.warning], completed: ['Thành công', colors.success], rejected: ['Bị từ chối', colors.danger] }[w.status] as [string, string];
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
        <Icon name="bank-outline" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>
          {w.bank_name} ****{w.account_number.slice(-4)}
        </Text>
        <Text style={styles.rowTime}>{fmtDateTime(w.created_at)}</Text>
        {w.transaction_code ? <Text style={styles.rowSub}>Mã GD: {w.transaction_code}</Text> : null}
        {w.note ? <Text style={styles.rowSub}>{w.note}</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={styles.rowMoney}>{money(w.amount)}</Text>
        <Tag label={st[0]} color={st[1]} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------

export function EarningHistoryScreen({ navigation }: ScreenProps<'EarningHistory'>) {
  const q = useInfiniteQuery({
    queryKey: [...qk.earningItems, 'all'],
    queryFn: ({ pageParam }) => api.earnings(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
  });
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <Screen>
      <Header title="Thu nhập theo đơn" subtitle={q.data ? `${q.data.pages[0].total} đơn đã thanh toán` : undefined} />
      <FlatList
        data={items}
        keyExtractor={(e) => String(e.order_id)}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && void q.fetchNextPage()}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.primary} />}
        renderItem={({ item: e }) => (
          <Pressable onPress={() => navigation.navigate('JobDetail', { orderId: e.order_id })} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{e.service_name}</Text>
              <Text style={styles.rowSub}>
                {orderCode({ id: e.order_id, code: e.code })} · {PAYMENT_LABEL[e.payment_method ?? ''] ?? '—'} · khách trả {money(e.gross_amount)}
              </Text>
              <Text style={styles.rowTime}>{fmtDateTime(e.created_at)}</Text>
            </View>
            <Text style={[styles.rowMoney, { color: colors.success }]}>+{money(e.net_amount)}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<StateView loading={q.isLoading} error={q.error ? errMsg(q.error) : null} empty="Chưa có thu nhập" icon="cash-multiple" />}
      />
    </Screen>
  );
}

// ---------------------------------------------------------------------------

export function WithdrawScreen({ navigation }: ScreenProps<'Withdraw'>) {
  const qc = useQueryClient();
  const ui = useOverlay();
  const w = useQuery({ queryKey: qk.wallet, queryFn: api.wallet });
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const value = parseInt(amount.replace(/\D/g, '') || '0', 10);

  if (!w.data) {
    return (
      <Screen>
        <Header title="Rút tiền" />
        <StateView loading={w.isLoading} error={w.error ? errMsg(w.error) : null} onRetry={() => void w.refetch()} />
      </Screen>
    );
  }
  const d = w.data;
  const can = d.bank_account && value >= d.min_withdrawal && value <= d.available_for_withdrawal;

  const submit = async () => {
    if (!d.bank_account) return navigation.navigate('BankAccount');
    const ok = await ui.confirm({
      title: 'Xác nhận rút tiền',
      message: `Rút ${money(value)} về ${d.bank_account.bank_name} ****${d.bank_account.account_number.slice(-4)} (${d.bank_account.account_holder})?`,
      confirmText: 'Rút tiền',
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await api.withdraw(value);
      void qc.invalidateQueries({ queryKey: qk.wallet });
      void qc.invalidateQueries({ queryKey: qk.walletTx });
      void qc.invalidateQueries({ queryKey: qk.withdrawals });
      const done = res.status === 'completed';
      await ui.alert(
        done ? 'Rút tiền thành công' : 'Đã gửi yêu cầu rút tiền',
        res.transaction_code ? `Mã giao dịch: ${res.transaction_code}` : 'Yêu cầu sẽ được xử lý trong 1 ngày làm việc.',
        'success',
      );
      navigation.goBack();
    } catch (e) {
      void ui.alert('Không rút được', errMsg(e), 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="Rút tiền" subtitle="Môi trường demo: tiền được chuyển ngay (mô phỏng)" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Card style={{ backgroundColor: colors.dark, borderColor: colors.dark }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Số dư có thể rút</Text>
          <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', fontVariant: ['tabular-nums'], marginTop: 4 }}>{money(d.available_for_withdrawal)}</Text>
          {d.balance < 0 ? <Text style={{ color: '#FCA5A5', fontSize: 12, marginTop: 4 }}>Ví đang âm {money(d.balance)} — chưa rút được</Text> : null}
        </Card>
        <TextField
          label="Số tiền muốn rút"
          value={value ? formatVnd(value) : ''}
          onChangeText={setAmount}
          keyboardType="number-pad"
          placeholder="0"
          suffix="đ"
          style={{ fontVariant: ['tabular-nums'], fontSize: 20, fontWeight: '800' }}
          hint={`Tối thiểu ${money(d.min_withdrawal)}`}
        />
        <View style={styles.chips}>
          {[100_000, 200_000, 500_000, 1_000_000].map((a) => (
            <Chip key={a} label={money(a)} selected={value === a} onPress={() => setAmount(String(a))} />
          ))}
          {d.available_for_withdrawal > 0 ? <Chip label="Rút hết" onPress={() => setAmount(String(d.available_for_withdrawal))} /> : null}
        </View>
        {d.bank_account ? (
          <Pressable onPress={() => navigation.navigate('BankAccount')} style={styles.bank}>
            <Icon name="bank-outline" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{d.bank_account.bank_name}</Text>
              <Text style={styles.rowSub}>
                ****{d.bank_account.account_number.slice(-4)} · {d.bank_account.account_holder}
              </Text>
            </View>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Đổi</Text>
          </Pressable>
        ) : (
          <Banner tone="warning" text="Chưa liên kết tài khoản ngân hàng" action="Liên kết" onPress={() => navigation.navigate('BankAccount')} />
        )}
        <Button title={d.bank_account ? `Rút ${value ? money(value) : ''}` : 'Liên kết ngân hàng'} onPress={submit} loading={busy} disabled={!!d.bank_account && !can} size="lg" />
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------------------

export function TopupScreen({ navigation }: ScreenProps<'Topup'>) {
  const qc = useQueryClient();
  const ui = useOverlay();
  const w = useQuery({ queryKey: qk.wallet, queryFn: api.wallet });
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<'momo' | 'vnpay'>('momo');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (w.data && !amount) setAmount(w.data.balance < 0 ? Math.ceil(-w.data.balance / 10000) * 10000 : 200_000);
  }, [w.data, amount]);

  const submit = async () => {
    setBusy(true);
    try {
      await api.topup(amount, method);
      void qc.invalidateQueries({ queryKey: qk.wallet });
      void qc.invalidateQueries({ queryKey: qk.walletTx });
      void qc.invalidateQueries({ queryKey: qk.home });
      ui.toast(`Đã nạp ${money(amount)} vào ví (sandbox)`);
      navigation.goBack();
    } catch (e) {
      void ui.alert('Không nạp được', errMsg(e), 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="Nạp tiền vào ví" subtitle="Thanh toán mô phỏng (sandbox)" />
      <ScrollView contentContainerStyle={styles.body}>
        <Banner text="Khi khách trả tiền mặt, phí nền tảng được trừ vào ví nên ví có thể âm. Nạp tiền để bù số âm và tiếp tục nhận đơn." />
        {w.data ? <KeyValue label="Số dư hiện tại" value={money(w.data.balance)} strong color={w.data.balance < 0 ? colors.danger : colors.text} /> : null}
        <View style={styles.chips}>
          {[50_000, 100_000, 200_000, 500_000, 1_000_000].map((a) => (
            <Chip key={a} label={money(a)} selected={amount === a} onPress={() => setAmount(a)} />
          ))}
        </View>
        <View style={{ gap: 8 }}>
          {(['momo', 'vnpay'] as const).map((m) => (
            <Pressable key={m} onPress={() => setMethod(m)} style={[styles.method, method === m && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}>
              <Icon name={m === 'momo' ? 'wallet' : 'credit-card-outline'} size={22} color={m === 'momo' ? '#A50064' : '#005BAA'} />
              <Text style={styles.rowTitle}>{m === 'momo' ? 'Ví MoMo' : 'VNPay'}</Text>
              <View style={{ flex: 1 }} />
              <Icon name={method === m ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={method === m ? colors.primary : colors.faint} />
            </Pressable>
          ))}
        </View>
        <Button title={`Nạp ${money(amount)}`} onPress={submit} loading={busy} disabled={amount < 10000} size="lg" />
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------------------

const BANKS = ['Vietcombank', 'VietinBank', 'BIDV', 'Agribank', 'Techcombank', 'MB Bank', 'ACB', 'VPBank', 'TPBank', 'Sacombank', 'VIB', 'HDBank'];

export function BankAccountScreen({ navigation }: ScreenProps<'BankAccount'>) {
  const qc = useQueryClient();
  const ui = useOverlay();
  const w = useQuery({ queryKey: qk.wallet, queryFn: api.wallet });
  const [bank, setBank] = useState('');
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const b = w.data?.bank_account;
    if (b) {
      setBank(b.bank_name);
      setNumber(b.account_number);
      setHolder(b.account_holder);
    }
  }, [w.data?.bank_account]);

  const save = async () => {
    if (!bank) return void ui.alert('Chọn ngân hàng', undefined, 'warning');
    if (!/^\d{6,20}$/.test(number)) return void ui.alert('Số tài khoản chưa đúng', 'Số tài khoản gồm 6–20 chữ số.', 'warning');
    if (holder.trim().length < 2) return void ui.alert('Nhập tên chủ tài khoản', 'Viết in hoa không dấu như trên thẻ.', 'warning');
    setBusy(true);
    try {
      await api.setBankAccount({ bank_name: bank, account_number: number, account_holder: holder });
      void qc.invalidateQueries({ queryKey: qk.wallet });
      void qc.invalidateQueries({ queryKey: qk.me });
      ui.toast('Đã lưu tài khoản ngân hàng');
      navigation.goBack();
    } catch (e) {
      void ui.alert('Chưa lưu được', errMsg(e), 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="Ngân hàng liên kết" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Ngân hàng</Text>
        <View style={styles.chips}>
          {BANKS.map((b) => (
            <Chip key={b} label={b} selected={bank === b} onPress={() => setBank(b)} />
          ))}
        </View>
        <TextField label="Số tài khoản" icon="numeric" value={number} onChangeText={(t) => setNumber(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={20} />
        <TextField label="Tên chủ tài khoản" icon="account-outline" value={holder} onChangeText={(t) => setHolder(t.toUpperCase())} autoCapitalize="characters" placeholder="NGUYEN VAN A" hint="Phải trùng tên trên CCCD đã xác minh" />
        <Button title="Lưu tài khoản" onPress={save} loading={busy} size="lg" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 14, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  rowTime: { fontSize: 11, color: colors.faint, marginTop: 2 },
  rowMoney: { fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'], color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bank: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line },
  method: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, padding: 14, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border },
  label: { fontSize: 13, fontWeight: '700', color: colors.body },
});
