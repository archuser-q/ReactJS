import { api } from './client'
import type { Paginated } from './users'

export type WithdrawalStatus = 'pending' | 'completed' | 'rejected'

export type Withdrawal = {
  id: number
  worker_id: number
  worker_name: string
  worker_phone: string | null
  amount: number
  bank_name: string
  account_number: string
  account_holder: string
  status: WithdrawalStatus
  transaction_code: string | null
  note: string | null
  created_at: string
  processed_at: string | null
}

export type WithdrawalListParams = { status?: WithdrawalStatus; page: number; pageSize: number }

// API của thành viên B (src/routes/admin/dispatch.routes.js)
export const listWithdrawals = async (params: WithdrawalListParams) => {
  const { data } = await api.get<Paginated<Withdrawal>>('/admin/withdrawals', { params })
  return data
}

export const approveWithdrawal = async (id: number, note?: string) => {
  const { data } = await api.post<Withdrawal>(`/admin/withdrawals/${id}/approve`, { note })
  return data
}

/** Từ chối: tiền được hoàn lại vào ví thợ */
export const rejectWithdrawal = async (id: number, note: string) => {
  const { data } = await api.post<Withdrawal>(`/admin/withdrawals/${id}/reject`, { note })
  return data
}
