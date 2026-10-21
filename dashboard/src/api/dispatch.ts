import { api } from './client'
import type { MatchingMode } from './matching'

type RoundInfo = { at: string; orders: number; [key: string]: unknown }

export type DispatchStatus = {
  dispatcher: {
    enabled: boolean
    leader: boolean
    tick_seconds: number
    ticks?: number
    offers_sent?: number
    last_tick_at?: string
    last_auto?: RoundInfo
    last_batch?: RoundInfo
    last_error?: { at: string; message: string }
  }
  config: {
    id: number | null
    name: string
    mode: MatchingMode
    max_offers: number
    offer_timeout_seconds: number
    batch_window_seconds: number
    max_radius_km: number
  }
  queue: { mode: MatchingMode; orders: number; oldest: string }[]
  live_offers: number
}

// API của thành viên B (src/routes/admin/dispatch.routes.js)
export const getDispatchStatus = async () => {
  const { data } = await api.get<DispatchStatus>('/admin/dispatch/status')
  return data
}

/** Đổi nhanh chế độ ghép của cấu hình đang áp dụng (dùng khi demo / thực nghiệm) */
export const setDispatchMode = async (mode: MatchingMode, max_offers?: number) => {
  const { data } = await api.put<{ message: string }>('/admin/dispatch/mode', { mode, max_offers })
  return data
}
