import { useCallback, useEffect, useState } from 'react'
import { Alert, App, Button, Card, Descriptions, Drawer, Flex, Image, Skeleton, Space, Tag, Typography } from 'antd'
import { FileSearchOutlined } from '@ant-design/icons'
import { getComplaintDetail, handleComplaint } from '../../api/complaints'
import type { ComplaintDetail, HandleComplaintInput } from '../../api/complaints'
import type { ApiError } from '../../api/client'
import { COMPLAINT_SOURCE, COMPLAINT_STATUS, COMPLAINT_TYPE, complaintTitle } from '../../constants/complaints'
import { ORDER_STATUS, formatDateTime, formatMoney } from '../../constants/order'
import OrderDetailDrawer from '../orders/OrderDetailDrawer'
import ComplaintHandleForm from './ComplaintHandleForm'

type Props = { complaintId: string | null; onClose: () => void; onChanged: () => void }

export default function ComplaintDetailDrawer({ complaintId, onClose, onChanged }: Props) {
  const { message } = App.useApp()
  const [data, setData] = useState<ComplaintDetail>()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  const load = useCallback(async (id: string) => {
    setLoading(true)
    try {
      setData(await getComplaintDetail(id))
    } catch (e) {
      message.error((e as ApiError).message)
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    if (complaintId) {
      setData(undefined)
      load(complaintId)
    }
  }, [complaintId, load])

  const submit = async (values: HandleComplaintInput) => {
    if (!complaintId) return
    setSaving(true)
    try {
      const res = await handleComplaint(complaintId, values)
      message.success(res.message)
      onChanged()
      load(complaintId)
    } catch (e) {
      message.error((e as ApiError).message)
    } finally {
      setSaving(false)
    }
  }

  const closed = data && ['resolved', 'rejected'].includes(data.status)
  const inWarranty = data?.warranty_until ? new Date(data.warranty_until) > new Date(data.created_at) : false

  return (
    <Drawer title="Chi tiết khiếu nại" size="large" open={!!complaintId} onClose={onClose}>
      {loading || !data ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <Flex vertical gap={16}>
          <Flex vertical gap={8}>
            <Space wrap>
              <Tag color={COMPLAINT_SOURCE[data.source].color}>{COMPLAINT_SOURCE[data.source].label}</Tag>
              {data.source === 'customer' && <Tag color={COMPLAINT_TYPE[data.type].color}>{COMPLAINT_TYPE[data.type].label}</Tag>}
              <Tag color={COMPLAINT_STATUS[data.status].color}>{COMPLAINT_STATUS[data.status].label}</Tag>
            </Space>
            <Typography.Title level={4}>{complaintTitle(data.title)}</Typography.Title>
            {data.content !== complaintTitle(data.title) && <Typography.Paragraph>{data.content}</Typography.Paragraph>}
            <Typography.Text type="secondary">
              {data.source === 'worker' ? `Thợ ${data.reporter_name ?? data.worker_name ?? ''}` : `Khách ${data.customer_name}`} gửi lúc{' '}
              {formatDateTime(data.created_at)}
            </Typography.Text>
          </Flex>

          {data.image_urls.length > 0 && (
            <Image.PreviewGroup>
              <Space wrap>
                {data.image_urls.map((url) => (
                  <Image key={url} src={url} width={120} height={90} />
                ))}
              </Space>
            </Image.PreviewGroup>
          )}

          {data.source === 'worker' && (
            <Alert
              type="warning"
              showIcon
              title="Báo cáo sự cố do thợ gửi từ app thợ"
              description="Khách không nhìn thấy báo cáo này. Kết quả xử lý sẽ được gửi thông báo cho thợ, thợ xem lại trong mục Báo cáo sự cố."
            />
          )}

          {data.type === 'warranty' && data.source === 'customer' && (
            <Alert
              type={inWarranty ? 'success' : 'warning'}
              showIcon
              title={inWarranty ? 'Còn trong thời hạn bảo hành' : 'Đã hết hoặc không có bảo hành'}
              description={`Bảo hành đến: ${formatDateTime(data.warranty_until)}`}
            />
          )}

          <Card
            size="small"
            title={`Đơn hàng ${data.order_code}`}
            extra={
              <Button size="small" icon={<FileSearchOutlined />} onClick={() => setOrderId(data.order_id)}>
                Xem đơn
              </Button>
            }
          >
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Dịch vụ">{data.service_name}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái đơn">
                <Tag color={ORDER_STATUS[data.order_status].color}>{ORDER_STATUS[data.order_status].label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thành tiền">{formatMoney(data.order_price)}</Descriptions.Item>
              <Descriptions.Item label="Hoàn thành lúc">{formatDateTime(data.order_completed_at)}</Descriptions.Item>
              <Descriptions.Item label="Khách hàng">{data.customer_name} · {data.customer_phone ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Thợ">
                {data.worker_name ? `${data.worker_name} · ${data.worker_phone ?? '—'}` : '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {closed ? (
            <Alert
              type={data.status === 'resolved' ? 'success' : 'info'}
              showIcon
              title={`${COMPLAINT_STATUS[data.status].label} bởi ${data.handled_by_name ?? '—'} lúc ${formatDateTime(data.resolved_at)}`}
              description={data.resolution}
            />
          ) : (
            <>
              {data.resolution && <Alert type="info" showIcon title="Ghi chú trước đó" description={data.resolution} />}
              <ComplaintHandleForm key={data.status} loading={saving} onSubmit={submit} audience={data.source === 'worker' ? 'thợ' : 'khách'} />
            </>
          )}
        </Flex>
      )}

      <OrderDetailDrawer orderId={orderId} onClose={() => setOrderId(null)} onChanged={() => complaintId && load(complaintId)} />
    </Drawer>
  )
}