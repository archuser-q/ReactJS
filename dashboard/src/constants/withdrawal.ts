import type { WithdrawalStatus } from '../api/withdrawals'

export const WITHDRAWAL_STATUS: Record<WithdrawalStatus, { label: string; color: string }> = {
  pending: { label: 'Chờ duyệt', color: 'warning' },
  completed: { label: 'Đã chuyển', color: 'success' },
  rejected: { label: 'Từ chối · đã hoàn ví', color: 'error' },
}
