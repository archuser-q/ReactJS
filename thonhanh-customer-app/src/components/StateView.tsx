import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors } from '../theme';

/** Trạng thái chung: đang tải / lỗi / rỗng — cùng tông màu với app */
export function StateView({
  loading,
  error,
  empty,
  icon = 'inbox-outline',
  actionLabel,
  onAction,
  onRetry,
}: {
  loading?: boolean;
  error?: string | null;
  empty?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  onRetry?: () => void;
}) {
  if (loading) {
    return (
      <View style={styles.box}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  const isError = !!error;
  return (
    <View style={styles.box}>
      <View style={[styles.icon, { backgroundColor: isError ? colors.red50 : colors.primaryLight }]}>
        <Icon name={isError ? 'wifi-off' : icon} size={22} color={isError ? colors.red500 : colors.primary} />
      </View>
      <Text style={styles.text}>{error ?? empty}</Text>
      {isError && onRetry ? (
        <Pressable onPress={onRetry} style={styles.btn}>
          <Text style={styles.btnText}>Thử lại</Text>
        </Pressable>
      ) : actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.btn}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 10 },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 13, color: colors.gray500, textAlign: 'center', lineHeight: 19 },
  btn: { marginTop: 4, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.primary },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
