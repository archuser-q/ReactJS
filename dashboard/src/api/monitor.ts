import { api } from './client'
import type { OrderStatus } from './dashboard'

export type MapOrder = {
  id: string
  code: string
  status: OrderStatus
  address_text: string
  scheduled_at: string | null
  created_at: string
  accepted_at: string | null
  price: number
  lat: number
  lng: number
  service_name: string
  category_name: string
  customer_name: string
  worker_id: string | null
  worker_name: string | null
  dispatch_rounds: number | null
  dispatch_offers: number | null
  dispatch_candidates: number | null
  live_offers: number
}

export type MapWorker = {
  id: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  is_online: boolean
  is_busy: boolean
  lat: number
  lng: number
  location_updated_at: string | null
  service_radius_km: number
  rating_avg: number
  rating_count: number
  /** Vị trí còn đủ mới để được ghép đơn (LOCATION_MAX_AGE_MINUTES của backend) */
  location_fresh: boolean
  current_order_code: string | null
  skills: string[]
}

export type MapData = { orders: MapOrder[]; workers: MapWorker[]; generated_at: string }

export const getMapData = async () => {
  const { data } = await api.get<MapData>('/admin/monitor/map')
  return data
}
