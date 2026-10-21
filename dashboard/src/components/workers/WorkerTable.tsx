import { App, Avatar, Badge, Button, Popconfirm, Rate, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { EyeOutlined, LockOutlined, UnlockOutlined, UserOutlined } from '@ant-design/icons'
import { updateUserStatus } from '../../api/users'
import type { Paginated } from '../../api/users'
import type { WorkerListParams, WorkerRow } from '../../api/workers'
import type { ApiError } from '../../api/client'
import { USER_STATUS } from '../../constants/user'
import VerificationTag from './VerificationTag'
import { formatDateTime } from '../../constants/order'

type Props = {
  data?: Paginated<WorkerRow>
  loading: boolean
  params: WorkerListParams
  onPageChange: (next: Partial<WorkerListParams>) => void
  onChanged: () => void
  onView: (id: string) => void
  /** Đang xem hàng chờ duyệt: hiện cột thời gian gửi + thời gian chờ */
  reviewQueue?: boolean
}

const waited = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (m < 60) return `${m} phút`
  if (m < 60 * 24) return `${Math.floor(m / 60)} giờ`
  return `${Math.floor(m / 60 / 24)} ngày`
}

export default function WorkerTable({ data, loading, params, onPageChange, onChanged, onView, reviewQueue }: Props) {
  const { message } = App.useApp()

  const toggleStatus = async (w: WorkerRow) => {
    try {
      const res = await updateUserStatus(w.id, w.status === 'active' ? 'locked' : 'active')
      message.success(res.message)
      onChanged()
    } catch (e) {
      message.error((e as ApiError).message)
    }
  }

  const columns: TableProps<WorkerRow>['columns'] = [
    {
      title: 'Thợ',
      dataIndex: 'full_name',
      render: (_, w) => (
        <Space>
          <Badge dot status={w.is_busy ? 'warning' : w.is_online ? 'success' : 'default'}>
            <Avatar src={w.avatar_url ?? undefined} icon={<UserOutlined />} />
          </Badge>
          <Space orientation="vertical" size={0}>
            <Typography.Text strong>{w.full_name}</Typography.Text>
            <Typography.Text type="secondary">{w.phone ?? w.email ?? '—'}</Typography.Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Nhóm dịch vụ',
      dataIndex: 'skills',
      render: (skills: string[]) => (skills.length ? skills.map((s) => <Tag key={s}>{s}</Tag>) : '—'),
    },
    ...(reviewQueue
      ? [
          {
            title: 'Gửi hồ sơ',
            dataIndex: 'submitted_at',
            render: (v: string | null, w: WorkerRow) =>
              w.verification_status === 'approved' ? (
                <Typography.Text type="secondary">Đã duyệt, gửi giấy mới</Typography.Text>
              ) : v ? (
                <Space orientation="vertical" size={0}>
                  <span>{formatDateTime(v)}</span>
                  <Typography.Text type="secondary">chờ {waited(v)}</Typography.Text>
                </Space>
              ) : (
                '—'
              ),
          },
        ]
      : [
          {
            title: 'Đánh giá',
            dataIndex: 'rating_avg',
            render: (_: number, w: WorkerRow) =>
              w.rating_count === 0 ? (
                <Typography.Text type="secondary">Chưa có</Typography.Text>
              ) : (
                <Space size={4}>
                  <Rate disabled count={1} value={1} />
                  <Typography.Text strong>{w.rating_avg.toFixed(1)}</Typography.Text>
                  <Typography.Text type="secondary">({w.rating_count})</Typography.Text>
                </Space>
              ),
          },
          { title: 'Số việc', dataIndex: 'total_jobs', align: 'right' as const },
        ]),
    {
      title: 'Hồ sơ',
      dataIndex: 'verification_status',
      render: (_, w) => <VerificationTag w={w} />,
    },
    {
      title: 'Tài khoản',
      dataIndex: 'status',
      render: (s: WorkerRow['status']) => <Tag color={USER_STATUS[s].color}>{USER_STATUS[s].label}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, w) => {
        const locking = w.status === 'active'
        return (
          <Space>
            <Button size="small" type={w.needs_review ? 'primary' : 'default'} icon={<EyeOutlined />} onClick={() => onView(w.id)}>
              {w.needs_review ? 'Duyệt' : 'Chi tiết'}
            </Button>
            <Popconfirm
              title={locking ? 'Khóa tài khoản thợ này?' : 'Mở khóa tài khoản thợ này?'}
              okText="Đồng ý"
              cancelText="Hủy"
              onConfirm={() => toggleStatus(w)}
            >
              <Button size="small" danger={locking} icon={locking ? <LockOutlined /> : <UnlockOutlined />}>
                {locking ? 'Khóa' : 'Mở khóa'}
              </Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data?.items}
      loading={loading}
      scroll={{ x: true }}
      locale={reviewQueue ? { emptyText: 'Không có hồ sơ nào cần duyệt' } : undefined}
      pagination={{
        current: params.page,
        pageSize: params.pageSize,
        total: data?.total,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} thợ`,
        onChange: (page, pageSize) => onPageChange({ page, pageSize }),
      }}
    />
  )
}
