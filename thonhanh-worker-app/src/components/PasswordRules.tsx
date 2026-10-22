import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { passwordChecks, PASSWORD_MIN } from '../utils/password';
import { Icon } from './Icon';
import { Text } from './Text';

/** Danh sách điều kiện mật khẩu, tick xanh dần khi gõ (đặt ngay dưới ô mật khẩu mới) */
export function PasswordRules({ value }: { value: string }) {
  const c = passwordChecks(value);
  const rows: [boolean, string][] = [
    [c.length, `Ít nhất ${PASSWORD_MIN} ký tự`],
    [c.letterAndDigit, 'Có cả chữ và số (VD: thodien2026)'],
  ];
  return (
    <View style={styles.box} accessibilityLabel="Điều kiện mật khẩu">
      {rows.map(([ok, label]) => (
        <View key={label} style={styles.row}>
          <Icon name={ok ? 'check-circle' : 'circle-outline'} size={15} color={ok ? colors.success : colors.faint} />
          <Text style={[styles.text, ok && { color: colors.success }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 4, marginTop: -6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontSize: 12, color: colors.muted },
});
