import { useEffect, useState } from 'react'
import { App, Avatar, Card, Col, Descriptions, Drawer, Flex, List, Row, Skeleton, Statistic, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { getUserDetail } from '../../api/users'
import type { UserDetail } from '../../api/users'
import type { ApiError } from '../../api/client'
import { USER_STATUS } from '../../constants/user'
import { ORDER_STATUS } from '../../constants/order'

type Props = { userId: string | null; onClose: () => void }

const formatMoney = (v: number) => v.toLocaleString('vi-VN') + ' ₫'
const formatDate = (v: string | null) => (v ? new Date(v).toLocaleString('vi-VN') : '—')

const orderColumns: TableProps<UserDetail['recentOrders'][number]>['columns'] = [
  { title: 'Mã đơn', dataIndex: 'code' },
  { title: 'Dịch vụ', dataIndex: 'service_name' },
  { title: 'Thợ', dataIndex: 'worker_name', render: (v: string | null) => v ?? '—' },
  { title: 'Giá trị', dataIndex: 'price', align: 'right', render: formatMoney },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    render: (s: keyof typeof ORDER_STATUS) => <Tag color={ORDER_STATUS[s].color}>{ORDER_STATUS[s].label}</Tag>,
  },
  { title: 'Ngày đặt', dataIndex: 'created_at', render: (v: string) => new Date(v).toLocaleDateString('vi-VN') },
]

export default function UserDetailDrawer({ userId, onClose }: Props) {
  const { message } = App.useApp()
  const [data, setData] = useState<UserDetail>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setData(undefined)
    getUserDetail(userId)
      .then(setData)
      .catch((e: ApiError) => message.error(e.message))
      .finally(() => setLoading(false))
  }, [userId, message])

  const user = data?.user

  return (
    <Drawer title="Chi tiết khách hàng" size="large" open={!!userId} onClose={onClose}>
      {loading || !data || !user ? (
        <Skeleton active avatar paragraph={{ rows: 8 }} />
      ) : (
        <Flex vertical gap={16}>
          <Flex align="center" gap={16}>
            <Avatar size={64} src={user.avatar_url ?? undefined} icon={<UserOutlined />} />
            <Flex vertical>
              <Typography.Title level={4}>{user.full_name}</Typography.Title>
              <div>
                <Tag color={USER_STATUS[user.status].color}>{USER_STATUS[user.status].label}</Tag>
              </div>
            </Flex>
          </Flex>

          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Số điện thoại">
              {user.phone ?? '—'}{' '}
              {user.phone && (
                <Tag color={user.phone_verified ? 'success' : 'default'}>
                  {user.phone_verified ? 'Đã xác thực' : 'Chưa xác thực'}
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Email">{user.email ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">{formatDate(user.created_at)}</Descriptions.Item>
            <Descriptions.Item label="Đăng nhập gần nhất">{formatDate(user.last_login_at)}</Descriptions.Item>
          </Descriptions>

          <Row gutter={[12, 12]}>
            <Col span={12} md={6}><Card size="small"><Statistic title="Tổng đơn" value={data.stats.total_orders} /></Card></Col>
            <Col span={12} md={6}><Card size="small"><Statistic title="Hoàn thành" value={data.stats.completed_orders} /></Card></Col>
            <Col span={12} md={6}><Card size="small"><Statistic title="Đã hủy" value={data.stats.cancelled_orders} /></Card></Col>
            <Col span={12} md={6}><Card size="small"><Statistic title="Đã chi tiêu" value={data.stats.total_spent} suffix="₫" groupSeparator="." /></Card></Col>
          </Row>

          <Card size="small" title="Địa chỉ đã lưu">
            <List
              dataSource={data.addresses}
              locale={{ emptyText: 'Chưa có địa chỉ' }}
              renderItem={(a) => (
                <List.Item>
                  <List.Item.Meta
                    title={<>{a.label ?? 'Địa chỉ'} {a.is_default && <Tag color="blue">Mặc định</Tag>}</>}
                    description={a.address_text}
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card size="small" title="Đơn hàng gần đây">
            <Table rowKey="id" size="small" columns={orderColumns} dataSource={data.recentOrders} pagination={false} scroll={{ x: true }} />
          </Card>
        </Flex>
      )}
    </Drawer>
  )
}