import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../components/Icon';
import { DetailHeader, Screen } from '../components/Screen';
import { colors } from '../theme';

// Backend hỗ trợ 3 phương thức: cash | momo | vnpay (MoMo/VNPay chạy sandbox)
const METHODS: { label: string; sub: string; icon: IconName; isDefault: boolean }[] = [
  { label: 'Tiền mặt', sub: 'Trả trực tiếp cho thợ khi hoàn thành', icon: 'cash', isDefault: true },
  { label: 'Ví MoMo', sub: 'Thanh toán online (môi trường thử nghiệm)', icon: 'wallet-outline', isDefault: false },
  { label: 'VNPay', sub: 'Thẻ ATM / QR ngân hàng (môi trường thử nghiệm)', icon: 'credit-card-outline', isDefault: false },
];

export default function PaymentMethodsScreen() {
  return (
    <Screen bg={colors.pageBg}>
      <DetailHeader title="Phương thức thanh toán" />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {METHODS.map((m) => (
          <View key={m.label} style={styles.card}>
            <View style={styles.icon}>
              <Icon name={m.icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{m.label}</Text>
              <Text style={styles.sub}>{m.sub}</Text>
            </View>
            {m.isDefault && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Mặc định</Text>
              </View>
            )}
          </View>
        ))}
        <Text style={styles.note}>Bạn chọn phương thức khi thanh toán đơn đã hoàn thành, trong màn Theo dõi đơn.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: colors.gray100, padding: 14,
  },
  icon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '500', color: colors.text },
  sub: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  badge: { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '600', color: colors.primary },
  add: { fontSize: 14, fontWeight: '500', color: colors.primary },
  note: { fontSize: 12, color: colors.gray400, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
