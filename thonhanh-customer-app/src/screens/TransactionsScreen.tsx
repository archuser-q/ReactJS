import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { DetailHeader, Screen } from '../components/Screen';
import { StateView } from '../components/StateView';
import { api } from '../api';
import { useApi } from '../hooks/useApi';
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, fmtDateTime } from '../utils/format';
import { colors, formatVnd, mono } from '../theme';

export default function TransactionsScreen() {
  const q = useApi(() => api.listMyPayments({ pageSize: 100 }), []);
  const items = q.data?.items ?? [];

  return (
    <Screen bg={colors.pageBg}>
      <DetailHeader title="Lịch sử giao dịch" />
      {!q.data ? (
        <StateView loading={q.loading} error={q.error} onRetry={() => q.reload()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          {items.length === 0 && <StateView empty="Chưa có giao dịch nào" icon="currency-usd" />}
          {items.map((t) => {
            const ok = t.status === 'success';
            const refund = t.status === 'refunded';
            const color = ok ? colors.red500 : refund ? colors.emerald600 : colors.gray400;
            return (
              <View key={t.id} style={styles.card}>
                <View style={[styles.icon, { backgroundColor: ok ? colors.red50 : refund ? colors.emerald50 : colors.gray100 }]}>
                  <Icon name={refund ? 'trending-up' : ok ? 'trending-down' : 'clock-outline'} size={18} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label} numberOfLines={1}>Thanh toán {t.service_name}</Text>
                  <Text style={styles.sub}>
                    {fmtDateTime(t.paid_at ?? t.created_at)} · {PAYMENT_METHOD_LABEL[t.method]}
                  </Text>
                  <Text style={styles.sub}>
                    {t.order_code} · {PAYMENT_STATUS_LABEL[t.status]}
                  </Text>
                </View>
                <Text style={[styles.amount, { color }, !ok && !refund && { textDecorationLine: t.status === 'failed' ? 'line-through' : 'none' }]}>
                  {refund ? '+' : '-'}{formatVnd(t.amount)}đ
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: colors.gray100, padding: 14,
  },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '500', color: colors.text },
  sub: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '700', fontFamily: mono },
});
