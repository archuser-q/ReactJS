import type { UserStatus } from '../api/users'

export const USER_STATUS: Record<UserStatus, { label: string; color: string }> = {
  active: { label: 'Hoạt động', color: 'success' },
  locked: { label: 'Đã khóa', color: 'error' },
}