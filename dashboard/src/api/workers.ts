import { api } from './client'
import type { Paginated, UserStatus } from './users'
import type { OrderStatus } from './dashboard'

export type Verification = 'pending' | 'approved' | 'rejected'
export type DocumentType = 'id_card_front' | 'id_card_back' | 'certificate' | 'portrait' | 'other'

export type WorkerRow = {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  avatar_url: string | null
  status: UserStatus
  created_at: string
  verification_status: Verification
  /** Lúc thợ bấm "Gửi hồ sơ" trên app thợ (null = đang điền dở, chưa cần duyệt) */
  submitted_at: string | null
  is_online: boolean
  is_busy: boolean
  /** Số giấy tờ đang chờ duyệt (thợ đã duyệt gửi giấy mới cũng tính) */
  pending_docs: number
  needs_review: boolean
  experience_years: number
  total_jobs: number
  rating_avg: number
  rating_count: number
  trust_score: number
  skills: string[]
}

export type WorkerListParams = {
  search?: string
  status?: UserStatus
  verification?: Verification
  review?: 'needed'
  page: number
  pageSize: number
}

export type WorkerDetail = {
  worker: Omit<WorkerRow, 'skills' | 'pending_docs' | 'needs_review'> & {
    last_login_at: string | null
    bio: string | null
    verification_note: string | null
    verified_at: string | null
    verified_by_name: string | null
    location_updated_at: string | null
    service_radius_km: number
    is_flagged: boolean
    acceptance_rate: number
    cancel_rate: number
    wallet_balance: number
  }
  skills: { id: number; name: string; years: number }[]
  documents: WorkerDocument[]
  stats: {
    completed_orders: number
    cancelled_orders: number
    total_revenue: number
    /** Báo cáo sự cố do thợ gửi từ app thợ */
    reports: number
    /** Khiếu nại của khách về các đơn thợ làm */
    customer_complaints: number
    /** Số sự cố chưa đóng (mới / đang xử lý) */
    open_issues: number
  }
  recentReviews: { id: string; rating: number; comment: string | null; created_at: string; customer_name: string }[]
  bankAccount: { bank_name: string; account_number: string; account_holder: string; updated_at: string } | null
}

export type WorkerDocument = {
  id: string
  doc_type: DocumentType
  file_url: string
  status: Verification
  reject_reason: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by_name: string | null
  /** Bản mới nhất của loại giấy này (bản cũ hơn chỉ để đối chiếu) */
  is_current: boolean
}

export const listWorkers = async (params: WorkerListParams) => {
  const { data } = await api.get<Paginated<WorkerRow>>('/admin/workers', { params })
  return data
}

export const getWorkerDetail = async (id: string) => {
  const { data } = await api.get<WorkerDetail>(`/admin/workers/${id}`)
  return data
}

export const reviewWorker = async (id: string, status: 'approved' | 'rejected', note?: string) => {
  const { data } = await api.patch<{ message: string }>(`/admin/workers/${id}/verification`, { status, note })
  return data
}

export const reviewDocument = async (
  workerId: string,
  docId: string,
  status: 'approved' | 'rejected',
  reject_reason?: string,
) => {
  const { data } = await api.patch<{ message: string; document: WorkerDocument }>(
    `/admin/workers/${workerId}/documents/${docId}`,
    { status, reject_reason },
  )
  return data
}

export type WorkerOrderGroup = 'active' | 'completed' | 'cancelled'

export type WorkerOrder = {
  id: string
  code: string
  status: OrderStatus
  address_text: string
  scheduled_at: string | null
  created_at: string
  accepted_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  price: number
  commission_amount: number | null
  service_name: string
  customer_name: string
  rating: number | null
  review_comment: string | null
}

export type WorkerOrderParams = { group: WorkerOrderGroup; page: number; pageSize: number }
export type WorkerOrderList = Paginated<WorkerOrder> & { counts: Record<WorkerOrderGroup, number> }

export const listWorkerOrders = async (workerId: string, params: WorkerOrderParams) => {
  const { data } = await api.get<WorkerOrderList>(`/admin/workers/${workerId}/orders`, { params })
  return data
}

export type WorkerReview = {
  id: string
  rating: number
  comment: string | null
  image_urls: string[]
  is_flagged: boolean
  flag_reason: string | null
  created_at: string
  order_id: string
  order_code: string
  service_name: string
  customer_name: string
}

export type WorkerReviewParams = { rating?: number; page: number; pageSize: number }
export type WorkerReviewList = Paginated<WorkerReview> & {
  summary: { count: number; average: number | null; distribution: Record<1 | 2 | 3 | 4 | 5, number> }
}

export const listWorkerReviews = async (workerId: string, params: WorkerReviewParams) => {
  const { data } = await api.get<WorkerReviewList>(`/admin/workers/${workerId}/reviews`, { params })
  return data
}
