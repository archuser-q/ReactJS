import { Platform, StyleSheet } from 'react-native';

// Theme của App Khách hàng (xanh lá) – lấy từ GREEN_THEME trong bản thiết kế
export const colors = {
  primary: '#059669',
  primaryLight: '#ECFDF5',
  primaryMuted: '#6EE7B7',

  text: '#111827',
  body: '#374151',
  white: '#FFFFFF',
  dark: '#0D1117',
  pageBg: '#F3F4F6',

  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',

  emerald50: '#ECFDF5',
  emerald500: '#10B981',
  emerald600: '#059669',

  red50: '#FEF2F2',
  red100: '#FEE2E2',
  red500: '#EF4444',
  red600: '#DC2626',

  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue700: '#1D4ED8',

  amber400: '#FBBF24',
};

export const GRADIENT = ['#059669', '#10B981'] as const;
export const DARK_GRADIENT = ['#0D1117', '#1A2035'] as const;
export const GRADIENT_PROPS = {
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
} as const;

export const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

/** Đổi màu hex + độ trong suốt -> rgba */
export function op(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** 350000 -> "350.000" */
export function formatVnd(n: number): string {
  return Math.abs(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export const shadowSm = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
} as const;

export const shadowLg = {
  shadowColor: '#000',
  shadowOpacity: 0.18,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 6,
} as const;

// Style dùng chung
export const common = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.body,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  textarea: {
    backgroundColor: colors.gray50,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    fontSize: 14,
    color: colors.text,
    minHeight: 84,
    textAlignVertical: 'top',
  },
  dashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gray200,
    borderRadius: 16,
    padding: 14,
  },
});
