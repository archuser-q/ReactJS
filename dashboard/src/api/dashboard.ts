import { api } from './client'

export type OrderStatus =
  | 'pending' | 'matching' | 'accepted' | 'on_the_way'
  | 'arrived' | 'in_progress' | 'completed' | 'cancelled'

export type OverviewStats = {
  revenue_month: number
  orders_today: number
  workers_online: number
  open_complaints: number
}

export type RecentOrder = {
  id: string
  code: string
  status: OrderStatus
  price: number
  created_at: string
  customer_name: string
  service_name: string
  worker_name: string | null
}

export type Overview = { stats: OverviewStats; recentOrders: RecentOrder[] }

export const getOverview = async () => {
  const { data } = await api.get<Overview>('/admin/dashboard/overview')
  return data
}

/** Việc admin cần xử lý (chuông trên header + ô cảnh báo ở trang tổng quan) */
export type PendingCounts = {
  workers_to_review: number
  withdrawals_pending: number
  withdrawals_pending_amount: number
  complaints_open: number
  reports_open: number
  orders_matching: number
  orders_waiting_long: number
}

export const getPending = async () => {
  const { data } = await api.get<PendingCounts>('/admin/dashboard/pending')
  return data
}
