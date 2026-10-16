import { DatePicker, Input, Select, Space } from 'antd'
import type { OrderStatus } from '../../api/dashboard'
import type { OrderListParams } from '../../api/orders'
import { ORDER_STATUS } from '../../constants/order'

type Props = { onChange: (next: Partial<OrderListParams>) => void }

export default function OrderFilters({ onChange }: Props) {
  return (
    <Space wrap>
      <Input.Search
        placeholder="Mã đơn, tên / SĐT khách, tên thợ"
        allowClear
        enterButton
        onSearch={(value) => onChange({ search: value || undefined })}
      />
      <Select<OrderStatus>
        placeholder="Trạng thái"
        allowClear
        popupMatchSelectWidth={false}
        onChange={(value) => onChange({ status: value })}
        options={Object.entries(ORDER_STATUS).map(([value, s]) => ({ value: value as OrderStatus, label: s.label }))}
      />
      <DatePicker.RangePicker
        format="DD/MM/YYYY"
        placeholder={['Từ ngày', 'Đến ngày']}
        onChange={(dates) =>
          onChange({
            from: dates?.[0]?.format('YYYY-MM-DD'),
            to: dates?.[1]?.format('YYYY-MM-DD'),
          })
        }
      />
    </Space>
  )
}