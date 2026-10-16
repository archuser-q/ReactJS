import { api } from './client'

export type GroupBy = 'day' | 'week' | 'month'

export type ReportParams = { from: string; to: string; groupBy: GroupBy }

export type Report = {
  from: string
  to: string
  groupBy: GroupBy
  summary: {
    total_orders: number
    completed_orders: number
    cancelled_orders: number
    revenue: number
    commission: number
    avg_order_value: number
  }
  timeline: {
    period: string
    total_orders: number
    completed_orders: number
    cancelled_orders: number
    revenue: number
  }[]
  categories: { category: string; orders: number; revenue: number }[]
  cancelReasons: { reason: string; count: number }[]
  topWorkers: {
    id: string
    full_name: string
    jobs: number
    revenue: number
    avg_rating: number | null
    trust_score: number
  }[]
  matching: {
    mode: 'instant' | 'batch'
    total_orders: number
    completed_orders: number
    unmatched_cancelled: number
    avg_wait_minutes: number | null
  }[]
}

export const getReport = async (params: ReportParams) => {
  const { data } = await api.get<Report>('/admin/reports', { params })
  return data
}