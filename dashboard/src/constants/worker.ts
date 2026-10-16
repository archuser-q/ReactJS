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