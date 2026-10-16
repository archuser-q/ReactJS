import { Card, Empty } from 'antd'
import { Bar } from '@ant-design/plots'
import type { Report } from '../../api/reports'
import { CHART_COLORS } from '../../constants/chart'

export default function CategoryChart({ categories }: { categories: Report['categories'] }) {
  const total = categories.reduce((sum, c) => sum + c.orders, 0)
  const data = categories.map((c) => ({ ...c, share: total ? Math.round((c.orders / total) * 100) : 0 }))

  return (
    <Card size="small" title="Số đơn theo danh mục">
      {data.length ? (
        <Bar
          height={Math.max(160, data.length * 44)}
          data={data}
          xField="category"
          yField="orders"
          style={{ fill: CHART_COLORS.primary, radiusTopRight: 4, radiusBottomRight: 4, maxWidth: 24 }}
          label={{
            text: (d: { orders: number; share: number }) => `${d.orders} (${d.share}%)`,
            position: 'right',
            textAlign: 'start',
            dx: 8,
          }}
          scale={{ y: { nice: true, domainMax: Math.max(...data.map((d) => d.orders)) * 1.25 } }}
          axis={{ x: { title: false }, y: false }}
          tooltip={{
            items: [
              { channel: 'y', name: 'Số đơn' },
              { field: 'revenue', name: 'Doanh thu', valueFormatter: (v: number) => `${v.toLocaleString('vi-VN')} ₫` },
            ],
          }}
        />
      ) : (
        <Empty description="Không có dữ liệu" />
      )}
    </Card>
  )
}