import { useCallback, useEffect, useState } from 'react'
import {
  Alert, App, Avatar, Button, Card, Col, Descriptions, Drawer, Empty, Flex, Popconfirm, Rate, Row,
  Skeleton, Space, Statistic, Tag, Tooltip, Typography,
} from 'antd'
import { CheckOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons'
import { getWorkerDetail, reviewWorker } from '../../api/workers'
import type { WorkerDetail } from '../../api/workers'
import type { ApiError } from '../../api/client'
import { USER_STATUS } from '../../constants/user'
import { DOCUMENT_TYPE, REQUIRED_DOCS } from '../../constants/worker'
import { formatDateTime, formatMoney } from '../../constants/order'
import RejectWorkerModal from './RejectWorkerModal'
import DocumentReview from './DocumentReview'
import VerificationTag from './VerificationTag'

type Props = { workerId: string | null; onClose: () => void; onChanged: () => void }

const percent = (v: number) => `${Math.round(v * 100)}%`

export default function WorkerDetailDrawer({ workerId, onClose, onChanged }: Props) {
  const { message } = App.useApp()
  const [data, setData] = useState<WorkerDetail>()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const load = useCallback(async (id: string, silent = false) => {
    if (!silent) setLoading(true)
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

  const refresh = () => {
    onChanged()
    if (workerId) load(workerId, true)
  }

  const submitReview = async (status: 'approved' | 'rejected', note?: string) => {
    if (!workerId) return
    setSubmitting(true)
    try {
      const res = await reviewWorker(workerId, status, note)
      message.success(res.message)
      setRejectOpen(false)
      refresh()
    } catch (e) {
      message.error((e as ApiError).message)
    } finally {
      setSubmitting(false)
    }
  }

  const w = data?.worker
  const current = data?.documents.filter((d) => d.is_current) ?? []
  // Giấy bắt buộc chưa có bản dùng được (chưa tải, hoặc bản mới nhất bị từ chối và không còn bản đã duyệt)
  const blocking = REQUIRED_DOCS.filter((t) => {
    const docs = data?.documents.filter((d) => d.doc_type === t) ?? []
    return !docs.some((d) => d.status === 'approved' || (d.status === 'pending' && d.is_current))
  })
  const rejectedNote = current
    .filter((d) => d.status === 'rejected' && d.reject_reason)
    .map((d) => `${DOCUMENT_TYPE[d.doc_type]}: ${d.reject_reason}`)
    .join('\n')

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
                {w.verification_status === 'approved' ? 'Thu hồi duyệt' : 'Từ chối hồ sơ'}
              </Button>
            )}
            {w.verification_status !== 'approved' && (
              <Tooltip title={blocking.length ? `Còn thiếu giấy hợp lệ: ${blocking.map((t) => DOCUMENT_TYPE[t]).join(', ')}` : undefined}>
                <Popconfirm
                  title="Duyệt hồ sơ thợ này?"
                  description="Các giấy tờ đang chờ sẽ được duyệt luôn. Thợ có thể bật nhận đơn ngay."
                  okText="Duyệt"
                  cancelText="Hủy"
                  disabled={blocking.length > 0}
                  onConfirm={() => submitReview('approved')}
                >
                  <Button type="primary" icon={<CheckOutlined />} loading={submitting} disabled={blocking.length > 0}>
                    Duyệt hồ sơ
                  </Button>
                </Popconfirm>
              </Tooltip>
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
              <Typography.Title level={4} style={{ margin: 0 }}>{w.full_name}</Typography.Title>
              <Space wrap>
                <VerificationTag w={w} />
                <Tag color={USER_STATUS[w.status].color}>{USER_STATUS[w.status].label}</Tag>
                <Tag color={w.is_busy ? 'orange' : w.is_online ? 'green' : 'default'}>
                  {w.is_busy ? 'Đang làm đơn' : w.is_online ? 'Đang nhận đơn' : 'Ngoại tuyến'}
                </Tag>
                {w.is_flagged && <Tag color="red">Bị gắn cờ bất thường</Tag>}
              </Space>
            </Flex>
          </Flex>

          {w.verification_status === 'pending' && !w.submitted_at && (
            <Alert
              type="info"
              showIcon
              title="Thợ đang hoàn thiện hồ sơ trên app"
              description="Thợ chưa bấm “Gửi hồ sơ xét duyệt”. Có thể xem trước giấy tờ, nhưng nên đợi thợ gửi rồi mới duyệt."
            />
          )}
          {w.verification_status === 'pending' && w.submitted_at && (
            <Alert type="warning" showIcon title={`Thợ gửi hồ sơ lúc ${formatDateTime(w.submitted_at)}, đang chờ duyệt`} />
          )}
          {w.verification_status === 'rejected' && w.verification_note && (
            <Alert type="error" showIcon title="Lý do từ chối hồ sơ" description={w.verification_note} />
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

          <DocumentReview
            workerId={w.id}
            documents={data.documents}
            workerApproved={w.verification_status === 'approved'}
            onChanged={refresh}
          />

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
            <Descriptions.Item label="Nhóm dịch vụ">
              {data.skills.length ? data.skills.map((s) => <Tag key={s.id}>{s.name} · {s.years} năm</Tag>) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Bán kính nhận việc">{w.service_radius_km} km</Descriptions.Item>
            <Descriptions.Item label="Vị trí cập nhật">{formatDateTime(w.location_updated_at)}</Descriptions.Item>
            <Descriptions.Item label="Tỉ lệ hủy">{percent(w.cancel_rate)}</Descriptions.Item>
            <Descriptions.Item label="Số dư ví">
              <Typography.Text type={w.wallet_balance < 0 ? 'danger' : undefined}>{formatMoney(w.wallet_balance)}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tài khoản nhận tiền">
              {data.bankAccount
                ? `${data.bankAccount.bank_name} · ${data.bankAccount.account_number} · ${data.bankAccount.account_holder}`
                : 'Chưa liên kết'}
            </Descriptions.Item>
            <Descriptions.Item label="Giới thiệu">{w.bio ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày đăng ký">{formatDateTime(w.created_at)}</Descriptions.Item>
            <Descriptions.Item label="Gửi hồ sơ">{formatDateTime(w.submitted_at)}</Descriptions.Item>
            <Descriptions.Item label="Duyệt lúc">
              {formatDateTime(w.verified_at)}
              {w.verified_by_name && ` · ${w.verified_by_name}`}
            </Descriptions.Item>
          </Descriptions>

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
        initialNote={rejectedNote}
        onCancel={() => setRejectOpen(false)}
        onSubmit={(note) => submitReview('rejected', note)}
      />
    </Drawer>
  )
}
