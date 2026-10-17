import { ScrollView, StyleSheet } from 'react-native';
import { FAQItem } from '../components/ProfileParts';
import { DetailHeader, Screen } from '../components/Screen';
import { FAQS } from '../data/mock';
import { colors } from '../theme';

export default function HelpCenterScreen() {
  return (
    <Screen bg={colors.pageBg}>
      <DetailHeader title="Trung tâm trợ giúp" />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {FAQS.map((f, i) => (
          <FAQItem key={i} q={f.q} a={f.a} />
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
});
