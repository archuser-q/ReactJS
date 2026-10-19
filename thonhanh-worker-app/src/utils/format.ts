import type { IconName } from '../components/Icon';
import type { OrderStatus } from '../api';
import { colors } from '../theme';

// ── Ngày giờ ────────────────────────────────────────────────────────────────
// Backend Node trả giờ dạng ISO 8601 có múi giờ (VD "2026-10-19T02:56:16.139Z").
// Mọi hiển thị đều đổi sang giờ Việt Nam (UTC+7, không có giờ mùa hè), không phụ thuộc múi giờ của điện thoại.
// Chuỗi không kèm múi giờ (VD khoá ngày "2026-10-19" của biểu đồ) được hiểu là giờ Việt Nam.

const DT_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/;
const TZ_RE = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;
const VN_OFFSET_MS = 7 * 3600 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');

/** Chuỗi giờ của server -> mốc thời gian (ms) chuẩn */
export function vnToMs(iso?: string | null): number | null {
  if (!iso) return null;
  if (TZ_RE.test(iso)) {
    const t = Date.parse(iso);
    return Number.isNaN(t) ? null : t;
  }
  const m = iso.match(DT_RE);
  if (!m) return null;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)) - VN_OFFSET_MS;
}

/** Các thành phần ngày giờ theo giờ VN; hasTime = chuỗi gốc có phần giờ */
function vnParts(iso?: string | null) {
  const ms = vnToMs(iso);
  if (ms === null || !iso) return null;
  const d = new Date(ms + VN_OFFSET_MS);
  return {
    key: d.toISOString().slice(0, 10),
    y: d.getUTCFullYear(),
    mo: pad(d.getUTCMonth() + 1),
    d: pad(d.getUTCDate()),
    h: pad(d.getUTCHours()),
    mi: pad(d.getUTCMinutes()),
    hasTime: iso.length > 10,
  };
}

/** Hôm nay theo giờ VN dạng YYYY-MM-DD */
export function vnTodayKey(offsetDays = 0): string {
  return new Date(Date.now() + VN_OFFSET_MS + offsetDays * 86400000).toISOString().slice(0, 10);
}

export function fmtDate(iso?: string | null): string {
  const p = vnParts(iso);
  return p ? `${p.d}/${p.mo}/${p.y}` : '';
}

export function fmtTime(iso?: string | null): string {
  const p = vnParts(iso);
  return p && p.hasTime ? `${p.h}:${p.mi}` : '';
}

export function fmtDateTime(iso?: string | null): string {
  const t = fmtTime(iso);
  return t ? `${t} · ${fmtDate(iso)}` : fmtDate(iso);
}

/** "Hôm nay 14:30" / "Ngày mai 09:00" / "14:30 · 20/10/2026" */
export function fmtWhen(iso?: string | null): string {
  const p = vnParts(iso);
  if (!p) return '';
  const t = fmtTime(iso);
  if (p.key === vnTodayKey()) return `Hôm nay ${t}`.trim();
  if (p.key === vnTodayKey(1)) return `Ngày mai ${t}`.trim();
  if (p.key === vnTodayKey(-1)) return `Hôm qua ${t}`.trim();
  return fmtDateTime(iso);
}

/** Như fmtWhen nhưng viết thường để đặt giữa câu: "Hẹn ngày mai 09:30" */
export function fmtWhenInline(iso?: string | null): string {
  return fmtWhen(iso).replace(/^(Hôm nay|Ngày mai|Hôm qua)/, (w) => w.toLowerCase());
}

export function timeAgo(iso?: string | null): string {
  const ms = vnToMs(iso);
  if (ms === null) return '';
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return 'vừa xong';
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} ngày trước`;
  return fmtDate(iso);
}


// ── Tiền ────────────────────────────────────────────────────────────────────

export function formatVnd(n: number): string {
  return Math.abs(Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function money(n?: number | null): string {
  if (n === null || n === undefined) return '—';
  return `${n < 0 ? '-' : ''}${formatVnd(n)}đ`;
}

/** Điểm đánh giá hiển thị thống nhất 1 chữ số thập phân: 4.79 -> "4,8" */
export function fmtRating(r: number): string {
  return r.toFixed(1).replace('.', ',');
}

/** 930000 -> "930K", 2340000 -> "2,34tr" */
export function moneyShort(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (a >= 1_000_000) return `${sign}${(a / 1_000_000).toFixed(a >= 10_000_000 ? 1 : 2).replace('.', ',').replace(/,?0+$/, '')}tr`;
  if (a >= 1000) return `${sign}${Math.round(a / 1000)}K`;
  return `${sign}${a}đ`;
}

/** Mã đơn hiển thị: mã của hệ thống (VD TN261019000123); chỉ có id thì "Đơn #123" */
export function orderCode(o: number | { id: number; code?: string | null }): string {
  if (typeof o === 'number') return `Đơn #${o}`;
  return o.code || `Đơn #${o.id}`;
}

