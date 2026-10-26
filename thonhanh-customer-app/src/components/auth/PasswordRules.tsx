import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';
import { passwordChecks } from '../../utils/password';
import { Icon } from '../Icon';

/** Danh sách điều kiện mật khẩu, tick xanh dần khi gõ (đặt ngay dưới ô mật khẩu mới) — giống app thợ */
export function PasswordRules({ value }: { value: string }) {
  const c = passwordChecks(value);
  const rows: [boolean, string][] = [
    [c.length, 'Ít nhất 8 ký tự'],
    [c.letterAndDigit, 'Có cả chữ và số (VD: nhacuatoi2026)'],
  ];
  return (
    <View style={styles.box} accessibilityLabel="Điều kiện mật khẩu">
      {rows.map(([ok, label]) => (
        <View key={label} style={styles.row}>
          <Icon name={ok ? 'check-circle' : 'circle-outline'} size={15} color={ok ? colors.primary : colors.gray400} />
          <Text style={[styles.text, ok && { color: colors.primary }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 4, marginTop: -4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontSize: 12, color: colors.gray500 },
});
