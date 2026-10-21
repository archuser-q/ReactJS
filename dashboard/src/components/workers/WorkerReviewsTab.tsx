import { useCallback } from 'react'
import { Button, Card, Col, Empty, Flex, Image, Pagination, Progress, Rate, Row, Space, Spin, Tag, Typography } from 'antd'
import { listWorkerReviews } from '../../api/workers'
import type { WorkerReviewParams } from '../../api/workers'
import { usePagedList } from '../../hooks/usePagedList'
import { formatDateTime } from '../../constants/order'

type Props = { workerId: string; onOpenOrder: (id: string) => void }

const STARS = [5, 4, 3, 2, 1] as const

/** Toàn bộ đánh giá của thợ: phân bố số sao (bấm để lọc) + danh sách phân trang */
export default function WorkerReviewsTab({ workerId, onOpenOrder }: Props) {
  const fetcher = useCallback((p: WorkerReviewParams) => listWorkerReviews(workerId, p), [workerId])
  const initial: WorkerReviewParams = { page: 1, pageSize: 10 }
  const { params, data, loading, updateParams } = usePagedList(fetcher, initial)
  const s = data?.summary

  return (
    <Flex vertical gap={16}>
      <Card size="small">
        <Row gutter={24} align="middle">
          <Col xs={24} sm={8}>
            <Flex vertical align="center">
              <Typography.Title level={2} style={{ margin: 0 }}>
                {s?.average?.toFixed(1) ?? '—'}
              </Typography.Title>
              <Rate disabled allowHalf value={s?.average ?? 0} />
              <Typography.Text type="secondary">{s?.count ?? 0} đánh giá</Typography.Text>
            </Flex>
          </Col>
          <Col xs={24} sm={16}>
            {STARS.map((n) => {
              const c = s?.distribution[n] ?? 0
              const selected = params.rating === n
              return (
                <Button
                  key={n}
                  type={selected ? 'primary' : 'text'}
                  ghost={selected}
                  block
                  size="small"
                  onClick={() => updateParams({ rating: selected ? undefined : n })}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <Flex align="center" gap={8} style={{ width: '100%' }}>
                    <span style={{ width: 36 }}>{n} ★</span>
                    <Progress percent={s?.count ? Math.round((c / s.count) * 100) : 0} showInfo={false} size="small" style={{ flex: 1, margin: 0 }} />
                    <span style={{ width: 32, textAlign: 'right' }}>{c}</span>
                  </Flex>
                </Button>
              )
            })}
          </Col>
        </Row>
      </Card>

      {params.rating && (
        <Space>
          <Tag closable onClose={() => updateParams({ rating: undefined })} color="gold">
            Đang lọc: {params.rating} sao
          </Tag>
        </Space>
      )}

      <Spin spinning={loading}>
        {data && data.items.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đánh giá" />
        ) : (
          <Flex vertical gap={12}>
            {data?.items.map((r) => (
              <Card key={r.id} size="small">
                <Flex vertical gap={4}>
                  <Flex justify="space-between" wrap gap={8}>
                    <Space wrap>
                      <Typography.Text strong>{r.customer_name}</Typography.Text>
                      <Rate disabled value={r.rating} style={{ fontSize: 14 }} />
                      {r.is_flagged && <Tag color="red">Nghi ngờ bất thường{r.flag_reason ? `: ${r.flag_reason}` : ''}</Tag>}
                    </Space>
                    <Typography.Text type="secondary">{formatDateTime(r.created_at)}</Typography.Text>
                  </Flex>
                  <Typography.Text>{r.comment ?? <Typography.Text type="secondary">Không có nhận xét</Typography.Text>}</Typography.Text>
                  {r.image_urls.length > 0 && (
                    <Image.PreviewGroup>
                      <Space wrap>
                        {r.image_urls.map((u) => (
                          <Image key={u} src={u} width={64} height={64} style={{ objectFit: 'cover' }} />
                        ))}
                      </Space>
                    </Image.PreviewGroup>
                  )}
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {r.service_name} · đơn <Typography.Link onClick={() => onOpenOrder(r.order_id)}>{r.order_code}</Typography.Link>
                  </Typography.Text>
                </Flex>
              </Card>
            ))}
          </Flex>
        )}
      </Spin>

      {!!data?.total && (
        <Flex justify="end">
          <Pagination
            current={params.page}
            pageSize={params.pageSize}
            total={data.total}
            showSizeChanger
            pageSizeOptions={[10, 20, 50]}
            showTotal={(t) => `${t} đánh giá`}
            onChange={(page, pageSize) => updateParams({ page, pageSize })}
          />
        </Flex>
      )}
    </Flex>
  )
}
