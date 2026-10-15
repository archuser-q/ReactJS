import { api } from './client'
import type { OrderStatus } from './dashboard'

export type UserStatus = 'active' | 'locked'

export type UserRow = {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  status: UserStatus
  created_at: string
  last_login_at: string | null
  order_count: number
}

export type UserListParams = {
  role?: 'customer' | 'worker'
  search?: string
  status?: UserStatus
  page: number
  pageSize: number
}

export type UserDetail = {
  user: {
    id: string
    full_name: string
    email: string | null
    phone: string | null
    avatar_url: string | null
    role: 'customer' | 'worker'
    status: UserStatus
    phone_verified: boolean
    created_at: string
    last_login_at: string | null
  }
  stats: {
    total_orders: number
    completed_orders: number
    cancelled_orders: number
    total_spent: number
  }
  addresses: { id: string; label: string | null; address_text: string; is_default: boolean }[]
  recentOrders: {
    id: string
    code: string
    status: OrderStatus
    price: number
    created_at: string
    service_name: string
    worker_name: string | null
  }[]
}

export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number }

export const listUsers = async (params: UserListParams) => {
  const { data } = await api.get<Paginated<UserRow>>('/admin/users', { params })
  return data
}

export const getUserDetail = async (id: string) => {
  const { data } = await api.get<UserDetail>(`/admin/users/${id}`)
  return data
}

export const updateUserStatus = async (id: string, status: UserStatus) => {
  const { data } = await api.patch<{ message: string }>(`/admin/users/${id}/status`, { status })
  return data
}