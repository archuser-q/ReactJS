/**
 * Công tắc bật/tắt (giống công tắc gạt của iOS/Android) — dùng cho "Nhận đơn".
 * Mọi animation chạy bằng JS (useNativeDriver: false) vì cùng 1 view vừa đổi màu vừa di chuyển.
 */
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet } from 'react-native';
import { colors, palette } from '../theme';

const W = 56;
const H = 32;
const KNOB = 26;

export function Toggle({
  value,
  onChange,
  busy,
  disabled,
  label,
}: {
  value: boolean;
  onChange?: (next: boolean) => void;
  busy?: boolean;
  disabled?: boolean;
  label: string;
}) {
  const v = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: value ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [value, v]);
  const bg = v.interpolate({ inputRange: [0, 1], outputRange: ['#C9D2DE', palette.live] });
  const x = v.interpolate({ inputRange: [0, 1], outputRange: [3, W - KNOB - 3] });
  return (
    <Pressable
      onPress={() => !busy && !disabled && onChange?.(!value)}
      disabled={!onChange || disabled}
      hitSlop={10}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled, busy: !!busy }}
      accessibilityLabel={label}
      style={disabled ? { opacity: 0.5 } : undefined}
    >
      <Animated.View style={[styles.track, { backgroundColor: bg }]}>
        <Animated.View style={[styles.knob, { transform: [{ translateX: x }] }]}>
          {busy ? <ActivityIndicator size="small" color={value ? palette.live : colors.faint} /> : null}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: W, height: H, borderRadius: H / 2, justifyContent: 'center' },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
