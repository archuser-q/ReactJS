/** Huy hiệu hạng thợ (Đồng / Bạc / Vàng / Kim cương) — tính ở server theo số đơn hoàn thành + điểm đánh giá */
import { StyleSheet, View } from 'react-native';
import type { WorkerLevel } from '../api';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { colors, radius } from '../theme';

export const LEVEL_STYLE: Record<WorkerLevel['key'], { fg: string; bg: string; icon: IconName }> = {
  dong: { fg: '#9A5B2E', bg: '#F7EBDF', icon: 'medal-outline' },
  bac: { fg: '#55657A', bg: '#ECEFF3', icon: 'medal-outline' },
  vang: { fg: '#8A6400', bg: '#FFF1BF', icon: 'medal' },
  kim_cuong: { fg: '#1D63A6', bg: '#E2F0FB', icon: 'diamond-stone' },
};

export function LevelBadge({ level, compact }: { level: WorkerLevel; compact?: boolean }) {
  const s = LEVEL_STYLE[level.key] ?? LEVEL_STYLE.dong;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }, compact && styles.compact]}>
      <Icon name={s.icon} size={compact ? 12 : 14} color={s.fg} />
      <Text style={[styles.text, { color: s.fg }, compact && { fontSize: 11 }]}>{level.name}</Text>
    </View>
  );
}

/** Thanh tiến độ lên hạng kế tiếp */
export function LevelProgress({ level, rating }: { level: WorkerLevel; rating?: number | null }) {
  const s = LEVEL_STYLE[level.key] ?? LEVEL_STYLE.dong;
  if (!level.next_name) {
    return <Text style={styles.note}>Bạn đang ở hạng cao nhất. Giữ vững phong độ nhé!</Text>;
  }
  const left = Math.max(0, (level.next_jobs ?? 0) - level.completed);
  const need = level.next_rating ? String(level.next_rating).replace('.', ',') : null;
  const ratingPart = !need ? '' : rating != null && rating < (level.next_rating ?? 0) ? ` và nâng đánh giá lên ${need} sao` : ` và giữ đánh giá từ ${need} sao`;
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(level.progress * 100)}%`, backgroundColor: s.fg }]} />
      </View>
      <Text style={styles.note}>
        {left > 0 ? `Còn ${left} đơn hoàn thành${ratingPart}` : `Đã đủ số đơn${ratingPart ? `, cần${ratingPart.replace(' và', '')}` : ''}`} để lên {level.next_name}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  compact: { paddingHorizontal: 6, paddingVertical: 2 },
  text: { fontSize: 12, fontWeight: '700' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  note: { fontSize: 13, color: colors.muted, lineHeight: 19 },
});
