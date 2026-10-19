/**
 * Trang chủ — trả lời 3 câu hỏi của thợ khi mở app:
 *   1. Mình đang nhận đơn hay đang nghỉ?   (thẻ trạng thái + công tắc, bấm cả thẻ cũng được)
 *   2. Có việc nào đang làm dở không?      (khi có việc: thẻ việc thay chỗ thẻ trạng thái, công tắc ẩn đi)
 *   3. Hôm nay được bao nhiêu, lịch hẹn ra sao?
 * Không có bản đồ: bản đồ chỉ xuất hiện khi có đơn cụ thể (lời mời, chi tiết việc).
 * Ba trạng thái loại trừ nhau: Đang nghỉ · Đang nhận đơn (chờ lời mời) · Đang có việc.
 */
import { useState } from 'react';
import { Linking, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, errMsg, qk, type HomeData, type JobItem } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { Avatar, Banner, PulseDot, Radar, StatusPill } from '../../components/Bits';
import { CircuitPattern, FocusStatusBar } from '../../components/Brand';
import { Icon, type IconName } from '../../components/Icon';
import { LevelBadge } from '../../components/LevelBadge';
import { useOverlay } from '../../components/Overlay';
import { StateView } from '../../components/StateView';
import { Text } from '../../components/Text';
import { Toggle } from '../../components/Toggle';
import { getCoords, LocationError } from '../../hooks/useLocation';
import { useRootNav } from '../../navigation/types';
import { colors, op, palette, radius, shadow, tabular } from '../../theme';
import { fmtRating, fmtTime, fmtWhen, fmtWhenInline, JOB_STEPS, money, orderCode, serviceIcon, stepIndex } from '../../utils/format';
import { useOffer } from './OfferCenter';

// Chế độ ghép do hệ thống chạy (admin đặt); "auto" = hệ thống tự chọn tức thời / theo lô cho từng nhóm đơn
const MODE_TEXT: Record<string, string> = { instant: 'ghép tức thời', batch: 'ghép theo lô', auto: 'ghép tự động' };

