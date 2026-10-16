import type { ComplaintStatus, ComplaintType } from '../api/complaints'

export const COMPLAINT_STATUS: Record<ComplaintStatus, { label: string; color: string }> = {
  open: { label: 'Mới', color: 'error' },
  processing: { label: 'Đang xử lý', color: 'processing' },
  resolved: { label: 'Đã giải quyết', color: 'success' },
  rejected: { label: 'Từ chối', color: 'default' },
}

export const COMPLAINT_TYPE: Record<ComplaintType, { label: string; color: string }> = {
  complaint: { label: 'Khiếu nại', color: 'volcano' },
  warranty: { label: 'Bảo hành', color: 'geekblue' },
}