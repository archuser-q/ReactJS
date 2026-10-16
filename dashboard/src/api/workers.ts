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
  is_online: boolean
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
  page: number
  pageSize: number
}

export type WorkerDetail = {
  worker: Omit<WorkerRow, 'skills'> & {
    last_login_at: string | null
    bio: string | null
    verification_note: string | null
    verified_at: string | null
    service_radius_km: number
    is_flagged: boolean
    acceptance_rate: number
    cancel_rate: number
    wallet_balance: number
  }
  skills: { id: number; name: string; years: number }[]
  documents: {
    id: string
    doc_type: DocumentType
    file_url: string
    status: Verification
    reject_reason: string | null
    created_at: string
    reviewed_at: string | null
  }[]
  stats: { completed_orders: number; cancelled_orders: number; total_revenue: number }
  recentReviews: { id: string; rating: number; comment: string | null; created_at: string; customer_name: string }[]
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