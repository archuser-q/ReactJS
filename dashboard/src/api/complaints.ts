import { api } from './client'
import type { OrderStatus } from './dashboard'
import type { Paginated } from './users'

export type ComplaintStatus = 'open' | 'processing' | 'resolved' | 'rejected'
export type ComplaintType = 'complaint' | 'warranty'
/** customer = khách gửi từ app khách; worker = thợ báo cáo sự cố từ app thợ (reporter_id khác null) */
export type ComplaintSource = 'customer' | 'worker'

export type ComplaintRow = {
  id: string
  type: ComplaintType
  title: string
  status: ComplaintStatus
  created_at: string
  resolved_at: string | null
  reporter_id: string | null
  source: ComplaintSource
  order_id: string
  order_code: string
  customer_name: string
  worker_name: string | null
}

export type ComplaintListParams = {
  search?: string
  status?: ComplaintStatus
  type?: ComplaintType
  source?: ComplaintSource
  page: number
  pageSize: number
}

export type ComplaintDetail = {
  id: string
  type: ComplaintType
  title: string
  content: string
  image_urls: string[]
  status: ComplaintStatus
  resolution: string | null
  created_at: string
  resolved_at: string | null
  reporter_id: string | null
  reporter_name: string | null
  source: ComplaintSource
  order_id: string
  order_code: string
  order_status: OrderStatus
  order_price: number | null
  order_completed_at: string | null
  warranty_until: string | null
  service_name: string
  customer_id: string
  customer_name: string
  customer_phone: string | null
  worker_id: string | null
  worker_name: string | null
  worker_phone: string | null
  handled_by_name: string | null
}

export type HandleComplaintInput = {
  status: Exclude<ComplaintStatus, 'open'>
  resolution?: string
}

export const listComplaints = async (params: ComplaintListParams) => {
  const { data } = await api.get<Paginated<ComplaintRow>>('/admin/complaints', { params })
  return data
}

export const getComplaintDetail = async (id: string) => {
  const { data } = await api.get<ComplaintDetail>(`/admin/complaints/${id}`)
  return data
}

export const handleComplaint = async (id: string, input: HandleComplaintInput) => {
  const { data } = await api.patch<{ message: string }>(`/admin/complaints/${id}`, input)
  return data
}