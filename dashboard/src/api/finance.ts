import { api } from './client'
import type { Paginated } from './users'

/** Loại biến động ví thợ (worker_transactions.type) */
export type TxnType = 'earning' | 'commission' | 'topup' | 'withdraw' | 'refund' | 'adjustment'

export type WalletTxn = {
  id: string
  worker_id: string
  worker_name: string
  worker_phone: string | null
  type: TxnType
  amount: number
  balance_after: number
  note: string | null
  order_id: string | null
  order_code: string | null
  withdrawal_id: string | null
  created_at: string
}

export type TxnParams = {
  workerId?: string
  type?: TxnType
  from?: string
  to?: string
  search?: string
  page: number
  pageSize: number
}

export type TxnList = Paginated<WalletTxn> & { summary: { type: TxnType; count: number; amount: number }[] }

export const listTransactions = async (params: TxnParams) => {
  const { data } = await api.get<TxnList>('/admin/finance/transactions', { params })
  return data
}

export type PaymentMethod = 'cash' | 'momo' | 'vnpay'
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded'

export type CustomerPayment = {
  id: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  provider_txn_id: string | null
  paid_at: string | null
  created_at: string
  order_id: string
  order_code: string
  commission_amount: number | null
  customer_name: string
  customer_phone: string | null
  worker_name: string | null
}

export type PaymentParams = {
  method?: PaymentMethod
  status?: PaymentStatus
  from?: string
  to?: string
  search?: string
  page: number
  pageSize: number
}

export type PaymentList = Paginated<CustomerPayment> & {
  summary: { method: PaymentMethod; status: PaymentStatus; count: number; amount: number }[]
}

export const listPayments = async (params: PaymentParams) => {
  const { data } = await api.get<PaymentList>('/admin/finance/payments', { params })
  return data
}
