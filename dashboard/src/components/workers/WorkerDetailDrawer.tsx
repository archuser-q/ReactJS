import { useCallback, useEffect, useState } from 'react'
import {
  Alert, App, Avatar, Button, Card, Col, Descriptions, Drawer, Empty, Flex, Image, Rate, Row,
  Skeleton, Space, Statistic, Tag, Typography,
} from 'antd'
import { CheckOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons'
import { getWorkerDetail, reviewWorker } from '../../api/workers'
import type { WorkerDetail } from '../../api/workers'
import type { ApiError } from '../../api/client'
import { USER_STATUS } from '../../constants/user'
import { DOCUMENT_TYPE, VERIFICATION } from '../../constants/worker'
import RejectWorkerModal from './RejectWorkerModal'

type Props = { workerId: string | null; onClose: () => void; onChanged: () => void }

const formatDate = (v: string | null) => (v ? new Date(v).toLocaleString('vi-VN') : '—')
const percent = (v: number) => `${Math.round(v * 100)}%`

export default function WorkerDetailDrawer({ workerId, onClose, onChanged }: Props) {
  const { message } = App.useApp()
  const [data, setData] = useState<WorkerDetail>()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const load = useCallback(async (id: string) => {
    setLoading(true)
    try {
      setData(await getWorkerDetail(id))
    } catch (e) {
      message.error((e as ApiError).message)
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    if (workerId) {
      setData(undefined)
      load(workerId)
    }
  }, [workerId, load])

  const submitReview = async (status: 'approved' | 'rejected', note?: string) => {
    if (!workerId) return
    setSubmitting(true)
    try {
      const res = await reviewWorker(workerId, status, note)
      message.success(res.message)
      setRejectOpen(false)
      onChanged()
      load(workerId)
    } catch (e) {
      message.error((e as ApiError).message)
    } finally {
      setSubmitting(false)
    }
  }

  const w = data?.worker

  return (
    <Drawer
      title="Chi tiết thợ"
      size="large"
      open={!!workerId}
      onClose={onClose}
      extra={
        w && (
          <Space>
            {w.verification_status !== 'rejected' && (
              <Button danger icon={<CloseOutlined />} onClick={() => setRejectOpen(true)}>
                Từ chối
              </Button>
            )}
            {w.verification_status !== 'approved' && (
              <Button type="primary" icon={<CheckOutlined />} loading={submitting} onClick={() => submitReview('approved')}>
                Duyệt hồ sơ
              </Button>
            )}
          </Space>
        )
      }
    >
      {loading || !data || !w ? (
        <Skeleton active avatar paragraph={{ rows: 10 }} />
      ) : (
        <Flex vertical gap={16}>
          <Flex align="center" gap={16}>
            <Avatar size={64} src={w.avatar_url ?? undefined} icon={<UserOutlined />} />
            <Flex vertical gap={4}>
              <Typography.Title level={4}>{w.full_name}</Typography.Title>
              <Space wrap>
                <Tag color={VERIFICATION[w.verification_status].color}>{VERIFICATION[w.verification_status].label}</Tag>
                <Tag color={USER_STATUS[w.status].color}>{USER_STATUS[w.status].label}</Tag>
                <Tag color={w.is_online ? 'green' : 'default'}>{w.is_online ? 'Đang trực tuyến' : 'Ngoại tuyến'}</Tag>
                {w.is_flagged && <Tag color="red">Bị gắn cờ bất thường</Tag>}
              </Space>
            </Flex>
          </Flex>

          {w.verification_status === 'rejected' && w.verification_note && (
            <Alert type="error" showIcon title="Lý do từ chối" description={w.verification_note} />
          )}

          <Row gutter={[12, 12]}>
            <Col span={12} md={6}>
              <Card size="small">
                <Statistic title="Điểm tin cậy" value={w.trust_score} precision={2} />
              </Card>
            </Col>
            <Col span={12} md={6}>
              <Card size="small">
                <Statistic title="Việc hoàn thành" value={data.stats.completed_orders} />
              </Card>
            </Col>
            <Col span={12} md={6}>
              <Card size="small">
                <Statistic title="Tỉ lệ nhận đơn" value={percent(w.acceptance_rate)} />
              </Card>
            </Col>
            <Col span={12} md={6}>
              <Card size="small">
                <Statistic title="Doanh thu" value={data.stats.total_revenue} suffix="₫" groupSeparator="." />
              </Card>
            </Col>
          </Row>

          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Số điện thoại">{w.phone ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Email">{w.email ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Đánh giá">
              <Space>
                <Rate disabled allowHalf value={w.rating_avg} />
                <Typography.Text type="secondary">{w.rating_avg.toFixed(1)} ({w.rating_count} lượt)</Typography.Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Kinh nghiệm">{w.experience_years} năm</Descriptions.Item>
            <Descriptions.Item label="Kỹ năng">
              {data.skills.length ? data.skills.map((s) => <Tag key={s.id}>{s.name}</Tag>) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Bán kính nhận việc">{w.service_radius_km} km</Descriptions.Item>
            <Descriptions.Item label="Tỉ lệ hủy">{percent(w.cancel_rate)}</Descriptions.Item>
            <Descriptions.Item label="Giới thiệu">{w.bio ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày đăng ký">{formatDate(w.created_at)}</Descriptions.Item>
            <Descriptions.Item label="Duyệt lúc">{formatDate(w.verified_at)}</Descriptions.Item>
          </Descriptions>

          <Card size="small" title={`Giấy tờ (${data.documents.length})`}>
            {data.documents.length === 0 ? (
              <Typography.Text type="secondary">Thợ chưa tải giấy tờ</Typography.Text>
            ) : (
              <Image.PreviewGroup>
                <Row gutter={[12, 12]}>
                  {data.documents.map((d) => (
                    <Col key={d.id} xs={12} md={8}>
                      <Flex vertical gap={4}>
                        <Image src={d.file_url} height={120} />
                        <Typography.Text>{DOCUMENT_TYPE[d.doc_type]}</Typography.Text>
                        <div>
                          <Tag color={VERIFICATION[d.status].color}>{VERIFICATION[d.status].label}</Tag>
                        </div>
                      </Flex>
                    </Col>
                  ))}
                </Row>
              </Image.PreviewGroup>
            )}
          </Card>

          <Card size="small" title="Đánh giá gần đây">
            {data.recentReviews.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đánh giá" />
            ) : (
              <Flex vertical gap={12}>
                {data.recentReviews.map((r) => (
                  <Flex key={r.id} vertical gap={4}>
                    <Flex justify="space-between" wrap gap={8}>
                      <Space>
                        <Typography.Text strong>{r.customer_name}</Typography.Text>
                        <Rate disabled value={r.rating} />
                      </Space>
                      <Typography.Text type="secondary">{new Date(r.created_at).toLocaleDateString('vi-VN')}</Typography.Text>
                    </Flex>
                    <Typography.Text>{r.comment ?? 'Không có nhận xét'}</Typography.Text>
                  </Flex>
                ))}
              </Flex>
            )}
          </Card>
        </Flex>
      )}

      <RejectWorkerModal
        open={rejectOpen}
        loading={submitting}
        onCancel={() => setRejectOpen(false)}
        onSubmit={(note) => submitReview('rejected', note)}
      />
    </Drawer>
  )
}