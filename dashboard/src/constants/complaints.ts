import type { ComplaintSource, ComplaintStatus, ComplaintType } from '../api/complaints'

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

export const COMPLAINT_SOURCE: Record<ComplaintSource, { label: string; color: string }> = {
  customer: { label: 'Khách gửi', color: 'blue' },
  worker: { label: 'Thợ báo cáo', color: 'orange' },
}

/** Báo cáo của thợ được lưu với tiêu đề "[Thợ báo cáo] <lý do>" — bỏ tiền tố khi hiển thị vì đã có tag */
export const REPORT_PREFIX = '[Thợ báo cáo] '
export const complaintTitle = (title: string) => (title.startsWith(REPORT_PREFIX) ? title.slice(REPORT_PREFIX.length) : title)
