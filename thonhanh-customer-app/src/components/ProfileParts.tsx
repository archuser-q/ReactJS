import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors } from '../theme';

export function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ gap: 6 }}>{children}</View>
    </View>
  );
}

export function ProfileItem({
  label,
  icon,
  sub,
  badge,
  danger,
  onPress,
}: {
  label: string;
  icon: IconName;
  sub?: string;
  badge?: string | number;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.gray50 }]}>
      <View style={[styles.iconBox, { backgroundColor: danger ? colors.red50 : colors.primaryLight }]}>
        <Icon name={icon} size={16} color={danger ? colors.red500 : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemLabel, danger && { color: colors.red600 }]}>{label}</Text>
        {sub ? <Text style={styles.itemSub}>{sub}</Text> : null}
      </View>
      {badge !== undefined && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {!danger && <Icon name="chevron-right" size={18} color={colors.gray300} />}
    </Pressable>
  );
}

export function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable onPress={() => setOpen(!open)} style={styles.faq}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[styles.itemLabel, { flex: 1, paddingRight: 8 }]}>{q}</Text>
        <Icon
          name="chevron-right"
          size={18}
          color={colors.gray300}
          style={open ? { transform: [{ rotate: '90deg' }] } : undefined}
        />
      </View>
      {open && <Text style={styles.faqAnswer}>{a}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  iconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontSize: 14, fontWeight: '500', color: colors.text },
  itemSub: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  badge: { backgroundColor: colors.red100, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '600', color: colors.red600 },
  faq: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray100,
    padding: 14,
  },
  faqAnswer: { fontSize: 12, color: colors.gray500, lineHeight: 18, marginTop: 8 },
});
