import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { colors } from '../theme';

/** Trạng thái chung: đang tải / lỗi / rỗng */
export function StateView({
  loading,
  error,
  empty,
  icon = 'inbox-outline',
  actionLabel,
  onAction,
  onRetry,
  compact = false,
}: {
  loading?: boolean;
  error?: string | null;
  empty?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  onRetry?: () => void;
  compact?: boolean;
}) {
  if (loading) {
    return (
      <View style={[styles.box, compact && { paddingVertical: 20 }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  const isError = !!error;
  return (
    <View style={[styles.box, compact && { paddingVertical: 20 }]}>
      <View style={[styles.icon, { backgroundColor: isError ? colors.dangerBg : colors.primaryLight }]}>
        <Icon name={isError ? 'wifi-off' : icon} size={24} color={isError ? colors.dangerMid : colors.primary} />
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
  box: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 12 },
  icon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.primary },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
