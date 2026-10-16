import { Input, Select, Space } from 'antd'
import type { ComplaintListParams, ComplaintStatus, ComplaintType } from '../../api/complaints'
import { COMPLAINT_STATUS, COMPLAINT_TYPE } from '../../constants/complaints'

type Props = { onChange: (next: Partial<ComplaintListParams>) => void }

export default function ComplaintFilters({ onChange }: Props) {
  return (
    <Space wrap>
      <Input.Search
        placeholder="Tiêu đề, mã đơn, tên khách / thợ"
        allowClear
        enterButton
        onSearch={(value) => onChange({ search: value || undefined })}
      />
      <Select<ComplaintType>
        placeholder="Loại"
        allowClear
        onChange={(value) => onChange({ type: value })}
        options={Object.entries(COMPLAINT_TYPE).map(([value, t]) => ({ value: value as ComplaintType, label: t.label }))}
      />
      <Select<ComplaintStatus>
        placeholder="Trạng thái"
        allowClear
        popupMatchSelectWidth={false}
        onChange={(value) => onChange({ status: value })}
        options={Object.entries(COMPLAINT_STATUS).map(([value, s]) => ({ value: value as ComplaintStatus, label: s.label }))}
      />
    </Space>
  )
}