/** Đánh giá từ khách + Hiệu suất làm việc */
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api, errMsg, qk, type ReviewsPage } from '../../api';
import { Banner, Card, StarRating } from '../../components/Bits';
import { ProgressBar } from '../../components/Charts';
import { Chip } from '../../components/Form';
import { Icon, type IconName } from '../../components/Icon';
import { Header, Screen } from '../../components/Screen';
import { StateView } from '../../components/StateView';
import { useRootNav } from '../../navigation/types';
import { colors } from '../../theme';
import { fmtDate, fmtRating, money, orderCode, pct } from '../../utils/format';

export function ReviewsScreen() {
  const navigation = useRootNav();
  const [rating, setRating] = useState<number | null>(null);
  const q = useInfiniteQuery({
    queryKey: qk.reviews(rating),
    queryFn: ({ pageParam }) => api.reviews(rating, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last: ReviewsPage) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
  });
  const first = q.data?.pages[0];
  const summary = first?.summary;
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  const maxCount = summary ? Math.max(1, ...Object.values(summary.distribution)) : 1;

  return (
    <Screen>
      <Header title="Đánh giá từ khách" />
      <FlatList
        data={items}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && void q.fetchNextPage()}
        ListHeaderComponent={
          summary ? (
            <View style={{ gap: 12, marginBottom: 4 }}>
              <Card style={styles.summary}>
                <View style={{ alignItems: 'center', width: 100 }}>
                  <Text style={styles.avg}>{summary.rating_avg ? fmtRating(summary.rating_avg) : '—'}</Text>
                  <StarRating value={summary.rating_avg ?? 0} size={14} />
                  <Text style={styles.count}>{summary.rating_count} đánh giá</Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  {[5, 4, 3, 2, 1].map((s) => (
                    <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.star}>{s}★</Text>
                      <ProgressBar value={(summary.distribution[String(s)] ?? 0) / maxCount} color={colors.amber} height={7} />
                      <Text style={styles.num}>{summary.distribution[String(s)] ?? 0}</Text>
                    </View>
                  ))}
                </View>
              </Card>
              <View style={styles.chips}>
                <Chip label="Tất cả" selected={rating === null} onPress={() => setRating(null)} />
                {[5, 4, 3, 2, 1].map((s) => (
                  <Chip key={s} label={`${s} sao`} selected={rating === s} onPress={() => setRating(s)} />
                ))}
              </View>
              <Text style={styles.hint}>Đánh giá từ 3 sao trở xuống mà không đúng sự thật, bấm "Khiếu nại" để quản trị viên đối chiếu ảnh và tin nhắn của đơn.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Card style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.cust}>{item.customer_name}</Text>
              <Text style={styles.date}>{fmtDate(item.created_at)}</Text>
            </View>
            <StarRating value={item.rating} />
            {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : <Text style={styles.noComment}>Không có nhận xét</Text>}
            <View style={styles.foot}>
              <Text style={styles.svc} numberOfLines={1}>
                {orderCode({ id: item.order_id, code: item.code })} · {item.service_name}
              </Text>
              {/* Chỉ đánh giá thấp mới cần khiếu nại (giống app tài xế); admin đối chiếu ảnh + tin nhắn của đơn */}
              {item.rating <= 3 ? (
                <Pressable
                  onPress={() => navigation.navigate('ReportIssue', { orderId: item.order_id, type: 'Đánh giá không đúng sự thật' })}
                  hitSlop={8}
                  style={styles.dispute}
                >
                  <Icon name="flag-outline" size={14} color={colors.muted} />
                  <Text style={styles.disputeText}>Khiếu nại</Text>
                </Pressable>
              ) : null}
            </View>
          </Card>
        )}
        ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : null}
        ListEmptyComponent={<StateView loading={q.isLoading} error={q.error ? errMsg(q.error) : null} empty="Chưa có đánh giá nào" icon="star-outline" />}
      />
    </Screen>
  );
}

