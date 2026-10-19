/** Các mảnh giao diện nhỏ dùng nhiều nơi */
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { colors, op, radius, tabular } from '../theme';
import { initials, JOB_STATUS } from '../utils/format';
import type { OrderStatus } from '../api';
import { mediaUri } from '../config/env';

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.9 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{children}</Text>
      {right}
    </View>
  );
}

export function Avatar({ name, uri, size = 44, color = colors.primary }: { name?: string | null; uri?: string | null; size?: number; color?: string }) {
  if (uri) {
    return <Image source={{ uri: mediaUri(uri) }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.line }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: op(color, 0.12), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontWeight: '800', fontSize: size * 0.36 }}>{initials(name)}</Text>
    </View>
  );
}

export function StatusPill({ status, small }: { status: OrderStatus; small?: boolean }) {
  const s = JOB_STATUS[status];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }, small && { paddingHorizontal: 8, paddingVertical: 3 }]}>
      <Icon name={s.icon} size={small ? 11 : 13} color={s.color} />
      <Text style={[styles.pillText, { color: s.color }, small && { fontSize: 11 }]}>{s.label}</Text>
    </View>
  );
}

export function Tag({ label, color = colors.primary, bg, icon }: { label: string; color?: string; bg?: string; icon?: IconName }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg ?? op(color, 0.1) }]}>
      {icon ? <Icon name={icon} size={12} color={color} /> : null}
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function StarRating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name={value >= i ? 'star' : value >= i - 0.5 ? 'star-half-full' : 'star-outline'}
          size={size}
          color={colors.amber}
        />
      ))}
    </View>
  );
}

export function KeyValue({ label, value, strong, color, icon }: { label: string; value: ReactNode; strong?: boolean; color?: string; icon?: IconName }) {
  return (
    <View style={styles.kv}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
        {icon ? <Icon name={icon} size={15} color={colors.faint} /> : null}
        <Text style={[styles.kvLabel, strong && { color: colors.text, fontWeight: '700' }]}>{label}</Text>
      </View>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text style={[styles.kvValue, strong && { fontSize: 16, fontWeight: '800' }, color ? { color } : null]}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: colors.line }, style]} />;
}

/** Chấm nhấp nháy (đang nhận đơn / đơn mới) */
export function PulseDot({ color = colors.primary, size = 8 }: { color?: string; size?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <View style={{ width: size * 2.4, height: size * 2.4, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size * 2.4,
          height: size * 2.4,
          borderRadius: size * 1.2,
          backgroundColor: color,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
        }}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

/** Hiệu ứng "radar" khi đang chờ đơn: 3 vòng lan ra đều nhau */
export function Radar({ color = colors.primary, size = 120 }: { color?: string; size?: number }) {
  const rings = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  useEffect(() => {
    const anims = rings.map((r, i) =>
      Animated.sequence([
        Animated.delay(i * 700),
        Animated.loop(
          Animated.sequence([
            Animated.timing(r, { toValue: 1, duration: 2100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(r, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ),
      ]),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [rings]);
  const core = Math.round(size * 0.36);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {rings.map((r, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: color,
            opacity: r.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
            transform: [{ scale: r.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
          }}
        />
      ))}
      <View style={{ width: core, height: core, borderRadius: core / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="lightning-bolt" size={Math.round(core * 0.55)} color="#fff" />
      </View>
    </View>
  );
}

/** Ô số liệu nhỏ */
export function StatBox({ label, value, sub, color = colors.text, style }: { label: string; value: string; sub?: string; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.stat, style]}>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub ? (
        <Text style={styles.statSub} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

export function Banner({ icon, text, tone = 'info', action, onPress }: { icon?: IconName; text: string; tone?: 'info' | 'warning' | 'danger' | 'success'; action?: string; onPress?: () => void }) {
  const map = {
    info: [colors.primary, colors.primaryLight],
    warning: [colors.warning, colors.warningBg],
    danger: [colors.danger, colors.dangerBg],
    success: [colors.success, colors.successBg],
  } as const;
  const [fg, bg] = map[tone];
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.banner, { backgroundColor: bg, borderColor: op(fg, 0.2) }]}>
      <Icon name={icon ?? (tone === 'info' ? 'information-outline' : tone === 'success' ? 'check-circle-outline' : 'alert-circle-outline')} size={18} color={fg} />
      <Text style={[styles.bannerText, { color: fg }]}>{text}</Text>
      {action ? <Text style={[styles.bannerAction, { color: fg }]}>{action}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 16 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 6 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '700' },
  kv: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7, gap: 12 },
  kvLabel: { fontSize: 14, color: colors.muted },
  kvValue: { fontSize: 14, color: colors.text, fontWeight: '600', textAlign: 'right', flexShrink: 1, ...tabular },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 12 },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  statValue: { fontSize: 19, fontWeight: '800', marginTop: 4, ...tabular },
  statSub: { fontSize: 11, color: colors.faint, marginTop: 1 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.lg, borderWidth: 1 },
  bannerText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  bannerAction: { fontSize: 13, fontWeight: '800' },
});
