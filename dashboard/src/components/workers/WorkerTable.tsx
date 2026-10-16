import { App, Avatar, Badge, Button, Popconfirm, Rate, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { EyeOutlined, LockOutlined, UnlockOutlined, UserOutlined } from '@ant-design/icons'
import { updateUserStatus } from '../../api/users'
import type { Paginated } from '../../api/users'
import type { WorkerListParams, WorkerRow } from '../../api/workers'
import type { ApiError } from '../../api/client'
import { USER_STATUS } from '../../constants/user'
import { VERIFICATION } from '../../constants/worker'

type Props = {
  data?: Paginated<WorkerRow>
  loading: boolean
  params: WorkerListParams
  onPageChange: (next: Partial<WorkerListParams>) => void
  onChanged: () => void
  onView: (id: string) => void
}

export default function WorkerTable({ data, loading, params, onPageChange, onChanged, onView }: Props) {
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
          <Badge dot status={w.is_online ? 'success' : 'default'}>
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
      title: 'Kỹ năng',
      dataIndex: 'skills',
      render: (skills: string[]) => (skills.length ? skills.map((s) => <Tag key={s}>{s}</Tag>) : '—'),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating_avg',
      render: (_, w) =>
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
    { title: 'Số việc', dataIndex: 'total_jobs', align: 'right' },
    {
      title: 'Hồ sơ',
      dataIndex: 'verification_status',
      render: (v: WorkerRow['verification_status']) => <Tag color={VERIFICATION[v].color}>{VERIFICATION[v].label}</Tag>,
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
            <Button size="small" icon={<EyeOutlined />} onClick={() => onView(w.id)}>
              Chi tiết
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