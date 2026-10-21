import { Button, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import type { Paginated } from '../../api/users'
import type { ComplaintListParams, ComplaintRow } from '../../api/complaints'
import { COMPLAINT_SOURCE, COMPLAINT_STATUS, COMPLAINT_TYPE, complaintTitle } from '../../constants/complaints'
import { formatDateTime } from '../../constants/order'

type Props = {
  data?: Paginated<ComplaintRow>
  loading: boolean
  params: ComplaintListParams
  onPageChange: (next: Partial<ComplaintListParams>) => void
  onView: (id: string) => void
  emptyText?: string
}

export default function ComplaintTable({ data, loading, params, onPageChange, onView, emptyText }: Props) {
  const columns: TableProps<ComplaintRow>['columns'] = [
    {
      title: 'Người gửi',
      dataIndex: 'source',
      render: (s: ComplaintRow['source']) => <Tag color={COMPLAINT_SOURCE[s].color}>{COMPLAINT_SOURCE[s].label}</Tag>,
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      render: (t: ComplaintRow['type'], c) =>
        c.source === 'worker' ? <Tag>Sự cố đơn hàng</Tag> : <Tag color={COMPLAINT_TYPE[t].color}>{COMPLAINT_TYPE[t].label}</Tag>,
    },
    { title: 'Tiêu đề', dataIndex: 'title', render: (v: string) => <Typography.Text strong>{complaintTitle(v)}</Typography.Text> },
    { title: 'Mã đơn', dataIndex: 'order_code' },
    { title: 'Khách hàng', dataIndex: 'customer_name' },
    { title: 'Thợ', dataIndex: 'worker_name', render: (v: string | null) => v ?? '—' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (s: ComplaintRow['status']) => <Tag color={COMPLAINT_STATUS[s].color}>{COMPLAINT_STATUS[s].label}</Tag>,
    },
    { title: 'Gửi lúc', dataIndex: 'created_at', render: formatDateTime },
    {
      key: 'action',
      render: (_, c) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => onView(c.id)}>
          Xử lý
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
      locale={emptyText ? { emptyText } : undefined}
      pagination={{
        current: params.page,
        pageSize: params.pageSize,
        total: data?.total,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} khiếu nại`,
        onChange: (page, pageSize) => onPageChange({ page, pageSize }),
      }}
    />
  )
}