export function PerformanceScreen() {
  const q = useQuery({ queryKey: qk.performance, queryFn: api.performance });
  const p = q.data;
  return (
    <Screen>
      <Header title="Hiệu suất làm việc" subtitle="30 ngày gần nhất" />
      {!p ? (
        <StateView loading={q.isLoading} error={q.error ? errMsg(q.error) : null} onRetry={() => void q.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          <Card style={{ alignItems: 'center', gap: 6 }}>
            <Text style={styles.big}>{Math.round(p.trust_score * 100)}</Text>
            <Text style={styles.bigLabel}>Điểm tin cậy / 100</Text>
            <View style={{ alignSelf: 'stretch', marginTop: 6 }}>
              <ProgressBar value={p.trust_score} height={10} />
            </View>
            <Text style={styles.explain}>
              Điểm tin cậy được tính từ đánh giá của khách (ưu tiên đánh giá gần đây), số lượng đánh giá và các dấu hiệu bất thường. Điểm càng cao bạn
              càng được ưu tiên khi hệ thống ghép đơn.
            </Text>
          </Card>
          <Metric icon="hand-okay" title="Tỷ lệ nhận đơn" value={pct(p.acceptance_rate)} ratio={p.acceptance_rate} sub={`Nhận ${p.offers_accepted} / ${p.offers_accepted + p.offers_rejected + p.offers_expired} lời mời (bỏ qua ${p.offers_rejected}, hết giờ ${p.offers_expired})`} />
          <Metric icon="check-decagram-outline" title="Tỷ lệ hoàn thành" value={pct(p.completion_rate)} ratio={p.completion_rate} sub={`Hoàn thành ${p.jobs_completed} đơn · hủy sau khi nhận ${p.jobs_cancelled_by_worker} đơn`} />
          <Metric icon="star-outline" title="Đánh giá trung bình" value={p.rating_avg ? `${fmtRating(p.rating_avg)}★` : '—'} ratio={p.rating_avg ? p.rating_avg / 5 : null} sub={`${p.rating_count} đánh giá`} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Card style={{ flex: 1 }}>
              <Text style={styles.small}>Tổng đơn đã làm</Text>
              <Text style={styles.mid}>{p.total_completed}</Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={styles.small}>Tổng thực nhận</Text>
              <Text style={styles.mid}>{money(p.total_net)}</Text>
            </Card>
          </View>
          <Banner
            icon="lightbulb-on-outline"
            text="Điểm tin cậy là một tiêu chí khi ghép đơn. Để giữ điểm cao: nhận đơn nhanh, hạn chế hủy sau khi đã nhận, chụp ảnh trước/sau rõ ràng và giữ thái độ lịch sự để được đánh giá tốt."
          />
        </ScrollView>
      )}
    </Screen>
  );
}

function Metric({ icon, title, value, ratio, sub }: { icon: IconName; title: string; value: string; ratio: number | null; sub: string }) {
  const color = ratio === null ? colors.faint : ratio >= 0.8 ? colors.success : ratio >= 0.6 ? colors.warning : colors.danger;
  return (
    <Card style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={[styles.mIcon, { backgroundColor: colors.primaryLight }]}>
          <Icon name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={styles.mTitle}>{title}</Text>
        <Text style={[styles.mValue, { color }]}>{value}</Text>
      </View>
      <ProgressBar value={ratio ?? 0} color={color} />
      <Text style={styles.small}>{sub}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avg: { fontSize: 40, fontWeight: '900', color: colors.text, fontVariant: ['tabular-nums'] },
  count: { fontSize: 12, color: colors.faint, marginTop: 4 },
  star: { width: 26, fontSize: 12, color: colors.muted, fontWeight: '700' },
  num: { width: 28, fontSize: 12, color: colors.faint, textAlign: 'right', fontVariant: ['tabular-nums'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cust: { fontSize: 14, fontWeight: '800', color: colors.text },
  date: { fontSize: 12, color: colors.faint },
  comment: { fontSize: 14, color: colors.body, lineHeight: 20 },
  noComment: { fontSize: 13, color: colors.faint, fontStyle: 'italic' },
  svc: { flex: 1, fontSize: 12, color: colors.primary, fontWeight: '600' },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  hint: { fontSize: 12, color: colors.muted, lineHeight: 17 },
  dispute: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  disputeText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  big: { fontSize: 52, fontWeight: '900', color: colors.success, fontVariant: ['tabular-nums'] },
  bigLabel: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  explain: { fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 18, marginTop: 6 },
  mIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  mTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  mValue: { fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  small: { fontSize: 12, color: colors.muted },
  mid: { fontSize: 18, fontWeight: '900', color: colors.text, fontVariant: ['tabular-nums'], marginTop: 4 },
});

