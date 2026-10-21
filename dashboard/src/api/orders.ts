import { api } from './client'
import type { OrderStatus } from './dashboard'
import type { Paginated } from './users'

export type OrderRow = {
  id: string
  code: string
  status: OrderStatus
  matching_mode: 'instant' | 'batch'
  created_at: string
  scheduled_at: string | null
  address_text: string
  price: number
  customer_name: string
  customer_phone: string | null
  worker_name: string | null
  service_name: string
  category_name: string
}

export type OrderListParams = {
  search?: string
  status?: OrderStatus
  from?: string
  to?: string
  page: number
  pageSize: number
}

export type OrderDetail = {
  order: {
    id: string
    code: string
    status: OrderStatus
    matching_mode: 'instant' | 'batch'
    address_text: string
    description: string | null
    image_urls: string[]
    scheduled_at: string | null
    created_at: string
    accepted_at: string | null
    started_at: string | null
    completed_at: string | null
    cancelled_at: string | null
    cancel_reason: string | null
    warranty_until: string | null
    safety_checked_at: string | null
    estimated_price: number
    extra_amount: number
    final_price: number | null
    commission_amount: number | null
    lat: number
    lng: number
    service_name: string
    category_name: string
    customer_id: string
    customer_name: string
    customer_phone: string | null
    worker_id: string | null
    worker_name: string | null
    worker_phone: string | null
    cancelled_by_name: string | null
  }
  history: {
    id: string
    from_status: OrderStatus | null
    to_status: OrderStatus
    note: string | null
    created_at: string
    changed_by_name: string | null
  }[]
  quotes: { id: string; description: string; amount: number; status: QuoteStatus; created_at: string }[]
  payments: {
    id: string
    method: 'cash' | 'momo' | 'vnpay'
    amount: number
    status: 'pending' | 'success' | 'failed' | 'refunded'
    provider_txn_id: string | null
    paid_at: string | null
    created_at: string
  }[]
  review: { id: string; rating: number; comment: string | null; is_flagged: boolean; created_at: string } | null
  /** Ảnh thợ chụp trên app thợ: trước khi sửa / sau khi sửa */
  photos: { id: string; kind: 'before' | 'after'; url: string; created_at: string }[]
  /** Các lời mời bộ điều phối đã gửi cho thợ */
  offers: OrderOffer[]
  /** Vết di chuyển của thợ khi làm đơn (app thợ gửi ~20 giây / điểm) */
  trail: { lat: number; lng: number; recorded_at: string }[]
  /** Hàng đợi ghép cặp (chỉ có khi đơn đang tìm thợ) */
  dispatch: {
    mode: 'instant' | 'batch' | 'auto'
    rounds: number
    offers_sent: number
    last_candidates: number | null
    next_attempt_at: string
    last_attempt_at: string | null
    deadline_at: string
    created_at: string
  } | null
}

export type QuoteStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type OfferStatus = 'offered' | 'accepted' | 'rejected' | 'expired' | 'cancelled'

export type OrderOffer = {
  id: string
  worker_id: string
  worker_name: string
  mode: 'instant' | 'batch'
  round: number
  rank_position: number | null
  score: number
  distance_km: number | null
  status: OfferStatus
  reason: string | null
  offered_at: string
  expires_at: string
  responded_at: string | null
}

export const listOrders = async (params: OrderListParams) => {
  const { data } = await api.get<Paginated<OrderRow>>('/admin/orders', { params })
  return data
}

export const getOrderDetail = async (id: string) => {
  const { data } = await api.get<OrderDetail>(`/admin/orders/${id}`)
  return data
}

export const cancelOrder = async (id: string, reason: string) => {
  const { data } = await api.post<{ message: string }>(`/admin/orders/${id}/cancel`, { reason })
  return data
}