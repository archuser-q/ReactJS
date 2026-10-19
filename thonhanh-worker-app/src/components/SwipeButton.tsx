import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, PanResponder, Platform, StyleSheet, Vibration, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { colors, gradients, GRADIENT_PROPS, palette, radius } from '../theme';

const AnimatedText = Animated.createAnimatedComponent(Text);

const KNOB = 52;
const PAD = 4;

/**
 * "Vuốt để xác nhận" — dùng cho các bước quan trọng (bắt đầu đi, đã đến, hoàn thành) để thợ
 * không bấm nhầm khi đang cầm điện thoại ngoài đường (giống app tài xế công nghệ).
 */
export function SwipeButton({
  label,
  onConfirm,
  icon = 'chevron-double-right',
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onConfirm: () => Promise<unknown> | void;
  icon?: IconName;
  variant?: 'primary' | 'success';
  disabled?: boolean;
}) {
  const [width, setWidth] = useState(0);
  const [busy, setBusy] = useState(false);
  const x = useRef(new Animated.Value(0)).current;
  const max = Math.max(0, width - KNOB - PAD * 2);
  const maxRef = useRef(0);
  maxRef.current = max;
  const busyRef = useRef(false);
  busyRef.current = busy || disabled;
  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;

  const reset = () => Animated.spring(x, { toValue: 0, useNativeDriver: false, bounciness: 6 }).start();

  const fire = async () => {
    setBusy(true);
    if (Platform.OS !== 'web') Vibration.vibrate(30);
    try {
      await confirmRef.current();
    } finally {
      setBusy(false);
      reset();
    }
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !busyRef.current,
      onMoveShouldSetPanResponder: (_, g) => !busyRef.current && Math.abs(g.dx) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => x.setValue(Math.max(0, Math.min(maxRef.current, g.dx))),
      onPanResponderRelease: (_, g) => {
        if (g.dx >= maxRef.current * 0.85 && maxRef.current > 0) {
          Animated.timing(x, { toValue: maxRef.current, duration: 120, useNativeDriver: false }).start(() => void fire());
        } else {
          reset();
        }
      },
      onPanResponderTerminate: () => reset(),
    }),
  ).current;

  useEffect(() => {
    if (disabled) x.setValue(0);
  }, [disabled, x]);

  const textOpacity = x.interpolate({ inputRange: [0, Math.max(1, max * 0.6)], outputRange: [1, 0], extrapolate: 'clamp' });
  const g = variant === 'success' ? gradients.success : gradients.primary;

  return (
    <View
      style={[styles.track, { opacity: disabled ? 0.5 : 1 }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityActions={[{ name: 'activate', label }]}
      onAccessibilityAction={() => !busy && !disabled && void fire()}
    >
      <LinearGradient colors={g} {...GRADIENT_PROPS} style={StyleSheet.absoluteFill} />
      <AnimatedText style={[styles.label, { opacity: textOpacity }]} numberOfLines={1}>
        {busy ? 'Đang xử lý...' : label}
      </AnimatedText>
      <Animated.View
        {...pan.panHandlers}
        style={[styles.knob, variant === 'primary' && { backgroundColor: palette.volt }, { transform: [{ translateX: x }] }]}
      >
        {busy ? (
          <ActivityIndicator color={variant === 'success' ? colors.success : colors.navy} />
        ) : (
          <Icon name={icon} size={28} color={variant === 'success' ? colors.success : colors.navy} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: KNOB + PAD * 2, borderRadius: radius.pill, overflow: 'hidden', justifyContent: 'center', userSelect: 'none' },
  label: { position: 'absolute', left: KNOB + 16, right: 16, textAlign: 'center', color: colors.white, fontSize: 16, fontWeight: '700' },
  knob: {
    position: 'absolute',
    left: PAD,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
