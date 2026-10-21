import { Card, Col, Empty, Image, Row, Space, Typography } from 'antd'
import type { OrderDetail } from '../../api/orders'

/** Ảnh thợ chụp trên app thợ trước và sau khi sửa (bằng chứng khi khách khiếu nại) */
export default function OrderPhotosCard({ photos }: { photos: OrderDetail['photos'] }) {
  const groups = [
    { kind: 'before' as const, title: 'Trước khi sửa' },
    { kind: 'after' as const, title: 'Sau khi sửa' },
  ]

  return (
    <Card size="small" title="Ảnh thợ chụp khi làm">
      {photos.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Thợ chưa chụp ảnh" />
      ) : (
        <Image.PreviewGroup>
          <Row gutter={[16, 12]}>
            {groups.map((g) => {
              const list = photos.filter((p) => p.kind === g.kind)
              return (
                <Col key={g.kind} xs={24} md={12}>
                  <Typography.Text strong>
                    {g.title} ({list.length})
                  </Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    {list.length ? (
                      <Space wrap>
                        {list.map((p) => (
                          <Image key={p.id} src={p.url} width={90} height={90} style={{ objectFit: 'cover' }} />
                        ))}
                      </Space>
                    ) : (
                      <Typography.Text type="secondary">Không có</Typography.Text>
                    )}
                  </div>
                </Col>
              )
            })}
          </Row>
        </Image.PreviewGroup>
      )}
    </Card>
  )
}
