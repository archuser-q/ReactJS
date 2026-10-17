import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from './Icon';
import { colors } from '../theme';
import { useNav, type ScreenName } from '../navigation/NavigationContext';

const TABS: { id: ScreenName; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Trang chủ', icon: 'home-outline' },
  { id: 'history', label: 'Đơn hàng', icon: 'clipboard-list-outline' },
  { id: 'track', label: 'Theo dõi', icon: 'navigation-outline' },
  { id: 'chat', label: 'Tin nhắn', icon: 'message-text-outline' },
  { id: 'profile', label: 'Tài khoản', icon: 'account-outline' },
];

/** Màn hình nào thì sáng tab nào */
function activeTab(screen: ScreenName): ScreenName {
  if (screen === 'book' || screen === 'match') return 'home';
  if (screen === 'review') return 'history';
  if (screen === 'notifications') return 'home';
  if (['reviewsMine', 'payment', 'transactions', 'personalInfo', 'addresses', 'help', 'support'].includes(screen))
    return 'profile';
  return screen;
}

export function BottomNav({ onTab }: { onTab: (s: ScreenName) => void }) {
  const { screen } = useNav();
  const insets = useSafeAreaInsets();
  const active = activeTab(screen);
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((t) => {
        const on = t.id === active;
        return (
          <Pressable key={t.id} style={styles.tab} onPress={() => onTab(t.id)}>
            <View style={[styles.pill, on && { backgroundColor: colors.primaryLight }]}>
              <Icon name={t.icon} size={20} color={on ? colors.primary : colors.gray400} />
            </View>
            <Text style={[styles.label, { color: on ? colors.primary : colors.gray400 }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: 6,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  pill: { width: 44, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '600' },
});
