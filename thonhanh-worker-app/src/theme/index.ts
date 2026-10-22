import { StyleSheet } from 'react-native';

/**
 * Nhận diện App Thợ — lấy cảm hứng từ chính nghề điện:
 *   navy   — vỏ tủ điện, dụng cụ cách điện: màu chủ đạo, nghiêm túc, đáng tin
 *   volt   — vàng biển báo an toàn điện: màu nhấn duy nhất (nút "Nhận đơn", nút vuốt, điểm nhấn)
 *   live   — xanh "có điện" (đang nhận đơn, hoàn thành, tiền vào)
 * Chữ: Be Vietnam Pro (font do người Việt thiết kế, dấu tiếng Việt chuẩn), 1 họ chữ duy nhất.
 */
export const palette = {
  navy: '#0B1F3A',
  navy2: '#16325C',
  navy3: '#2A4A7A',
  volt: '#FFC21A',
  voltDeep: '#E0A400',
  voltSoft: '#FFF4CC',
  live: '#18A957',
  signal: '#E5484D',
  copper: '#C46A2B',
};

export const colors = {
  // Thương hiệu
  ...palette,
  primary: palette.navy,
  primaryDark: '#071528',
  primaryLight: '#EAF0F8',
  primarySoft: '#D3DEEE',
  primaryMuted: '#B9C7DB',
  accent: palette.volt,
  onAccent: palette.navy,

  // Chữ & nền
  text: '#0E1A2E',
  body: '#33415A',
  muted: '#5B6B82',
  faint: '#8C98AB',
  border: '#DCE2EA',
  line: '#EDF1F5',
  bg: '#F2F4F7',
  card: '#FFFFFF',
  white: '#FFFFFF',
  dark: palette.navy,
  dark2: palette.navy2,
  offline: '#1C2B42',
  mapBg: '#E9EDF2',

  // Trạng thái
  success: '#0F8A4A',
  successMid: palette.live,
  successBg: '#E7F7EE',
  successSoft: '#B7E8CB',
  warning: '#A86400',
  warningBg: '#FFF6DE',
  warningSoft: '#FFE3A1',
  danger: '#C8282E',
  dangerMid: palette.signal,
  dangerBg: '#FDECEC',
  dangerSoft: '#F9CFD0',
  amber: palette.volt,
  violet: '#2F6FDE',
  violetBg: '#E8F0FD',
};

export const gradients = {
  primary: [palette.navy, palette.navy2] as const,
  success: ['#1FBF66', '#0F8A4A'] as const,
  dark: [palette.navy, '#0F2A4F'] as const,
  offline: ['#1C2B42', '#0B1F3A'] as const,
  volt: ['#FFD54A', palette.volt] as const,
};

export const GRADIENT_PROPS = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 26, pill: 999 };

/** Họ chữ theo độ đậm (Be Vietnam Pro nạp ở App.tsx). Text của app tự chọn theo fontWeight. */
export const fonts = {
  '400': 'BeVietnamPro_400Regular',
  '500': 'BeVietnamPro_500Medium',
  '600': 'BeVietnamPro_600SemiBold',
  '700': 'BeVietnamPro_700Bold',
  '800': 'BeVietnamPro_800ExtraBold',
} as const;

/** Số cùng độ rộng (tabular) cho tiền, giờ, số liệu để các cột thẳng hàng */
export const tabular = { fontVariant: ['tabular-nums' as const] };

/** Màu hex + độ trong suốt -> rgba */
export function op(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const shadow = {
  sm: {
    shadowColor: palette.navy,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  md: {
    shadowColor: palette.navy,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  lg: {
    shadowColor: palette.navy,
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
} as const;

/** Thang chữ (pt) */
export const type = StyleSheet.create({
  display: { fontSize: 34, fontWeight: '800', letterSpacing: -0.6, color: colors.text },
  h1: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4, color: colors.text },
  h2: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2, color: colors.text },
  h3: { fontSize: 17, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, fontWeight: '400', color: colors.body, lineHeight: 22 },
  small: { fontSize: 13, fontWeight: '500', color: colors.muted },
  caption: { fontSize: 12, fontWeight: '500', color: colors.faint },
});

export const common = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.body,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  money: { fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
});
