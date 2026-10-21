import { useCallback, useEffect, useState } from 'react'
import {
  Alert, App, Button, Card, Descriptions, Drawer, Empty, Flex, Image, Rate, Skeleton, Space, Table, Tag, Timeline, Typography,
} from 'antd'
import { StopOutlined } from '@ant-design/icons'
import { cancelOrder, getOrderDetail } from '../../api/orders'
import type { OrderDetail } from '../../api/orders'
import type { ApiError } from '../../api/client'
import {
  MATCHING_MODE, ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, QUOTE_STATUS, formatDateTime, formatMoney,
} from '../../constants/order'
import CancelOrderModal from './CancelOrderModal'
import OrderMatchingCard from './OrderMatchingCard'
import OrderPhotosCard from './OrderPhotosCard'
import OrderTrailMap from './OrderTrailMap'

type Props = { orderId: string | null; onClose: () => void; onChanged: () => void }

export default function OrderDetailDrawer({ orderId, onClose, onChanged }: Props) {
  const { message } = App.useApp()
  const [data, setData] = useState<OrderDetail>()
  const [loading, setLoading] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const load = useCallback(async (id: string) => {
    setLoading(true)
    try {
      setData(await getOrderDetail(id))
    } catch (e) {
      message.error((e as ApiError).message)
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    if (orderId) {
      setData(undefined)
      load(orderId)
    }
  }, [orderId, load])

  const handleCancel = async (reason: string) => {
    if (!orderId) return
    setCancelling(true)
    try {
      const res = await cancelOrder(orderId, reason)
      message.success(res.message)
      setCancelOpen(false)
      onChanged()
      load(orderId)
    } catch (e) {
      message.error((e as ApiError).message)
    } finally {
      setCancelling(false)
    }
  }

  const o = data?.order
  const canCancel = o && !['completed', 'cancelled'].includes(o.status)

  return (
    <Drawer
      title={o ? `Đơn hàng ${o.code}` : 'Chi tiết đơn hàng'}
      size="large"
      open={!!orderId}
      onClose={onClose}
      extra={
        canCancel && (
          <Button danger icon={<StopOutlined />} onClick={() => setCancelOpen(true)}>
            Hủy đơn
          </Button>
        )
      }
    >
      {loading || !data || !o ? (
        <Skeleton active paragraph={{ rows: 12 }} />
      ) : (
        <Flex vertical gap={16}>
          <Space wrap>
            <Tag color={ORDER_STATUS[o.status].color}>{ORDER_STATUS[o.status].label}</Tag>
            <Tag>Ghép cặp: {MATCHING_MODE[o.matching_mode]}</Tag>
            {o.safety_checked_at && <Tag color="green">Thợ đã kiểm tra an toàn điện lúc {formatDateTime(o.safety_checked_at)}</Tag>}
          </Space>

          {o.status === 'cancelled' && (
            <Alert
              type="error"
              showIcon
              title={`Đã hủy bởi ${o.cancelled_by_name ?? 'hệ thống'} lúc ${formatDateTime(o.cancelled_at)}`}
              description={o.cancel_reason ?? undefined}
            />
          )}

          <Descriptions bordered size="small" column={1} title="Thông tin đơn">
            <Descriptions.Item label="Dịch vụ">{o.service_name} ({o.category_name})</Descriptions.Item>
            <Descriptions.Item label="Khách hàng">{o.customer_name} · {o.customer_phone ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Thợ">
              {o.worker_name ? `${o.worker_name} · ${o.worker_phone ?? '—'}` : 'Chưa có thợ nhận'}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">
              {o.address_text}{' '}
              <Typography.Link href={`https://www.openstreetmap.org/?mlat=${o.lat}&mlon=${o.lng}#map=17/${o.lat}/${o.lng}`} target="_blank">
                Mở bản đồ lớn
              </Typography.Link>
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả sự cố">{o.description ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Hẹn lịch">{o.scheduled_at ? formatDateTime(o.scheduled_at) : 'Gọi ngay'}</Descriptions.Item>
            <Descriptions.Item label="Bảo hành đến">{formatDateTime(o.warranty_until)}</Descriptions.Item>
          </Descriptions>

          {o.image_urls.length > 0 && (
            <Card size="small" title="Ảnh khách gửi">
              <Image.PreviewGroup>
                <Space wrap>
                  {o.image_urls.map((url) => (
                    <Image key={url} src={url} width={100} height={100} />
                  ))}
                </Space>
              </Image.PreviewGroup>
            </Card>
          )}

          <OrderTrailMap data={data} />

          <OrderMatchingCard data={data} />

          <OrderPhotosCard photos={data.photos} />

          <Descriptions bordered size="small" column={1} title="Chi phí">
            <Descriptions.Item label="Giá dự kiến">{formatMoney(o.estimated_price)}</Descriptions.Item>
            <Descriptions.Item label="Phát sinh">{formatMoney(o.extra_amount)}</Descriptions.Item>
            <Descriptions.Item label="Thành tiền">
              <Typography.Text strong>{formatMoney(o.final_price)}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Hoa hồng nền tảng">{formatMoney(o.commission_amount)}</Descriptions.Item>
          </Descriptions>

          <Card size="small" title="Báo giá phát sinh">
            {data.quotes.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có" />
            ) : (
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={data.quotes}
                columns={[
                  { title: 'Nội dung', dataIndex: 'description' },
                  { title: 'Số tiền', dataIndex: 'amount', align: 'right', render: formatMoney },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    render: (s: keyof typeof QUOTE_STATUS) => <Tag color={QUOTE_STATUS[s].color}>{QUOTE_STATUS[s].label}</Tag>,
                  },
                ]}
              />
            )}
          </Card>

          <Card size="small" title="Thanh toán">
            {data.payments.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa thanh toán" />
            ) : (
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={data.payments}
                columns={[
                  { title: 'Phương thức', dataIndex: 'method', render: (m: keyof typeof PAYMENT_METHOD) => PAYMENT_METHOD[m] },
                  { title: 'Số tiền', dataIndex: 'amount', align: 'right', render: formatMoney },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    render: (s: keyof typeof PAYMENT_STATUS) => <Tag color={PAYMENT_STATUS[s].color}>{PAYMENT_STATUS[s].label}</Tag>,
                  },
                  { title: 'Thời gian', dataIndex: 'paid_at', render: formatDateTime },
                ]}
              />
            )}
          </Card>

          <Card size="small" title="Đánh giá của khách">
            {data.review ? (
              <Flex vertical gap={4}>
                <Space>
                  <Rate disabled value={data.review.rating} />
                  {data.review.is_flagged && <Tag color="red">Bất thường</Tag>}
                </Space>
                <Typography.Text>{data.review.comment ?? 'Không có nhận xét'}</Typography.Text>
              </Flex>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa đánh giá" />
            )}
          </Card>

          <Card size="small" title="Lịch sử trạng thái">
            <Timeline
              items={data.history.map((h) => ({
                color: h.to_status === 'cancelled' ? 'red' : h.to_status === 'completed' ? 'green' : 'blue',
                content: (
                  <Flex vertical>
                    <Typography.Text strong>{ORDER_STATUS[h.to_status].label}</Typography.Text>
                    <Typography.Text type="secondary">
                      {formatDateTime(h.created_at)}
                      {h.changed_by_name && ` · ${h.changed_by_name}`}
                    </Typography.Text>
                    {h.note && <Typography.Text>{h.note}</Typography.Text>}
                  </Flex>
                ),
              }))}
            />
          </Card>
        </Flex>
      )}

      <CancelOrderModal
        open={cancelOpen}
        loading={cancelling}
        onCancel={() => setCancelOpen(false)}
        onSubmit={handleCancel}
      />
    </Drawer>
  )
}