import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { colors } from '../theme';
import { useNav } from '../navigation/NavigationContext';

/** Khung màn hình: chừa chỗ cho tai thỏ / status bar */
export function Screen({
  children,
  bg = colors.white,
  noInset = false,
}: {
  children: ReactNode;
  bg?: string;
  noInset?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: noInset ? 0 : insets.top }}>
      {children}
    </View>
  );
}

/** Header có nút back tròn xám (Đặt dịch vụ, Thợ phù hợp, Đánh giá, Lịch sử) */
export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { goBack } = useNav();
  return (
    <View style={styles.header}>
      <Pressable onPress={goBack} style={styles.backCircle} hitSlop={8}>
        <Icon name="arrow-left" size={16} color={colors.text} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

/** Header cho các màn con trong Tài khoản */
export function DetailHeader({ title }: { title: string }) {
  const { goBack } = useNav();
  return (
    <View style={styles.detail}>
      <Pressable onPress={goBack} style={styles.detailBack} hitSlop={8}>
        <Icon name="arrow-left" size={18} color={colors.text} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: colors.white,
  },
  backCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 12, color: colors.gray400, marginTop: 1 },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  detailBack: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
  },
});
