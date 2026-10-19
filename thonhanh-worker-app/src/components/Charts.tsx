import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme';
import { moneyShort } from '../utils/format';

/** Vòng đếm ngược cho lời mời nhận đơn */
export function CountdownRing({ seconds, total, size = 64, color = colors.primary }: { seconds: number; total: number; size?: number; color?: string }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = total > 0 ? Math.max(0, Math.min(1, seconds / total)) : 0;
  const urgent = seconds <= 10;
  const col = urgent ? colors.dangerMid : color;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.line} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={col}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - ratio)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {/* Android mặc định chừa khoảng trên cho dấu tiếng Việt chồng (Ẫ, Ỗ...) nên số bị lệch xuống: bỏ khoảng đó để số nằm giữa vòng */}
      <Text
        style={{
          fontSize: size * 0.28,
          lineHeight: Math.round(size * 0.28 * 1.265),
          includeFontPadding: false,
          textAlignVertical: 'center',
          fontWeight: '800',
          color: col,
          fontVariant: ['tabular-nums'],
        }}
      >
        {Math.max(0, seconds)}s
      </Text>
    </View>
  );
}

/** Biểu đồ cột đơn giản (không cần thư viện) */
export function BarChart({
  data,
  height = 140,
  highlightKey,
  color = colors.primary,
  mutedColor = colors.primaryMuted,
}: {
  data: { key: string; label: string; value: number }[];
  height?: number;
  highlightKey?: string;
  color?: string;
  mutedColor?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const dense = data.length > 12;
  const barArea = height - 34; // chừa chỗ cho nhãn số tiền phía trên và nhãn ngày phía dưới
  return (
    <View style={[styles.bars, { height }]}>
      {data.map((d, i) => {
        const h = d.value > 0 ? Math.max(4, (d.value / max) * barArea) : 2;
        const hi = d.key === highlightKey;
        return (
          <View key={d.key} style={styles.col}>
            <View style={{ height: barArea + 16, justifyContent: 'flex-end', alignItems: 'center', width: '100%' }}>
              {!dense && d.value > 0 ? (
                <Text style={[styles.val, hi && { color, fontWeight: '800' }]} numberOfLines={1}>
                  {moneyShort(d.value)}
                </Text>
              ) : null}
              <View
                style={{
                  width: dense ? '70%' : '62%',
                  maxWidth: 30,
                  height: h,
                  borderTopLeftRadius: 5,
                  borderTopRightRadius: 5,
                  backgroundColor: d.value > 0 ? (hi ? color : mutedColor) : colors.border,
                }}
              />
            </View>
            <Text style={[styles.lbl, hi && { color, fontWeight: '800' }]} numberOfLines={1}>
              {dense && i % 5 !== 0 && i !== data.length - 1 ? ' ' : d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Thanh phần trăm ngang */
export function ProgressBar({ value, color = colors.successMid, bg = colors.line, height = 8 }: { value: number; color?: string; bg?: string; height?: number }) {
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: bg, overflow: 'hidden', flex: 1 }}>
      <View style={{ width: `${Math.max(0, Math.min(100, value * 100))}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },

  val: { fontSize: 9, color: colors.faint, marginBottom: 3, fontVariant: ['tabular-nums'] },
  lbl: { fontSize: 10, color: colors.faint, height: 16, lineHeight: 16, marginTop: 2 },
});
