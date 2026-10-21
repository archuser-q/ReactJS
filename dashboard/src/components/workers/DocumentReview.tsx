import { useState } from 'react'
import { App, Button, Card, Col, Empty, Flex, Form, Image, Input, Modal, Row, Space, Tag, Tooltip, Typography } from 'antd'
import { CheckOutlined, CloseOutlined, HistoryOutlined } from '@ant-design/icons'
import { reviewDocument } from '../../api/workers'
import type { DocumentType, WorkerDocument } from '../../api/workers'
import type { ApiError } from '../../api/client'
import { DOCUMENT_TYPE, DOC_REJECT_REASONS, REQUIRED_DOCS, VERIFICATION } from '../../constants/worker'
import { formatDateTime } from '../../constants/order'

type Props = {
  workerId: string
  documents: WorkerDocument[]
  /** Thợ đã được duyệt: kết quả từng giấy được báo ngay cho thợ */
  workerApproved: boolean
  onChanged: () => void
}

const ORDER: DocumentType[] = ['id_card_front', 'id_card_back', 'portrait', 'certificate', 'other']

/**
 * Duyệt từng giấy tờ. Từ chối giấy nào thì ghi lý do cho đúng giấy đó (worker_documents.reject_reason):
 * app thợ hiện lý do theo từng giấy và thợ chỉ phải tải lại giấy bị từ chối.
 */
export default function DocumentReview({ workerId, documents, workerApproved, onChanged }: Props) {
  const { message } = App.useApp()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<WorkerDocument | null>(null)
  const [form] = Form.useForm<{ reason: string }>()

  const submit = async (doc: WorkerDocument, status: 'approved' | 'rejected', reason?: string) => {
    setBusyId(doc.id)
    try {
      const res = await reviewDocument(workerId, doc.id, status, reason)
      message.success(res.message)
      setRejecting(null)
      onChanged()
    } catch (e) {
      message.error((e as ApiError).message)
    } finally {
      setBusyId(null)
    }
  }

  const groups = ORDER.map((type) => ({ type, docs: documents.filter((d) => d.doc_type === type) })).filter(
    (g) => g.docs.length || REQUIRED_DOCS.includes(g.type),
  )

  return (
    <Card
      size="small"
      title="Giấy tờ xác minh"
      extra={
        <Typography.Text type="secondary">
          {workerApproved ? 'Kết quả từng giấy được báo ngay cho thợ' : 'Thợ được báo khi bạn chốt cả hồ sơ'}
        </Typography.Text>
      }
    >
      <Image.PreviewGroup>
        <Flex vertical gap={16}>
          {groups.map(({ type, docs }) => {
            const current = docs.filter((d) => d.is_current)
            const older = docs.filter((d) => !d.is_current)
            return (
              <Flex key={type} vertical gap={8}>
                <Space>
                  <Typography.Text strong>{DOCUMENT_TYPE[type]}</Typography.Text>
                  {REQUIRED_DOCS.includes(type) ? <Tag>Bắt buộc</Tag> : <Tag color="default">Không bắt buộc</Tag>}
                </Space>
                {docs.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Thợ chưa tải lên" style={{ margin: 0 }} />
                ) : (
                  <Row gutter={[12, 12]}>
                    {[...current, ...older].map((d) => (
                      <Col key={d.id} xs={24} sm={12}>
                        <Card size="small" styles={{ body: { padding: 8 } }} style={d.is_current ? undefined : { opacity: 0.65 }}>
                          <Flex gap={12}>
                            <Image src={d.file_url} width={120} height={90} style={{ objectFit: 'cover', borderRadius: 4 }} />
                            <Flex vertical gap={4} style={{ minWidth: 0, flex: 1 }}>
                              <Space size={4} wrap>
                                <Tag color={VERIFICATION[d.status].color}>{VERIFICATION[d.status].label}</Tag>
                                {!d.is_current && (
                                  <Tooltip title="Thợ đã gửi bản mới hơn">
                                    <Tag icon={<HistoryOutlined />}>Bản cũ</Tag>
                                  </Tooltip>
                                )}
                              </Space>
                              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                Gửi {formatDateTime(d.created_at)}
                              </Typography.Text>
                              {d.reviewed_at && (
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                  Duyệt {formatDateTime(d.reviewed_at)}
                                  {d.reviewed_by_name && ` · ${d.reviewed_by_name}`}
                                </Typography.Text>
                              )}
                              {d.status === 'rejected' && d.reject_reason && (
                                <Typography.Text type="danger" style={{ fontSize: 12 }}>
                                  Lý do: {d.reject_reason}
                                </Typography.Text>
                              )}
                              {d.status === 'pending' && (
                                <Space size={4} style={{ marginTop: 'auto' }}>
                                  <Button
                                    size="small"
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    loading={busyId === d.id}
                                    onClick={() => submit(d, 'approved')}
                                  >
                                    Hợp lệ
                                  </Button>
                                  <Button size="small" danger icon={<CloseOutlined />} onClick={() => setRejecting(d)}>
                                    Từ chối
                                  </Button>
                                </Space>
                              )}
                            </Flex>
                          </Flex>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </Flex>
            )
          })}
        </Flex>
      </Image.PreviewGroup>

      <Modal
        title={rejecting ? `Từ chối ${DOCUMENT_TYPE[rejecting.doc_type]}` : ''}
        open={!!rejecting}
        okText="Từ chối giấy này"
        okButtonProps={{ danger: true, loading: !!rejecting && busyId === rejecting.id }}
        cancelText="Hủy"
        onCancel={() => setRejecting(null)}
        onOk={() => form.submit()}
        afterClose={() => form.resetFields()}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={(v) => rejecting && submit(rejecting, 'rejected', v.reason.trim())}>
          <Form.Item
            name="reason"
            label="Lý do (thợ sẽ thấy ngay dưới giấy này trên app thợ)"
            rules={[
              { required: true, whitespace: true, message: 'Vui lòng nhập lý do' },
              { max: 500, message: 'Tối đa 500 ký tự' },
            ]}
          >
            <Input.TextArea rows={3} placeholder="VD: Ảnh bị mờ, vui lòng chụp lại" />
          </Form.Item>
          <Space size={[4, 4]} wrap>
            {DOC_REJECT_REASONS.map((r) => (
              <Tag key={r} style={{ cursor: 'pointer' }} onClick={() => form.setFieldValue('reason', r)}>
                {r}
              </Tag>
            ))}
          </Space>
        </Form>
      </Modal>
    </Card>
  )
}
