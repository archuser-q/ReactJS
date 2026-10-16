import { Button, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import type { Paginated } from '../../api/users'
import type { OrderListParams, OrderRow } from '../../api/orders'
import { ORDER_STATUS, formatDateTime, formatMoney } from '../../constants/order'

type Props = {
  data?: Paginated<OrderRow>
  loading: boolean
  params: OrderListParams
  onPageChange: (next: Partial<OrderListParams>) => void
  onView: (id: string) => void
}

export default function OrderTable({ data, loading, params, onPageChange, onView }: Props) {
  const columns: TableProps<OrderRow>['columns'] = [
    { title: 'Mã đơn', dataIndex: 'code', render: (code: string) => <Typography.Text strong>{code}</Typography.Text> },
    {
      title: 'Dịch vụ',
      dataIndex: 'service_name',
      render: (name: string, o) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text>{name}</Typography.Text>
          <Typography.Text type="secondary">{o.category_name}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      render: (name: string, o) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text>{name}</Typography.Text>
          <Typography.Text type="secondary">{o.customer_phone ?? '—'}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Thợ',
      dataIndex: 'worker_name',
      render: (v: string | null) => v ?? <Typography.Text type="secondary">Chưa có</Typography.Text>,
    },
    { title: 'Khu vực', dataIndex: 'address_text' },
    { title: 'Giá trị', dataIndex: 'price', align: 'right', render: formatMoney },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (s: OrderRow['status']) => <Tag color={ORDER_STATUS[s].color}>{ORDER_STATUS[s].label}</Tag>,
    },
    { title: 'Tạo lúc', dataIndex: 'created_at', render: formatDateTime },
    {
      key: 'action',
      render: (_, o) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => onView(o.id)}>
          Chi tiết
        </Button>
      ),
    },
  ]

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data?.items}
      loading={loading}
      scroll={{ x: 'max-content' }}
      pagination={{
        current: params.page,
        pageSize: params.pageSize,
        total: data?.total,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} đơn`,
        onChange: (page, pageSize) => onPageChange({ page, pageSize }),
      }}
    />
  )
}