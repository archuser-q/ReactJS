import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT, GRADIENT_PROPS, shadowLg } from '../theme';

export function GradientButton({
  title,
  onPress,
  style,
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [styles.wrap, shadowLg, pressed && !off && { opacity: 0.9 }, off && { opacity: 0.6 }, style]}
    >
      <LinearGradient colors={GRADIENT} {...GRADIENT_PROPS} style={styles.grad}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{title}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16 },
  grad: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', minHeight: 51, justifyContent: 'center' },
  text: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
