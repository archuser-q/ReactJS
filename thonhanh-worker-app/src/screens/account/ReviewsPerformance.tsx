/** Đánh giá từ khách + Hiệu suất làm việc */
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api, errMsg, qk, type Performance, type ReviewsPage } from '../../api';
import { Banner, Card, StarRating } from '../../components/Bits';
import { ProgressBar } from '../../components/Charts';
import { Chip } from '../../components/Form';
import { Icon, type IconName } from '../../components/Icon';
import { Header, Screen } from '../../components/Screen';
import { StateView } from '../../components/StateView';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';
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
  useRefetchOnFocus(q.refetch);
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
        refreshControl={<RefreshControl refreshing={q.isRefetching && !q.isFetchingNextPage} onRefresh={() => void q.refetch()} tintColor={colors.primary} />}
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
  useRefetchOnFocus(q.refetch);
  const p = q.data;
  return (
    <Screen>
      <Header title="Hiệu suất làm việc" subtitle="30 ngày gần nhất" />
      {!p ? (
        <StateView loading={q.isLoading} error={q.error ? errMsg(q.error) : null} onRetry={() => void q.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.primary} />}
        >
          <TrustCard p={p} />
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
            text="Để giữ điểm tin cậy cao: làm tới cùng đơn đã nhận (hạn chế huỷ), làm cẩn thận để không bị khiếu nại, giữ thái độ lịch sự để được đánh giá tốt. Nhận đơn nhanh là tiêu chí riêng (tỷ lệ nhận đơn) khi ghép."
          />
        </ScrollView>
      )}
    </Screen>
  );
}

/**
 * Điểm tin cậy và 3 thành phần (cùng công thức với backend src/algorithms/trust.js):
 *   0,5 · đánh giá (làm mượt Bayes) + 0,3 · giữ lời (hoàn thành / huỷ sau khi nhận) + 0,2 · khiếu nại đúng
 */
function TrustCard({ p }: { p: Performance }) {
  const t = p.trust;
  const pctW = (w: number) => `${Math.round(w * 100)}%`;
  return (
    <Card style={{ gap: 6 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={styles.big}>{t?.has_history ? Math.round(p.trust_score * 100) : 50}</Text>
        <Text style={styles.bigLabel}>Điểm tin cậy / 100</Text>
        <View style={{ alignSelf: 'stretch', marginTop: 6 }}>
          <ProgressBar value={t?.has_history ? p.trust_score : 0.5} height={10} />
        </View>
      </View>
      {!t?.has_history || !t.components ? (
        <Text style={styles.explain}>
          Bạn chưa có đơn hoàn thành hay đánh giá nào, nên khi ghép đơn hệ thống tạm dùng mức trung tính 50 điểm. Điểm thật được tính từ đơn đầu tiên.
        </Text>
      ) : (
        <>
          <Text style={styles.explain}>Điểm càng cao bạn càng được ưu tiên khi hệ thống ghép đơn. Điểm gồm 3 phần:</Text>
          <TrustPart
            title={`Đánh giá của khách (${pctW(t.weights.rating)})`}
            value={t.components.rating}
            sub={
              t.inputs.reviewCount
                ? `${t.inputs.reviewCount} đánh giá, điểm đã làm mượt ${stars(t.bayesRating)}★. Mỗi đánh giá mới làm điểm đổi dần, không nhảy vọt vì 1–2 đánh giá đầu.`
                : `Chưa có đánh giá: tạm tính theo điểm trung bình của cả nền tảng (${stars(t.inputs.mean)}★). Có đánh giá thật thì điểm đổi dần theo đánh giá của bạn.`
            }
          />
          <TrustPart
            title={`Giữ lời (${pctW(t.weights.reliability)})`}
            value={t.components.reliability}
            sub={
              `180 ngày: hoàn thành ${t.inputs.completed} đơn, huỷ sau khi đã nhận ${t.inputs.cancelledAfterAccept} lần. ` +
              // Công thức (K + 4,5) / (K + X + 5): thợ mới coi như có sẵn 5 đơn "ảo" giữ lời 90% (backend algorithms/trust.js)
              (t.inputs.cancelledAfterAccept
                ? 'Mỗi lần huỷ sau khi đã nhận bị trừ điểm; làm thêm đơn đến cùng thì điểm hồi lại dần.'
                : 'Thợ mới bắt đầu từ 90 điểm, mỗi đơn hoàn thành mà không huỷ thì điểm tăng dần về 100.')
            }
          />
          <TrustPart
            title={`Khiếu nại (${pctW(t.weights.complaints)})`}
            value={t.components.complaints}
            sub={t.inputs.validComplaints ? `180 ngày: ${t.inputs.validComplaints} khiếu nại của khách được xác nhận đúng` : '180 ngày: không có khiếu nại nào được xác nhận'}
          />
        </>
      )}
    </Card>
  );
}

const stars = (v: number | undefined) => (Math.round((v ?? 0) * 10) / 10).toFixed(1).replace('.', ',');

function TrustPart({ title, value, sub }: { title: string; value: number; sub: string }) {
  const color = value >= 0.8 ? colors.success : value >= 0.6 ? colors.warning : colors.danger;
  return (
    <View style={styles.part}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.partTitle}>{title}</Text>
        <Text style={[styles.partValue, { color }]}>{Math.round(value * 100)}</Text>
      </View>
      <ProgressBar value={value} color={color} />
      <Text style={styles.small}>{sub}</Text>
    </View>
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
  part: { gap: 6, paddingTop: 10, marginTop: 4, borderTopWidth: 1, borderTopColor: colors.line },
  partTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  partValue: { fontSize: 16, fontWeight: '900', fontVariant: ['tabular-nums'] },
  mIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  mTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  mValue: { fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  small: { fontSize: 12, color: colors.muted },
  mid: { fontSize: 18, fontWeight: '900', color: colors.text, fontVariant: ['tabular-nums'], marginTop: 4 },
});