export default function HomeScreen() {
  const navigation = useRootNav();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const qc = useQueryClient();
  const ui = useOverlay();
  const offer = useOffer();
  const home = useQuery({ queryKey: qk.home, queryFn: api.home, refetchInterval: focused ? 8000 : 20000 });
  const [toggling, setToggling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const d = home.data;

  const toggle = async (next: boolean) => {
    if (!d || toggling) return;
    if (next && !d.can_go_online) {
      void ui.alert('Chưa thể nhận đơn', d.blockers.join('\n'), 'warning');
      return;
    }
    setToggling(true);
    try {
      let coords = null;
      if (next) {
        try {
          coords = await getCoords();
        } catch (e) {
          const denied = e instanceof LocationError && e.kind === 'denied';
          const go = await ui.confirm({
            title: denied ? 'Cần quyền vị trí' : 'Không lấy được vị trí',
            message:
              Platform.OS === 'web'
                ? 'Trình duyệt chưa cho lấy vị trí. Bản web dùng để demo: chọn vị trí mô phỏng trên bản đồ?'
                : denied
                  ? 'Thợ Nhanh cần vị trí để ghép đơn gần bạn và để khách theo dõi khi bạn tới. Mở Cài đặt để cấp quyền?'
                  : errMsg(e),
            confirmText: Platform.OS === 'web' ? 'Chọn trên bản đồ' : denied ? 'Mở Cài đặt' : 'Đã hiểu',
            tone: 'warning',
          });
          if (go && Platform.OS === 'web') navigation.navigate('ServiceArea');
          else if (go && denied) void Linking.openSettings();
          return;
        }
      }
      await api.setAvailability(next, coords);
      await qc.invalidateQueries({ queryKey: qk.home });
      void qc.invalidateQueries({ queryKey: qk.offer });
      const msg = d.active_job
        ? next
          ? 'Xong việc này sẽ nhận đơn mới'
          : 'Xong việc này bạn sẽ được nghỉ'
        : next
          ? 'Đã bật nhận đơn'
          : 'Đã tắt nhận đơn. Nghỉ ngơi nhé!';
      ui.toast(msg, next ? 'success' : 'info');
    } catch (e) {
      void ui.alert('Không đổi được trạng thái', errMsg(e), 'danger');
    } finally {
      setToggling(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await home.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const job = d?.active_job ?? null;
  const online = !!d && d.availability !== 'offline';

  return (
    <View style={styles.root}>
      <FocusStatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.white} progressViewOffset={insets.top} />}
      >
        {/* Đầu trang navy: người thợ + thông báo */}
        <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
          <CircuitPattern />
          <View style={styles.headRow}>
            <Pressable style={styles.who} onPress={() => navigation.navigate('Main', { screen: 'Account' })} accessibilityLabel="Hồ sơ thợ">
              <Avatar name={user?.full_name} uri={user?.avatar_url} size={44} color={palette.volt} />
              <View style={{ flexShrink: 1, gap: 4 }}>
                <Text style={styles.hello}>Xin chào</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {user?.full_name ?? 'Thợ Nhanh'}
                </Text>
              </View>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.bell} hitSlop={8} accessibilityLabel="Thông báo">
              <Icon name="bell-outline" size={22} color={colors.white} />
              {d?.unread_notifications ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{d.unread_notifications > 9 ? '9+' : d.unread_notifications}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
          {d ? (
            <View style={styles.headMeta}>
              <LevelBadge level={d.level} compact />
              <View style={styles.dot} />
              <Icon name="star" size={13} color={palette.volt} />
              <Text style={styles.headMetaText}>{d.rating_avg ? `${fmtRating(d.rating_avg)} (${d.rating_count} đánh giá)` : 'Chưa có đánh giá'}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          {!d ? (
            <View style={[styles.card, { minHeight: 200 }]}>
              <StateView loading={home.isLoading} error={home.error ? errMsg(home.error) : null} onRetry={() => void home.refetch()} />
            </View>
          ) : (
            <>
              {job ? (
                <ActiveJobCard
                  job={job}
                  onOpen={() => navigation.navigate('JobDetail', { orderId: job.id })}
                  nextOn={online}
                  toggling={toggling}
                  onToggleNext={(v) => void toggle(v)}
                />
              ) : (
                <StatusCard d={d} online={online} toggling={toggling} onToggle={(v) => void toggle(v)} />
              )}

              {d.wallet_restricted ? (
                <Banner
                  tone="danger"
                  text={`Ví đang âm ${money(d.wallet_balance)} do hoa hồng đơn tiền mặt. Nạp tiền để nhận đơn tiếp.`}
                  action="Nạp tiền"
                  onPress={() => navigation.navigate('Topup')}
                />
              ) : !d.can_go_online && !job ? (
                <Banner tone="warning" text={d.blockers.join('. ')} />
              ) : null}
              {online && !job && !d.location_fresh ? (
                <Banner tone="warning" icon="map-marker-alert-outline" text="Chưa cập nhật được vị trí. Giữ app mở và bật GPS để được ghép đơn gần bạn." />
              ) : null}

              {offer.offer && offer.hidden ? (
                <Pressable onPress={offer.open} style={styles.offerCard}>
                  <PulseDot color={palette.voltDeep} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.offerTitle}>Lời mời nhận đơn đang chờ bạn</Text>
                    <Text style={styles.offerSub} numberOfLines={1}>
                      {offer.offer.service_name}, bạn nhận {money(offer.offer.estimated_earning)}
                    </Text>
                  </View>
                  <View style={styles.timer}>
                    <Text style={styles.timerText}>{offer.secondsLeft}s</Text>
                  </View>
                </Pressable>
              ) : online && !job && !offer.offer ? (
                <View style={[styles.card, styles.waiting]}>
                  <Radar color={palette.live} size={92} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.waitTitle}>Đang chờ đơn quanh bạn</Text>
                    <Text style={styles.waitSub}>Có khách phù hợp, lời mời sẽ hiện ngay kèm rung. Giữ app mở để không lỡ đơn.</Text>
                  </View>
                </View>
              ) : null}

              <Text style={styles.section}>Hôm nay</Text>
              <View style={styles.tiles}>
                <Tile icon="cash-multiple" label="Thu nhập" value={money(d.today.net_income)} onPress={() => navigation.navigate('Main', { screen: 'Earnings' })} />
                <Tile icon="check-circle-outline" label="Đơn xong" value={String(d.today.completed)} onPress={() => navigation.navigate('Main', { screen: 'Jobs' })} />
                <Tile icon="star-outline" label="Đánh giá" value={d.rating_avg ? fmtRating(d.rating_avg) : 'Mới'} onPress={() => navigation.navigate('Reviews')} />
              </View>
              <Pressable style={styles.week} onPress={() => navigation.navigate('Main', { screen: 'Earnings' })}>
                <Text style={styles.weekText}>
                  7 ngày qua: <Text style={styles.weekStrong}>{d.week.completed} đơn</Text>, thực nhận{' '}
                  <Text style={styles.weekStrong}>{money(d.week.net_income)}</Text>
                </Text>
                <Icon name="chevron-right" size={18} color={colors.faint} />
              </Pressable>

              {d.upcoming.length ? (
                <>
                  <Text style={styles.section}>Lịch hẹn sắp tới</Text>
                  <View style={[styles.card, { paddingVertical: 4 }]}>
                    {d.upcoming.map((j, i) => (
                      <UpcomingRow key={j.id} job={j} last={i === d.upcoming.length - 1} onPress={() => navigation.navigate('JobDetail', { orderId: j.id })} />
                    ))}
                  </View>
                </>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------

function StatusCard({ d, online, toggling, onToggle }: { d: HomeData; online: boolean; toggling: boolean; onToggle: (next: boolean) => void }) {
  const radiusKm = String(d.service_radius_km).replace('.', ',');
  return (
    <Pressable
      onPress={() => onToggle(!online)}
      disabled={toggling}
      style={({ pressed }) => [styles.card, styles.status, online && styles.statusOn, pressed && { opacity: 0.92 }]}
      accessibilityRole="button"
      accessibilityLabel={online ? 'Đang nhận đơn. Bấm để tạm nghỉ' : 'Đang tạm nghỉ. Bấm để bật nhận đơn'}
    >
      <View style={[styles.statusIcon, { backgroundColor: online ? colors.successBg : colors.line }]}>
        <Icon name={online ? 'lightning-bolt' : 'power'} size={22} color={online ? palette.live : colors.muted} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.statusTitle, online && { color: colors.success }]}>{online ? 'Đang nhận đơn' : 'Đang tạm nghỉ'}</Text>
        <Text style={styles.statusSub}>
          {online
            ? `Bán kính ${radiusKm} km · ${MODE_TEXT[d.matching_mode] ?? 'ghép tức thời'}`
            : `Bật để nhận đơn trong bán kính ${radiusKm} km`}
        </Text>
      </View>
      <Toggle value={online} busy={toggling} onChange={onToggle} label="Nhận đơn" />
    </Pressable>
  );
}

function Tile({ icon, label, value, onPress }: { icon: IconName; label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]} onPress={onPress}>
      <Icon name={icon} size={18} color={colors.muted} />
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {value}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );
}

function ActiveJobCard({
  job,
  onOpen,
  nextOn,
  toggling,
  onToggleNext,
}: {
  job: JobItem;
  onOpen: () => void;
  /** Xong việc này có nhận đơn mới không (= trạng thái nhận đơn của thợ) */
  nextOn: boolean;
  toggling: boolean;
  onToggleNext: (next: boolean) => void;
}) {
  const scheduledLater = job.status === 'accepted' && !!job.scheduled_at;
  const step = Math.max(0, stepIndex(job.status));
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.card, styles.job, pressed && { opacity: 0.95 }]}>
      <View style={styles.jobHead}>
        <View style={styles.busyChip}>
          <View style={styles.busyDot} />
          <Text style={styles.busyText}>Bận</Text>
        </View>
        <Text style={styles.jobKicker} numberOfLines={1}>
          {scheduledLater ? `Lịch hẹn ${fmtWhenInline(job.scheduled_at)}` : 'Việc đang làm'}
        </Text>
        <StatusPill status={job.status} small />
      </View>

      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={styles.jobIcon}>
          <Icon name={serviceIcon(job.service_name)} size={24} color={palette.volt} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.jobService} numberOfLines={1}>
            {job.service_name}
          </Text>
          <Text style={styles.jobAddr} numberOfLines={2}>
            {job.address_text}
          </Text>
        </View>
      </View>

      <View style={styles.steps}>
        {JOB_STEPS.map((s, i) => (
          <View key={s.status} style={[styles.stepBar, { backgroundColor: i < step ? colors.navy : i === step ? palette.volt : colors.line }]} />
        ))}
      </View>

      <View style={styles.jobFoot}>
        <Text style={styles.jobCode} numberOfLines={1}>
          {orderCode(job)} · {job.customer_name}
        </Text>
        <Text style={styles.jobMoney}>{money(job.total_amount)}</Text>
      </View>

      <View style={styles.jobBtn}>
        <Text style={styles.jobBtnText}>Tiếp tục công việc</Text>
        {job.unread_messages ? (
          <View style={styles.msgBadge}>
            <Icon name="message-text" size={12} color="#fff" />
            <Text style={styles.msgBadgeText}>{job.unread_messages}</Text>
          </View>
        ) : null}
        <Icon name="chevron-right" size={20} color={colors.navy} />
      </View>
      {/* Giống "nghỉ sau chuyến này" của app tài xế: đang làm vẫn chọn được có nhận đơn tiếp hay nghỉ */}
      <View style={styles.nextRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.nextTitle}>Nhận đơn mới khi xong việc này</Text>
          <Text style={styles.nextSub}>{nextOn ? 'Đang làm thì hệ thống tạm dừng gửi đơn' : 'Xong việc này bạn sẽ được nghỉ'}</Text>
        </View>
        <Toggle value={nextOn} busy={toggling} onChange={onToggleNext} label="Nhận đơn mới khi xong việc này" />
      </View>
    </Pressable>
  );
}