export const PAYMENT_LABEL: Record<string, string> = { cash: 'Tiền mặt', momo: 'Ví MoMo', vnpay: 'VNPay' };

// ── Trạng thái đơn (góc nhìn của thợ) ────────────────────────────────────────

export const JOB_STATUS: Record<OrderStatus, { label: string; color: string; bg: string; icon: IconName }> = {
  pending: { label: 'Mới tạo', color: colors.muted, bg: colors.line, icon: 'timer-sand' },
  matching: { label: 'Đang tìm thợ', color: colors.muted, bg: colors.line, icon: 'account-search-outline' },
  accepted: { label: 'Đã nhận việc', color: colors.primary, bg: colors.primaryLight, icon: 'check-circle-outline' },
  on_the_way: { label: 'Đang di chuyển', color: colors.violet, bg: colors.violetBg, icon: 'motorbike' },
  arrived: { label: 'Đã đến nơi', color: colors.warning, bg: colors.warningBg, icon: 'map-marker-check-outline' },
  in_progress: { label: 'Đang sửa chữa', color: colors.warning, bg: colors.warningBg, icon: 'wrench-outline' },
  completed: { label: 'Hoàn thành', color: colors.success, bg: colors.successBg, icon: 'check-decagram' },
  cancelled: { label: 'Đã hủy', color: colors.danger, bg: colors.dangerBg, icon: 'close-circle-outline' },
};

/** Các bước trên thanh tiến trình của màn làm việc */
export const JOB_STEPS: { status: OrderStatus; label: string }[] = [
  // Nhãn 1 từ để 5 bước vừa 1 hàng trên màn hẹp (360 dp)
  { status: 'accepted', label: 'Nhận' },
  { status: 'on_the_way', label: 'Đi' },
  { status: 'arrived', label: 'Đến' },
  { status: 'in_progress', label: 'Sửa' },
  { status: 'completed', label: 'Xong' },
];

export function stepIndex(status: OrderStatus): number {
  return JOB_STEPS.findIndex((s) => s.status === status);
}

// ── Khoảng cách ─────────────────────────────────────────────────────────────

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function fmtKm(km?: number | null): string {
  if (km === null || km === undefined) return '—';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}

/** Ước lượng thời gian đi xe máy trong phố ~20 km/h */
export function etaMinutes(km: number): number {
  return Math.max(1, Math.round((km / 20) * 60));
}

// ── Icon dịch vụ ────────────────────────────────────────────────────────────

// Biểu tượng theo tên nhóm / dịch vụ (nền tảng chỉ gồm dịch vụ của thợ điện)
const ICON_RULES: [RegExp, IconName][] = [
  [/bình nóng/i, 'water-boiler'],
  [/máy bơm/i, 'water-pump'],
  [/gia dụng/i, 'home-lightning-bolt-outline'],
  [/cầu dao|aptomat|tủ điện/i, 'toggle-switch-outline'],
  [/đèn|led/i, 'lightbulb-on-outline'],
  [/ổ cắm|công tắc/i, 'power-socket-de'],
  [/quạt/i, 'fan'],
  [/an toàn|kiểm tra|rò|chống giật/i, 'shield-check-outline'],
  [/thiết bị/i, 'power-plug-outline'],
  [/đi dây|dây điện/i, 'cable-data'],
  [/chập|mất điện/i, 'flash-alert-outline'],
  [/điện/i, 'lightning-bolt'],
];

export function serviceIcon(name: string): IconName {
  return ICON_RULES.find(([re]) => re.test(name))?.[1] ?? 'wrench-outline';
}

export function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? '';
  const first = parts.length > 1 ? parts[0] : '';
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || '?';
}

export function pct(x?: number | null): string {
  if (x === null || x === undefined) return '—';
  return `${Math.round(x * 100)}%`;
}
