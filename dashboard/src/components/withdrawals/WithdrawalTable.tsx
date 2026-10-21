import { Button, Popconfirm, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import type { Paginated } from '../../api/users'
import type { Withdrawal, WithdrawalListParams } from '../../api/withdrawals'
import { WITHDRAWAL_STATUS } from '../../constants/withdrawal'
import { formatDateTime, formatMoney } from '../../constants/order'

type Props = {
  data?: Paginated<Withdrawal>
  loading: boolean
  params: WithdrawalListParams
  busyId: number | null
  onPageChange: (next: Partial<WithdrawalListParams>) => void
  onApprove: (w: Withdrawal) => void
  onReject: (w: Withdrawal) => void
}

export default function WithdrawalTable({ data, loading, params, busyId, onPageChange, onApprove, onReject }: Props) {
  const columns: TableProps<Withdrawal>['columns'] = [
    { title: 'Mã', dataIndex: 'id', render: (v: number) => `#${v}` },
    {
      title: 'Thợ',
      dataIndex: 'worker_name',
      render: (_, w) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>{w.worker_name}</Typography.Text>
          <Typography.Text type="secondary">{w.worker_phone ?? '—'}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      align: 'right',
      render: (v: number) => <Typography.Text strong>{formatMoney(v)}</Typography.Text>,
    },
    {
      title: 'Tài khoản nhận',
      key: 'bank',
      render: (_, w) => (
        <Space orientation="vertical" size={0}>
          <span>{w.bank_name}</span>
          <Typography.Text copyable={{ text: w.account_number }}>{w.account_number}</Typography.Text>
          <Typography.Text type="secondary">{w.account_holder}</Typography.Text>
        </Space>
      ),
    },
    { title: 'Yêu cầu lúc', dataIndex: 'created_at', render: formatDateTime },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (s: Withdrawal['status'], w) => (
        <Space orientation="vertical" size={0}>
          <Tag color={WITHDRAWAL_STATUS[s].color}>{WITHDRAWAL_STATUS[s].label}</Tag>
          {w.processed_at && <Typography.Text type="secondary">{formatDateTime(w.processed_at)}</Typography.Text>}
          {w.transaction_code && <Typography.Text type="secondary">Mã GD: {w.transaction_code}</Typography.Text>}
          {w.note && <Typography.Text type="secondary">{w.note}</Typography.Text>}
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, w) =>
        w.status === 'pending' ? (
          <Space>
            <Popconfirm
              title="Xác nhận đã chuyển khoản?"
              description={`${formatMoney(w.amount)} tới ${w.bank_name} ${w.account_number}`}
              okText="Đã chuyển"
              cancelText="Hủy"
              onConfirm={() => onApprove(w)}
            >
              <Button size="small" type="primary" icon={<CheckOutlined />} loading={busyId === w.id}>
                Duyệt
              </Button>
            </Popconfirm>
            <Button size="small" danger icon={<CloseOutlined />} onClick={() => onReject(w)}>
              Từ chối
            </Button>
          </Space>
        ) : null,
    },
  ]

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data?.items}
      loading={loading}
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: params.status === 'pending' ? 'Không có lệnh rút nào đang chờ' : 'Chưa có lệnh rút tiền' }}
      pagination={{
        current: params.page,
        pageSize: params.pageSize,
        total: data?.total,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} lệnh rút`,
        onChange: (page, pageSize) => onPageChange({ page, pageSize }),
      }}
    />
  )
}
