import type { IconName } from '../components/Icon';
import type { CatalogService, OrderStatus, Payment, PaymentMethod } from '../api';
import { colors, formatVnd } from '../theme';

// ── Ngày giờ ────────────────────────────────────────────────────────────────
// Backend trả ISO có múi giờ (VD "2026-10-17T05:22:45.480Z") -> đổi sang giờ Việt Nam
// để hiển thị, không phụ thuộc múi giờ đang cài trên điện thoại.

const VN_OFFSET_MS = 7 * 3600 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');

function vnParts(iso?: string | null) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const d = new Date(t + VN_OFFSET_MS); // đọc bằng getUTC* = giờ VN
  return {
    y: d.getUTCFullYear(),
    m: pad(d.getUTCMonth() + 1),
    d: pad(d.getUTCDate()),
    h: pad(d.getUTCHours()),
    mi: pad(d.getUTCMinutes()),
  };
}

export function fmtDate(iso?: string | null): string {
  const p = vnParts(iso);
  return p ? `${p.d}/${p.m}/${p.y}` : '';
}

export function fmtTime(iso?: string | null): string {
  const p = vnParts(iso);
  return p ? `${p.h}:${p.mi}` : '';
}

export function fmtDateTime(iso?: string | null): string {
  const t = fmtTime(iso);
  return t ? `${fmtDate(iso)} · ${t}` : fmtDate(iso);
}

/**
 * Khung giờ hẹn theo giờ Việt Nam (không phụ thuộc múi giờ của điện thoại).
 * VD vnSlot(1, 9) = 09:00 ngày mai giờ VN -> { iso: "2026-10-08T09:00:00+07:00", ts }
 */
export function vnSlot(dayOffset: number, hour: number): { iso: string; ts: number } {
  const vnNow = new Date(Date.now() + VN_OFFSET_MS); // đọc bằng getUTC* = giờ VN
  const ts = Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate() + dayOffset, hour) - VN_OFFSET_MS;
  const iso = new Date(ts + VN_OFFSET_MS).toISOString().slice(0, 19) + '+07:00';
  return { iso, ts };
}

// ── Tiền ────────────────────────────────────────────────────────────────────

export function money(n?: number | null): string {
  return n === null || n === undefined ? '—' : `${formatVnd(n)}đ`;
}

// ── Trạng thái đơn ──────────────────────────────────────────────────────────

export const ORDER_STATUS: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Chờ xử lý', color: colors.blue600, bg: colors.blue50 },
  matching: { label: 'Đang tìm thợ', color: colors.blue600, bg: colors.blue50 },
  accepted: { label: 'Thợ đã nhận', color: colors.blue600, bg: colors.blue50 },
  on_the_way: { label: 'Đang tới', color: colors.blue600, bg: colors.blue50 },
  arrived: { label: 'Thợ đã đến', color: colors.blue600, bg: colors.blue50 },
  in_progress: { label: 'Đang làm', color: colors.blue600, bg: colors.blue50 },
  completed: { label: 'Hoàn thành', color: colors.emerald600, bg: colors.emerald50 },
  cancelled: { label: 'Đã hủy', color: colors.red500, bg: colors.red50 },
};

export const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'matching', 'accepted', 'on_the_way', 'arrived', 'in_progress'];

/** 4 bước trên thanh tiến trình của màn Theo dõi */
export function orderSteps(status: OrderStatus) {
  // vị trí bước đang diễn ra: 0 Đã đặt, 1 Thợ đến, 2 Đang sửa, 3 Hoàn thành
  const current: Record<OrderStatus, number> = {
    pending: 0,
    matching: 0,
    accepted: 1,
    on_the_way: 1,
    arrived: 2,
    in_progress: 2,
    completed: 4,
    cancelled: -1,
  };
  const at = current[status];
  return ['Đã đặt', 'Thợ đến', 'Đang sửa', 'Hoàn thành'].map((label, i) => ({
    label,
    done: at > i || (i === 0 && at >= 0),
    active: at === i && i !== 0,
  }));
}

// ── Thanh toán ──────────────────────────────────────────────────────────────

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  momo: 'Ví MoMo',
  vnpay: 'VNPay',
};

/** Đơn chưa có thợ (mở màn "Thợ phù hợp" thay vì "Theo dõi") */
export const WAITING_STATUSES: OrderStatus[] = ['pending', 'matching'];

export const PAYMENT_STATUS_LABEL: Record<Payment['status'], string> = {
  pending: 'Chờ xác nhận',
  success: 'Thành công',
  failed: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
};

// ── Khoảng cách ─────────────────────────────────────────────────────────────

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function fmtKm(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/** Ước lượng thời gian tới nơi, đi xe máy trong phố ~20 km/h */
export function etaMinutes(km: number): number {
  return Math.max(1, Math.round((km / 20) * 60));
}

// ── Màu / icon cho dịch vụ (backend chưa có icon) ───────────────────────────

const PALETTE = [
  { color: '#F59E0B', bg: '#FFFBEB' },
  { color: '#3B82F6', bg: '#EFF6FF' },
  { color: '#EF4444', bg: '#FEF2F2' },
  { color: '#8B5CF6', bg: '#F5F3FF' },
  { color: '#10B981', bg: '#ECFDF5' },
  { color: '#0891B2', bg: '#ECFEFF' },
];

// Chỉ dịch vụ của thợ điện (4 nhóm: Sửa chữa điện · Lắp đặt thiết bị điện · Đồ điện gia dụng · Đi dây & tủ điện)
const ICON_RULES: [RegExp, IconName][] = [
  [/cầu dao|aptomat|mcb/i, 'toggle-switch'],
  [/chập|mất điện/i, 'flash-alert-outline'],
  [/rò điện|chống giật/i, 'shield-alert-outline'],
  [/đèn|led/i, 'lightbulb-outline'],
  [/quạt/i, 'fan'],
  [/bình nóng lạnh/i, 'water-boiler'],
  [/máy bơm/i, 'pump'],
  [/ổ cắm|công tắc/i, 'power-socket-de'],
  [/tủ điện/i, 'server'],
  [/an toàn|kiểm tra/i, 'check-circle-outline'],
  [/đi dây|dây điện/i, 'cable-data'],
  [/điện/i, 'lightning-bolt'],
];

/** Dịch vụ từ backend + màu/icon để hiển thị như bản thiết kế */
export type UIService = CatalogService & { label: string; icon: IconName; color: string; bg: string };

export function decorateService(s: CatalogService, index: number): UIService {
  const icon = ICON_RULES.find(([re]) => re.test(s.name))?.[1] ?? 'wrench-outline';
  return { ...s, label: s.name, icon, ...PALETTE[index % PALETTE.length] };
}

/** Icon theo tên dịch vụ (dùng ở danh sách đơn) */
export function serviceIcon(name: string): IconName {
  return ICON_RULES.find(([re]) => re.test(name))?.[1] ?? 'wrench-outline';
}
