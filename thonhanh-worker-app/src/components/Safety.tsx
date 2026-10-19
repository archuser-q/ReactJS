/**
 * Kiểm tra an toàn điện trước khi bắt đầu sửa (ngắt nguồn, thử điện, đồ bảo hộ, báo khách).
 * Màn làm việc chỉ cho "Bắt đầu sửa chữa" khi đã tick đủ; khi bắt đầu, app gửi xác nhận lên server
 * và server lưu thời điểm (orders.safety_checked_at) để làm căn cứ khi có tranh chấp / sự cố.
 */
import { useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { colors, op, palette, radius } from '../theme';

// ---------- Kiểm tra an toàn điện trước khi sửa ----------

export const SAFETY_ITEMS: { key: string; icon: IconName; title: string; sub: string }[] = [
  { key: 'cut', icon: 'toggle-switch-off-outline', title: 'Ngắt cầu dao khu vực sửa', sub: 'Treo biển hoặc dặn khách không bật lại' },
  { key: 'test', icon: 'flash-off', title: 'Thử lại, chắc chắn đã hết điện', sub: 'Dùng bút thử điện hoặc đồng hồ đo' },
  { key: 'ppe', icon: 'hand-back-right-outline', title: 'Đồ bảo hộ', sub: 'Găng tay cách điện, dép/giày khô, dụng cụ cán cách điện' },
  { key: 'tell', icon: 'account-voice', title: 'Báo khách', sub: 'Khu vực nào sẽ tạm mất điện, trong bao lâu' },
];

// Lưu tạm trong bộ nhớ theo từng đơn (đủ cho 1 lượt làm việc; không cần gửi server)
const checks = new Map<number, Set<string>>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let version = 0;

function useChecks(orderId: number): Set<string> {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
    () => version,
  );
  return checks.get(orderId) ?? new Set();
}

export function safetyDone(orderId: number): boolean {
  const s = checks.get(orderId);
  return !!s && SAFETY_ITEMS.every((i) => s.has(i.key));
}

export function SafetyChecklist({ orderId }: { orderId: number }) {
  const done = useChecks(orderId);
  const toggle = (key: string) => {
    const next = new Set(checks.get(orderId) ?? []);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    checks.set(orderId, next);
    version += 1;
    emit();
  };
  const all = SAFETY_ITEMS.every((i) => done.has(i.key));
  return (
    <View style={[styles.check, all && { borderColor: op(palette.live, 0.5), backgroundColor: colors.successBg }]}>
      <View style={styles.checkHead}>
        <Icon name={all ? 'shield-check' : 'shield-alert-outline'} size={22} color={all ? colors.success : colors.warning} />
        <View style={{ flex: 1 }}>
          <Text style={styles.checkTitle}>{all ? 'Đã kiểm tra an toàn điện' : 'Kiểm tra an toàn trước khi sửa'}</Text>
          <Text style={styles.checkSub}>
            {all ? 'Bạn có thể bắt đầu sửa.' : `Tick đủ ${SAFETY_ITEMS.length} mục để mở nút "Bắt đầu sửa chữa".`}
          </Text>
        </View>
      </View>
      {SAFETY_ITEMS.map((it) => {
        const on = done.has(it.key);
        return (
          <Pressable
            key={it.key}
            onPress={() => toggle(it.key)}
            style={styles.checkRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
          >
            <View style={[styles.box, on && styles.boxOn]}>{on ? <Icon name="check-bold" size={14} color={colors.white} /> : null}</View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, on && { color: colors.success }]}>{it.title}</Text>
              <Text style={styles.rowSub}>{it.sub}</Text>
            </View>
            <Icon name={it.icon} size={20} color={on ? colors.success : colors.faint} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  check: { borderRadius: radius.xl, borderWidth: 1.5, borderColor: op(palette.volt, 0.8), backgroundColor: colors.voltSoft, padding: 14, gap: 4 },
  checkHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  checkTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  checkSub: { fontSize: 12, color: colors.body, marginTop: 1 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: colors.primaryMuted, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.success, borderColor: colors.success },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 12, color: colors.muted, marginTop: 1 },
});
