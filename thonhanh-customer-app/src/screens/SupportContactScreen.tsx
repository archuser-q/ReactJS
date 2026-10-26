import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../components/Icon';
import { DetailHeader, Screen } from '../components/Screen';
import { colors } from '../theme';

const OPTIONS: { label: string; sub: string; icon: IconName; onPress: () => void }[] = [
  { label: 'Gọi hotline', sub: '1900 6868 · 24/7', icon: 'phone-outline', onPress: () => Linking.openURL('tel:19006868') },
  {
    label: 'Chat với CSKH',
    sub: 'Phản hồi trong 5 phút',
    icon: 'message-text-outline',
    onPress: () => Alert.alert('Thông báo', 'Kênh chat CSKH đang phát triển. Bạn có thể gửi khiếu nại trong màn Theo dõi đơn.'),
  },
  { label: 'Gửi email', sub: 'hotro@thonhanh.vn', icon: 'send', onPress: () => Linking.openURL('mailto:hotro@thonhanh.vn') },
];

export default function SupportContactScreen() {
  return (
    <Screen bg={colors.pageBg}>
      <DetailHeader title="Liên hệ CSKH" />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {OPTIONS.map((o) => (
          <Pressable key={o.label} style={styles.card} onPress={o.onPress}>
            <View style={styles.icon}>
              <Icon name={o.icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{o.label}</Text>
              <Text style={styles.sub}>{o.sub}</Text>
            </View>
            <Icon name="chevron-right" size={18} color={colors.gray300} />
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: colors.gray100, padding: 14,
  },
  icon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '500', color: colors.text },
  sub: { fontSize: 12, color: colors.gray400, marginTop: 2 },
});
