import { api } from './client'
import type { Paginated } from './users'

export type AdminNotification = {
  id: string
  title: string
  body: string | null
  type: string
  data: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

export const listNotifications = async (params: { page?: number; pageSize?: number; unread?: boolean } = {}) => {
  const { data } = await api.get<Paginated<AdminNotification> & { unread: number }>('/admin/notifications', { params })
  return data
}

export const markNotificationRead = async (id: string) => {
  await api.patch(`/admin/notifications/${id}/read`)
}

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch<{ updated: number }>('/admin/notifications/read-all')
  return data
}
