import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { useIsFocused, useRoute, type RouteProp } from '@react-navigation/native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, errMsg, qk, type JobItem } from '../../api';
import { StatusPill } from '../../components/Bits';
import { Segmented } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { StateView } from '../../components/StateView';
import { useRootNav, type TabParamList } from '../../navigation/types';
import { colors, radius } from '../../theme';
import { fmtWhen, money, orderCode, PAYMENT_LABEL, serviceIcon } from '../../utils/format';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';

type Group = 'active' | 'completed' | 'cancelled';

export default function JobsScreen() {
  const navigation = useRootNav();
  const route = useRoute<RouteProp<TabParamList, 'Jobs'>>();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const [group, setGroup] = useState<Group>(route.params?.group ?? 'active');

  useEffect(() => {
    if (route.params?.group) setGroup(route.params.group);
  }, [route.params?.group]);

  const q = useInfiniteQuery({
    queryKey: qk.jobs(group),
    queryFn: ({ pageParam }) => api.jobs(group, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
    refetchInterval: focused && group === 'active' ? 10000 : false,
  });
  useRefetchOnFocus(q.refetch);
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  const activeCount = group === 'active' ? q.data?.pages[0]?.total : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.head, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Công việc</Text>
        <Segmented
          value={group}
          onChange={setGroup}
          options={[
            { value: 'active', label: 'Đang làm', badge: activeCount || undefined },
            { value: 'completed', label: 'Hoàn thành' },
            { value: 'cancelled', label: 'Đã hủy' },
          ]}
        />
      </View>
      <FlatList
        data={items}
        keyExtractor={(j) => String(j.id)}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={q.isRefetching && !q.isFetchingNextPage} onRefresh={() => void q.refetch()} tintColor={colors.primary} />}
        renderItem={({ item }) => <JobCard job={item} onPress={() => navigation.navigate('JobDetail', { orderId: item.id })} />}
        onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && void q.fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={{ margin: 12 }} /> : null}
        ListEmptyComponent={
          <StateView
            loading={q.isLoading}
            error={q.error ? errMsg(q.error) : null}
            onRetry={() => void q.refetch()}
            icon={group === 'active' ? 'clipboard-text-clock-outline' : group === 'completed' ? 'check-decagram-outline' : 'close-circle-outline'}
            empty={
              group === 'active'
                ? 'Chưa có việc nào đang làm.\nBật nhận đơn ở Trang chủ để nhận việc mới.'
                : group === 'completed'
                  ? 'Chưa có đơn hoàn thành'
                  : 'Không có đơn bị hủy'
            }
          />
        }
      />
    </View>
  );
}

export function JobCard({ job, onPress }: { job: JobItem; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}>
      <View style={styles.top}>
        <View style={styles.topLeft}>
          <StatusPill status={job.status} small />
          {job.rating ? (
            <View style={styles.rating} accessibilityLabel={`Khách đánh giá ${job.rating} sao`}>
              <Icon name="star" size={13} color={colors.amber} />
              <Text style={styles.ratingText}>{job.rating}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.when}>{fmtWhen(job.scheduled_at && job.status !== 'completed' ? job.scheduled_at : job.completed_at ?? job.accepted_at ?? job.created_at)}</Text>
      </View>
      <View style={styles.mid}>
        <View style={styles.icon}>
          <Icon name={serviceIcon(job.service_name)} size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.service} numberOfLines={1}>
            {job.service_name}
          </Text>
          <Text style={styles.addr} numberOfLines={1}>
            {job.address_text}
          </Text>
        </View>
        {job.unread_messages ? (
          <View style={styles.unread}>
            <Icon name="message-text" size={12} color="#fff" />
            <Text style={styles.unreadText}>{job.unread_messages}</Text>
          </View>
        ) : null}
      </View>
      {/* Chữ bên trái co lại (cắt "..."), số tiền bên phải giữ nguyên: máy có font/cỡ chữ lớn cũng không tràn khung */}
      <View style={styles.bottom}>
        <Text style={styles.code} numberOfLines={1}>
          {orderCode(job)} · {job.customer_name}
        </Text>
        <View style={styles.right}>
          <Text style={styles.money} numberOfLines={1}>
            {job.net_earning !== null ? `+${money(job.net_earning)}` : money(job.total_amount)}
          </Text>
          {job.status === 'completed' ? (
            <View style={styles.pay}>
              <Icon name={job.paid ? 'check' : 'cash-clock'} size={12} color={job.paid ? colors.success : colors.warning} />
              <Text style={[styles.payText, { color: job.paid ? colors.success : colors.warning }]}>
                {job.paid ? (PAYMENT_LABEL[job.payment_method ?? ''] ?? 'Đã trả') : 'Chờ thanh toán'}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { backgroundColor: colors.white, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  title: { fontSize: 22, fontWeight: '900', color: colors.text },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, gap: 10, borderWidth: 1, borderColor: colors.line },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.voltSoft },
  ratingText: { fontSize: 12, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  when: { fontSize: 12, color: colors.faint, fontWeight: '600' },
  mid: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  service: { fontSize: 15, fontWeight: '800', color: colors.text },
  addr: { fontSize: 13, color: colors.muted, marginTop: 2 },
  unread: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.dangerMid, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  code: { flex: 1, fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] },
  right: { alignItems: 'flex-end', flexShrink: 0, gap: 2 },
  money: { fontSize: 16, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  pay: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  payText: { fontSize: 12, fontWeight: '700' },
});
