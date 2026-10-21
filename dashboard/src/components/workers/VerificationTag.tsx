import { Space, Tag, Tooltip } from 'antd'
import type { WorkerRow } from '../../api/workers'
import { VERIFICATION } from '../../constants/worker'

/** Trạng thái hồ sơ, tách rõ "đang điền dở" (chưa bấm gửi) với "chờ duyệt" (đã gửi) */
export default function VerificationTag({ w }: { w: Pick<WorkerRow, 'verification_status' | 'submitted_at'> & { pending_docs?: number } }) {
  if (w.verification_status === 'pending' && !w.submitted_at) {
    return (
      <Tooltip title="Thợ chưa bấm “Gửi hồ sơ” trên app thợ">
        <Tag>Đang hoàn thiện</Tag>
      </Tooltip>
    )
  }
  return (
    <Space size={4} wrap>
      <Tag color={VERIFICATION[w.verification_status].color}>{VERIFICATION[w.verification_status].label}</Tag>
      {w.verification_status === 'approved' && !!w.pending_docs && (
        <Tag color="warning">{w.pending_docs} giấy tờ mới</Tag>
      )}
    </Space>
  )
}
