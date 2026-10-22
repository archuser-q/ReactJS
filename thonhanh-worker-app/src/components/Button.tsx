import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, type IconName } from './Icon';
import { colors, gradients, GRADIENT_PROPS, radius, shadow } from '../theme';

type Variant = 'primary' | 'accent' | 'success' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'dark';

/** Nút bấm chung — chiều cao tối thiểu 48 để thợ dễ bấm (kể cả khi đeo găng/đứng ngoài nắng) */
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  size = 'md',
  style,
  right,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  right?: ReactNode;
}) {
  const off = disabled || loading;
  const h = size === 'lg' ? 58 : size === 'sm' ? 40 : 50;
  const fs = size === 'lg' ? 17 : size === 'sm' ? 13 : 15;
  const fg =
    variant === 'accent'
      ? colors.onAccent
      : variant === 'secondary'
      ? colors.primary
      : variant === 'outline'
        ? colors.body
        : variant === 'ghost'
          ? colors.primary
          : variant === 'danger'
            ? colors.danger
            : colors.white;

  const content = (
    <View style={[styles.inner, { height: h }]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={fs + 3} color={fg} /> : null}
          <Text style={[styles.text, { color: fg, fontSize: fs }]} numberOfLines={1}>
            {title}
          </Text>
          {right}
        </>
      )}
    </View>
  );

  const gradient =
    variant === 'primary'
      ? gradients.primary
      : variant === 'accent'
        ? gradients.volt
        : variant === 'success'
          ? gradients.success
          : variant === 'dark'
            ? gradients.dark
            : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: off }}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' && { backgroundColor: colors.primaryLight },
        variant === 'outline' && { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
        variant === 'danger' && { borderWidth: 1, borderColor: colors.dangerSoft, backgroundColor: colors.white },
        gradient && !off && shadow.sm,
        { opacity: off ? 0.55 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {gradient ? (
        <LinearGradient colors={gradient} {...GRADIENT_PROPS} style={{ borderRadius: radius.md + 2 }}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md + 2, overflow: 'hidden' },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  text: { fontWeight: '700', letterSpacing: 0.1 },
});
