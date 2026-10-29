import type { OrderStatus } from '../api/dashboard'

/** Màu đơn trên bản đồ theo nhóm trạng thái */
export const ORDER_GROUP = {
  matching: { label: 'Đang tìm thợ', color: '#d4380d', statuses: ['pending', 'matching'] as OrderStatus[] },
  // gồm cả đơn hẹn giờ đã có thợ nhận nhưng chưa tới giờ đi, nên không ghi "Thợ đang đến"
  assigned: { label: 'Đã có thợ nhận', color: '#1677ff', statuses: ['accepted', 'on_the_way'] as OrderStatus[] },
  working: { label: 'Đang sửa', color: '#722ed1', statuses: ['arrived', 'in_progress'] as OrderStatus[] },
} as const

export type OrderGroup = keyof typeof ORDER_GROUP

export const groupOf = (s: OrderStatus): OrderGroup =>
  (Object.keys(ORDER_GROUP) as OrderGroup[]).find((g) => ORDER_GROUP[g].statuses.includes(s)) ?? 'matching'

/** Màu thợ trên bản đồ */
export const WORKER_STATE = {
  online: { label: 'Sẵn sàng', color: '#389e0d' },
  busy: { label: 'Đang làm đơn', color: '#fa8c16' },
  stale: { label: 'Ngoại tuyến', color: '#8c8c8c' },
} as const

export type WorkerState = keyof typeof WORKER_STATE

export const workerStateOf = (w: { is_online: boolean; is_busy: boolean; location_fresh: boolean }): WorkerState =>
  w.is_busy ? 'busy' : w.is_online && w.location_fresh ? 'online' : 'stale'

export const ago = (iso: string | null) => {
  if (!iso) return '—'
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s} giây trước`
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`
  return `${Math.floor(s / 86400)} ngày trước`
}
