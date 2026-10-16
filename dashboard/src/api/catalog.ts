import { api } from './client'

export type Category = {
  id: number
  name: string
  icon_url: string | null
  description: string | null
  sort_order: number
  is_active: boolean
  service_count: number
}

export type CategoryInput = {
  name?: string
  icon_url?: string | null
  description?: string | null
  sort_order?: number
  is_active?: boolean
}

export type Service = {
  id: number
  category_id: number
  category_name: string
  name: string
  description: string | null
  base_price: number
  unit: string
  warranty_days: number
  is_active: boolean
  order_count: number
}

export type ServiceInput = {
  category_id?: number
  name?: string
  description?: string | null
  base_price?: number
  unit?: string
  warranty_days?: number
  is_active?: boolean
}

type Message = { message: string }

export const listCategories = async () => {
  const { data } = await api.get<{ items: Category[] }>('/admin/categories')
  return data.items
}

export const createCategory = async (input: CategoryInput) => {
  const { data } = await api.post<Message>('/admin/categories', input)
  return data
}

export const updateCategory = async (id: number, input: CategoryInput) => {
  const { data } = await api.patch<Message>(`/admin/categories/${id}`, input)
  return data
}

export const listServices = async (params: { categoryId?: number; search?: string }) => {
  const { data } = await api.get<{ items: Service[] }>('/admin/services', { params })
  return data.items
}

export const createService = async (input: ServiceInput) => {
  const { data } = await api.post<Message>('/admin/services', input)
  return data
}

export const updateService = async (id: number, input: ServiceInput) => {
  const { data } = await api.patch<Message>(`/admin/services/${id}`, input)
  return data
}