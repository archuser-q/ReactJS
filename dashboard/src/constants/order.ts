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