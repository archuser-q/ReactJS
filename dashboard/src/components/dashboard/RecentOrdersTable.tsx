import { Card, Table, Tag } from 'antd'
import type { TableProps } from 'antd'
import type { RecentOrder } from '../../api/dashboard'
import { ORDER_STATUS } from '../../constants/order'

const columns: TableProps<RecentOrder>['columns'] = [
  { title: 'Mã đơn', dataIndex: 'code' },
  { title: 'Khách hàng', dataIndex: 'customer_name' },
  { title: 'Dịch vụ', dataIndex: 'service_name' },
  { title: 'Thợ', dataIndex: 'worker_name', render: (v: string | null) => v ?? '—' },
  {
    title: 'Giá trị',
    dataIndex: 'price',
    align: 'right',
    render: (v: number) => v.toLocaleString('vi-VN') + ' ₫',
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    render: (s: RecentOrder['status']) => <Tag color={ORDER_STATUS[s].color}>{ORDER_STATUS[s].label}</Tag>,
  },
  {
    title: 'Thời gian',
    dataIndex: 'created_at',
    render: (v: string) => new Date(v).toLocaleString('vi-VN'),
  },
]

export default function RecentOrdersTable({ orders }: { orders: RecentOrder[] }) {
  return (
    <Card title="Đơn hàng mới nhất">
      <Table rowKey="id" columns={columns} dataSource={orders} pagination={false} scroll={{ x: true }} />
    </Card>
  )
}