import type { OrderStatus } from '../api/dashboard'

export const ORDER_STATUS: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Chờ xử lý', color: 'default' },
  matching: { label: 'Đang tìm thợ', color: 'processing' },
  accepted: { label: 'Đã nhận', color: 'cyan' },
  on_the_way: { label: 'Đang đến', color: 'blue' },
  arrived: { label: 'Đã đến', color: 'geekblue' },
  in_progress: { label: 'Đang sửa', color: 'purple' },
  completed: { label: 'Hoàn thành', color: 'success' },
  cancelled: { label: 'Đã hủy', color: 'error' },
}

export const PAYMENT_METHOD: Record<'cash' | 'momo' | 'vnpay', string> = {
  cash: 'Tiền mặt',
  momo: 'MoMo',
  vnpay: 'VNPay',
}

export const PAYMENT_STATUS: Record<'pending' | 'success' | 'failed' | 'refunded', { label: string; color: string }> = {
  pending: { label: 'Chờ thanh toán', color: 'default' },
  success: { label: 'Thành công', color: 'success' },
  failed: { label: 'Thất bại', color: 'error' },
  refunded: { label: 'Đã hoàn tiền', color: 'warning' },
}

export const QUOTE_STATUS: Record<'pending' | 'approved' | 'rejected', { label: string; color: string }> = {
  pending: { label: 'Chờ khách duyệt', color: 'processing' },
  approved: { label: 'Khách đồng ý', color: 'success' },
  rejected: { label: 'Khách từ chối', color: 'error' },
}

export const MATCHING_MODE: Record<'instant' | 'batch', string> = {
  instant: 'Tức thời',
  batch: 'Theo lô',
}

export const formatMoney = (v: number | null | undefined) => (v == null ? '—' : `${v.toLocaleString('vi-VN')} ₫`)
export const formatDateTime = (v: string | null | undefined) => (v ? new Date(v).toLocaleString('vi-VN') : '—')