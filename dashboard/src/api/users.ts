import { api } from './client'

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

export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number }

export const listUsers = async (params: UserListParams) => {
  const { data } = await api.get<Paginated<UserRow>>('/admin/users', { params })
  return data
}

export const updateUserStatus = async (id: string, status: UserStatus) => {
  const { data } = await api.patch<{ message: string }>(`/admin/users/${id}/status`, { status })
  return data
}