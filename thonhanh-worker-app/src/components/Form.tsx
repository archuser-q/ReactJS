/** Ô nhập, chip chọn, thanh chọn đoạn, công tắc, dòng menu */
import { forwardRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type TextInput as RNTextInput, type TextInputProps, type ViewStyle } from 'react-native';
import { Text, TextInput } from './Text';
import { Icon, type IconName } from './Icon';
import { colors, op, radius } from '../theme';

type FieldProps = TextInputProps & {
  label?: string;
  icon?: IconName;
  error?: string | null;
  hint?: string;
  secure?: boolean;
  suffix?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export const TextField = forwardRef<RNTextInput, FieldProps>(function TextField(
  { label, icon, error, hint, secure, suffix, containerStyle, style, multiline, ...rest },
  ref,
) {
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState(false);
  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.box,
          multiline && { alignItems: 'flex-start', paddingVertical: 10 },
          focus && { borderColor: colors.primary, backgroundColor: colors.white },
          !!error && { borderColor: colors.dangerMid },
        ]}
      >
        {icon ? <Icon name={icon} size={18} color={focus ? colors.primary : colors.faint} style={multiline ? { marginTop: 2 } : undefined} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.faint}
          secureTextEntry={secure && !show}
          multiline={multiline}
          onFocus={(e) => {
            setFocus(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, multiline && { minHeight: 84, textAlignVertical: 'top' }, style]}
          {...rest}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
        {secure ? (
          <Pressable onPress={() => setShow((v) => !v)} hitSlop={10} accessibilityLabel={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
            <Icon name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.faint} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

export function Chip({
  label,
  selected,
  onPress,
  icon,
  color = colors.primary,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected ? { backgroundColor: op(color, 0.1), borderColor: color } : null,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={15} color={selected ? color : colors.muted} /> : null}
      <Text style={[styles.chipText, selected && { color, fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  style,
}: {
  value: T;
  options: { value: T; label: string; badge?: number }[];
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.seg, style]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.segItem, on && styles.segOn]}>
            <Text style={[styles.segText, on && { color: colors.white }]}>{o.label}</Text>
            {o.badge ? (
              <View style={[styles.segBadge, on && { backgroundColor: colors.white }]}>
                <Text style={[styles.segBadgeText, on && { color: colors.primary }]}>{o.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ value, onChange, disabled, onColor = colors.primary }: { value: boolean; onChange?: (v: boolean) => void; disabled?: boolean; onColor?: string }) {
  return (
    <Pressable
      onPress={() => onChange?.(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      hitSlop={8}
      style={[styles.toggle, { backgroundColor: value ? onColor : colors.border, opacity: disabled ? 0.5 : 1 }]}
    >
      <View style={[styles.knob, { transform: [{ translateX: value ? 20 : 0 }] }]} />
    </Pressable>
  );
}

export function MenuSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: 16 }}>
      {title ? <Text style={styles.menuTitle}>{title}</Text> : null}
      <View style={styles.menuBox}>{children}</View>
    </View>
  );
}

export function MenuItem({
  label,
  sub,
  icon,
  onPress,
  danger,
  right,
  last,
  iconColor,
}: {
  label: string;
  sub?: string | null;
  icon: IconName;
  onPress?: () => void;
  danger?: boolean;
  right?: ReactNode;
  last?: boolean;
  iconColor?: string;
}) {
  const c = danger ? colors.danger : iconColor ?? colors.primary;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, !last && styles.itemLine, pressed && { backgroundColor: colors.line }]}>
      <View style={[styles.itemIcon, { backgroundColor: op(c, 0.1) }]}>
        <Icon name={icon} size={18} color={c} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemLabel, danger && { color: colors.danger }]}>{label}</Text>
        {sub ? (
          <Text style={styles.itemSub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
      {right ?? (onPress && !danger ? <Icon name="chevron-right" size={20} color={colors.faint} /> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: colors.body, marginBottom: 6 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    minHeight: 50,
  },
  input: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 10, outlineStyle: 'none' } as never,
  suffix: { fontSize: 14, color: colors.faint, fontWeight: '600' },
  error: { fontSize: 12, color: colors.danger, marginTop: 5 },
  hint: { fontSize: 12, color: colors.faint, marginTop: 5 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipText: { fontSize: 13, color: colors.body, fontWeight: '600' },
  seg: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.lg, padding: 4, borderWidth: 1, borderColor: colors.line },
  segItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: radius.md },
  segOn: { backgroundColor: colors.primary },
  segText: { fontSize: 13, fontWeight: '700', color: colors.faint },
  segBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  segBadgeText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  toggle: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white },
  menuTitle: { fontSize: 14, fontWeight: '700', color: colors.muted, marginBottom: 8, marginLeft: 4 },
  menuBox: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  itemLine: { borderBottomWidth: 1, borderBottomColor: colors.line },
  itemIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemSub: { fontSize: 12, color: colors.faint, marginTop: 2 },
});
