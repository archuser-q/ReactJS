import { api } from './client'

export type WeightKey = 'w_distance' | 'w_trust' | 'w_skill' | 'w_acceptance' | 'w_workload'

export type MatchingConfigInput = Record<WeightKey, number> & {
  name: string
  max_radius_km: number
  offer_timeout_seconds: number
  batch_window_seconds: number
}

export type MatchingConfig = MatchingConfigInput & {
  id: number
  is_active: boolean
  created_at: string
  updated_at: string
  updated_by_name: string | null
  order_count: number
}

export type SimulationInput = {
  config: Record<WeightKey, number> & { max_radius_km: number }
  lat: number
  lng: number
  category_id: number
  include_offline: boolean
  limit: number
}

export type SimulationItem = {
  id: string
  full_name: string
  phone: string | null
  is_online: boolean
  distance_m: number
  trust_score: number
  acceptance_rate: number
  skill_years: number
  jobs_today: number
  criteria: { distance: number; trust: number; skill: number; acceptance: number; workload: number }
  score: number
}

export type SimulationResult = { total: number; query_ms: number; items: SimulationItem[] }

type Message = { message: string }

export const listConfigs = async () => {
  const { data } = await api.get<{ items: MatchingConfig[] }>('/admin/matching-configs')
  return data.items
}

export const createConfig = async (input: MatchingConfigInput) => {
  const { data } = await api.post<Message>('/admin/matching-configs', input)
  return data
}

export const updateConfig = async (id: number, input: MatchingConfigInput) => {
  const { data } = await api.put<Message>(`/admin/matching-configs/${id}`, input)
  return data
}

export const activateConfig = async (id: number) => {
  const { data } = await api.post<Message>(`/admin/matching-configs/${id}/activate`)
  return data
}

export const deleteConfig = async (id: number) => {
  const { data } = await api.delete<Message>(`/admin/matching-configs/${id}`)
  return data
}

export const simulate = async (input: SimulationInput) => {
  const { data } = await api.post<SimulationResult>('/admin/matching-configs/simulate', input)
  return data
}