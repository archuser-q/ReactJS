import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Icon, type IconName } from './Icon';
import { colors } from '../theme';

/**
 * Khung màn hình: chừa tai thỏ/thanh trạng thái ở trên và thanh điều hướng của hệ thống ở dưới
 * (Android vẽ tràn viền: app nằm cả dưới 3 nút điều hướng), tự đẩy nội dung lên khi bàn phím mở.
 * KeyboardAvoidingView "padding" tự tính phần bị bàn phím che nên dùng được cho cả Android.
 */
export function Screen({
  children,
  bg = colors.bg,
  noTopInset = false,
  noBottomInset = false,
  style,
}: {
  children: ReactNode;
  bg?: string;
  noTopInset?: boolean;
  /** Màn tự lo phần đáy (VD thanh nhập tin nhắn) */
  noBottomInset?: boolean;
  style?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: bg }} behavior={Platform.OS === 'web' ? undefined : 'padding'}>
      <View style={[{ flex: 1, paddingTop: noTopInset ? 0 : insets.top, paddingBottom: noBottomInset ? 0 : insets.bottom }, style]}>
        {children}
      </View>
    </KeyboardAvoidingView>
  );
}

type HeaderAction = { icon: IconName; onPress: () => void; badge?: number; label?: string };

/** Header trắng có nút quay lại tròn (giống bản thiết kế) */
export function Header({
  title,
  subtitle,
  back = true,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: HeaderAction | ReactNode;
  onBack?: () => void;
}) {
  const nav = useNavigation();
  const goBack = onBack ?? (() => (nav.canGoBack() ? nav.goBack() : undefined));
  return (
    <View style={styles.header}>
      {back ? (
        <Pressable onPress={goBack} style={styles.circle} hitSlop={10} accessibilityLabel="Quay lại">
          <Icon name="arrow-left" size={20} color={colors.text} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right && typeof right === 'object' && 'icon' in (right as object) ? (
        <Pressable
          onPress={(right as HeaderAction).onPress}
          style={styles.circle}
          hitSlop={10}
          accessibilityLabel={(right as HeaderAction).label}
        >
          <Icon name={(right as HeaderAction).icon} size={18} color={colors.text} />
          {(right as HeaderAction).badge ? <View style={styles.dot} /> : null}
        </Pressable>
      ) : (
        (right as ReactNode)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 1 },
  dot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.dangerMid,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});
