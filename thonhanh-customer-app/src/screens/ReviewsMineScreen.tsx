import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DetailHeader, Screen } from '../components/Screen';
import { StarRating } from '../components/StarRating';
import { StateView } from '../components/StateView';
import { api } from '../api';
import { useApi } from '../hooks/useApi';
import { fmtDate } from '../utils/format';
import { colors } from '../theme';

export default function ReviewsMineScreen() {
  const q = useApi(() => api.listMyReviews({ pageSize: 100 }), []);
  const items = q.data?.items ?? [];

  return (
    <Screen bg={colors.pageBg}>
      <DetailHeader title="Đánh giá của tôi" />
      {!q.data ? (
        <StateView loading={q.loading} error={q.error} onRetry={() => q.reload()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          {items.length === 0 && <StateView empty="Bạn chưa gửi đánh giá nào" icon="star-outline" />}
          {items.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.name}>{r.worker_name}</Text>
                <Text style={styles.date}>{fmtDate(r.created_at)}</Text>
              </View>
              <Text style={styles.service}>{r.service_name}</Text>
              <StarRating value={r.rating} />
              {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
            </View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: colors.gray100, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  date: { fontSize: 11, color: colors.gray400 },
  service: { fontSize: 12, color: colors.gray400, marginBottom: 6 },
  comment: { fontSize: 12, color: colors.gray600, marginTop: 8, lineHeight: 18 },
});
