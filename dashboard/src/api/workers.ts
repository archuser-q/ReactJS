import { api } from './client'
import type { Paginated, UserStatus } from './users'

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
  stats: { completed_orders: number; cancelled_orders: number; total_revenue: number }
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
