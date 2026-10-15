import { App, Avatar, Button, Popconfirm, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { EyeOutlined, LockOutlined, UnlockOutlined, UserOutlined } from '@ant-design/icons'
import { updateUserStatus } from '../../api/users'
import type { Paginated, UserListParams, UserRow } from '../../api/users'
import type { ApiError } from '../../api/client'
import { USER_STATUS } from '../../constants/user'

type Props = {
  data?: Paginated<UserRow>
  loading: boolean
  params: UserListParams
  onPageChange: (next: Partial<UserListParams>) => void
  onChanged: () => void
  onView: (id: string) => void
}

export default function UserTable({ data, loading, params, onPageChange, onChanged, onView }: Props) {
  const { message } = App.useApp()

  const toggleStatus = async (user: UserRow) => {
    try {
      const res = await updateUserStatus(user.id, user.status === 'active' ? 'locked' : 'active')
      message.success(res.message)
      onChanged()
    } catch (e) {
      message.error((e as ApiError).message)
    }
  }

  const columns: TableProps<UserRow>['columns'] = [
    {
      title: 'Khách hàng',
      dataIndex: 'full_name',
      render: (_, u) => (
        <Space>
          <Avatar src={u.avatar_url ?? undefined} icon={<UserOutlined />} />
          <Typography.Text strong>{u.full_name}</Typography.Text>
        </Space>
      ),
    },
    { title: 'Số điện thoại', dataIndex: 'phone', render: (v: string | null) => v ?? '—' },
    { title: 'Email', dataIndex: 'email', render: (v: string | null) => v ?? '—' },
    { title: 'Số đơn', dataIndex: 'order_count', align: 'right' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (s: UserRow['status']) => <Tag color={USER_STATUS[s].color}>{USER_STATUS[s].label}</Tag>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      render: (v: string) => new Date(v).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, u) => {
        const locking = u.status === 'active'
        return (
          <Space>
            <Button size="small" icon={<EyeOutlined />} onClick={() => onView(u.id)}>
              Chi tiết
            </Button>
            <Popconfirm
              title={locking ? 'Khóa tài khoản này?' : 'Mở khóa tài khoản này?'}
              okText="Đồng ý"
              cancelText="Hủy"
              onConfirm={() => toggleStatus(u)}
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
        showTotal: (total) => `Tổng ${total} khách hàng`,
        onChange: (page, pageSize) => onPageChange({ page, pageSize }),
      }}
    />
  )
}