function UpcomingRow({ job, last, onPress }: { job: JobItem; last: boolean; onPress: () => void }) {
  const when = job.scheduled_at ?? job.accepted_at;
  const day = fmtWhen(when).replace(fmtTime(when), '').replace('·', '').trim();
  return (
    <Pressable onPress={onPress} style={[styles.upRow, !last && styles.upLine]}>
      <View style={styles.upTime}>
        <Text style={styles.upTimeBig}>{fmtTime(when)}</Text>
        <Text style={styles.upDay} numberOfLines={1}>
          {day}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.upService} numberOfLines={1}>
          {job.service_name}
        </Text>
        <Text style={styles.upAddr} numberOfLines={1}>
          {job.address_text}
        </Text>
      </View>
      <Text style={styles.upMoney}>{money(job.total_amount)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.navy, paddingHorizontal: 18, paddingBottom: 58, overflow: 'hidden' },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  who: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  hello: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  name: { fontSize: 19, fontWeight: '700', color: colors.white, letterSpacing: -0.2 },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.dangerMid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.navy,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  headMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  headMetaText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', ...tabular },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 2 },

  body: { paddingHorizontal: 16, marginTop: -40, gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: 16, ...shadow.sm },
  section: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 8 },

  status: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 18, ...shadow.md },
  statusOn: { borderWidth: 1.5, borderColor: op(palette.live, 0.55) },
  statusIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  statusSub: { fontSize: 13, color: colors.muted },

  waiting: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  waitTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  waitSub: { fontSize: 13, color: colors.muted, lineHeight: 19 },

  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.voltSoft,
    borderWidth: 1.5,
    borderColor: palette.volt,
  },
  offerTitle: { fontSize: 14, fontWeight: '800', color: colors.navy },
  offerSub: { fontSize: 13, color: colors.body, marginTop: 2 },
  timer: { backgroundColor: colors.navy, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  timerText: { color: palette.volt, fontWeight: '800', fontSize: 13, ...tabular },

  tiles: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 12, gap: 4, ...shadow.sm },
  tileValue: { fontSize: 17, fontWeight: '800', color: colors.text, ...tabular },
  tileLabel: { fontSize: 12, color: colors.muted },
  week: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  weekText: { fontSize: 13, color: colors.muted, flexShrink: 1, ...tabular },
  weekStrong: { color: colors.body, fontWeight: '700' },

  job: { gap: 12, ...shadow.md },
  jobHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  busyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.warningBg,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  busyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.voltDeep },
  busyText: { fontSize: 12, fontWeight: '700', color: colors.warning },
  jobKicker: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.muted },
  jobIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  jobService: { fontSize: 17, fontWeight: '800', color: colors.text },
  jobAddr: { fontSize: 13, color: colors.muted, marginTop: 2, lineHeight: 18 },
  steps: { flexDirection: 'row', gap: 4 },
  stepBar: { flex: 1, height: 5, borderRadius: 3 },
  jobFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  jobCode: { fontSize: 13, color: colors.muted, flexShrink: 1 },
  jobMoney: { fontSize: 17, fontWeight: '800', color: colors.text, ...tabular },
  jobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: palette.volt,
    borderRadius: radius.md + 2,
    paddingVertical: 13,
  },
  jobBtnText: { color: colors.navy, fontWeight: '800', fontSize: 15 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  nextTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  nextSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  msgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.dangerMid,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  msgBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  upRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  upLine: { borderBottomWidth: 1, borderBottomColor: colors.line },
  upTime: { width: 70, paddingVertical: 6, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center' },
  upTimeBig: { fontSize: 16, fontWeight: '800', color: colors.navy, ...tabular },
  upDay: { fontSize: 11, fontWeight: '600', color: colors.muted },
  upService: { fontSize: 15, fontWeight: '700', color: colors.text },
  upAddr: { fontSize: 13, color: colors.muted, marginTop: 2 },
  upMoney: { fontSize: 14, fontWeight: '700', color: colors.body, ...tabular },
});
