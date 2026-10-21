import { Button, Card, Descriptions, Space, Tag, Typography } from 'antd'
import { CloseOutlined, FileSearchOutlined, UserOutlined } from '@ant-design/icons'
import type { MapOrder, MapWorker } from '../../api/monitor'
import { ORDER_STATUS, formatDateTime, formatMoney } from '../../constants/order'
import { WORKER_STATE, ago, workerStateOf } from '../../constants/monitor'

type Props = {
  order?: MapOrder
  worker?: MapWorker
  onClose: () => void
  onOpenOrder: (id: string) => void
  onOpenWorker: (id: string) => void
}

/** Thông tin đối tượng đang chọn trên bản đồ giám sát */
export default function SelectionCard({ order, worker, onClose, onOpenOrder, onOpenWorker }: Props) {
  if (!order && !worker) return null

  if (order) {
    return (
      <Card
        size="small"
        title={`Đơn ${order.code}`}
        extra={<Button size="small" type="text" icon={<CloseOutlined />} onClick={onClose} />}
        actions={[
          <Button key="o" type="link" icon={<FileSearchOutlined />} onClick={() => onOpenOrder(order.id)}>
            Chi tiết đơn
          </Button>,
          ...(order.worker_id
            ? [
                <Button key="w" type="link" icon={<UserOutlined />} onClick={() => onOpenWorker(order.worker_id!)}>
                  Hồ sơ thợ
                </Button>,
              ]
            : []),
        ]}
      >
        <Descriptions size="small" column={1}>
          <Descriptions.Item label="Trạng thái">
            <Tag color={ORDER_STATUS[order.status].color}>{ORDER_STATUS[order.status].label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Dịch vụ">{order.service_name}</Descriptions.Item>
          <Descriptions.Item label="Khách">{order.customer_name}</Descriptions.Item>
          <Descriptions.Item label="Địa chỉ">{order.address_text}</Descriptions.Item>
          <Descriptions.Item label="Thợ">{order.worker_name ?? <Typography.Text type="secondary">Chưa có</Typography.Text>}</Descriptions.Item>
          <Descriptions.Item label="Đặt lúc">{formatDateTime(order.created_at)} ({ago(order.created_at)})</Descriptions.Item>
          {order.scheduled_at && <Descriptions.Item label="Hẹn lúc">{formatDateTime(order.scheduled_at)}</Descriptions.Item>}
          <Descriptions.Item label="Giá">{formatMoney(order.price)}</Descriptions.Item>
          {order.status === 'matching' && (
            <Descriptions.Item label="Ghép cặp">
              <Space size={4} wrap>
                <Tag>Đợt {order.dispatch_rounds ?? 0}</Tag>
                <Tag>{order.dispatch_offers ?? 0} lời mời đã gửi</Tag>
                <Tag color={order.live_offers ? 'processing' : 'default'}>{order.live_offers} đang chờ thợ</Tag>
                {order.dispatch_candidates !== null && <Tag>{order.dispatch_candidates} thợ phù hợp</Tag>}
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    )
  }

  const w = worker!
  const st = WORKER_STATE[workerStateOf(w)]
  return (
    <Card
      size="small"
      title={w.full_name}
      extra={<Button size="small" type="text" icon={<CloseOutlined />} onClick={onClose} />}
      actions={[
        <Button key="w" type="link" icon={<UserOutlined />} onClick={() => onOpenWorker(w.id)}>
          Hồ sơ thợ
        </Button>,
      ]}
    >
      <Descriptions size="small" column={1}>
        <Descriptions.Item label="Trạng thái">
          <Space size={4} wrap>
            <Tag color={st.color}>{st.label}</Tag>
            {w.is_online && !w.location_fresh && <Tag color="red">Bật nhận đơn nhưng vị trí đã cũ — không được ghép</Tag>}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="SĐT">{w.phone ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Đơn đang làm">{w.current_order_code ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Vị trí cập nhật">{ago(w.location_updated_at)}</Descriptions.Item>
        <Descriptions.Item label="Bán kính nhận việc">{w.service_radius_km} km</Descriptions.Item>
        <Descriptions.Item label="Đánh giá">{w.rating_count ? `${w.rating_avg.toFixed(1)} ★ (${w.rating_count})` : 'Chưa có'}</Descriptions.Item>
        <Descriptions.Item label="Nhóm dịch vụ">
          {w.skills.length ? w.skills.map((s) => <Tag key={s}>{s}</Tag>) : '—'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )
}
