import type { DocumentType, Verification } from '../api/workers'

export const VERIFICATION: Record<Verification, { label: string; color: string }> = {
  pending: { label: 'Chờ duyệt', color: 'warning' },
  approved: { label: 'Đã duyệt', color: 'success' },
  rejected: { label: 'Bị từ chối', color: 'error' },
}

export const DOCUMENT_TYPE: Record<DocumentType, string> = {
  id_card_front: 'CCCD mặt trước',
  id_card_back: 'CCCD mặt sau',
  certificate: 'Chứng chỉ nghề',
  portrait: 'Ảnh chân dung',
  other: 'Khác',
}

/** Giấy tờ bắt buộc (trùng REQUIRED_DOCS của app thợ). Chứng chỉ nghề không bắt buộc. */
export const REQUIRED_DOCS: DocumentType[] = ['id_card_front', 'id_card_back', 'portrait']

/** Lý do từ chối hay gặp, bấm để điền nhanh */
export const DOC_REJECT_REASONS = [
  'Ảnh bị mờ, không đọc được thông tin',
  'Ảnh bị loá / mất góc',
  'Thông tin không khớp với họ tên đăng ký',
  'Giấy tờ đã hết hạn',
  'Ảnh chân dung không khớp ảnh trên CCCD',
]
