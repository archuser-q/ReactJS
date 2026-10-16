import { Card, Empty } from 'antd'
import { Column } from '@ant-design/plots'
import type { Report } from '../../api/reports'
import { CHART_COLORS, formatPeriod, shortMoney } from '../../constants/chart'

export default function RevenueChart({ report }: { report: Report }) {
  const data = report.timeline.map((t) => ({ period: formatPeriod(t.period, report.groupBy), revenue: t.revenue }))
  const hasData = data.some((d) => d.revenue > 0)

  return (
    <Card size="small" title="Doanh thu">
      {hasData ? (
        <Column
          height={280}
          data={data}
          xField="period"
          yField="revenue"
          style={{ fill: CHART_COLORS.primary, radiusTopLeft: 4, radiusTopRight: 4, maxWidth: 32 }}
          axis={{
            x: { title: false, labelAutoHide: true, labelAutoRotate: false },
            y: { title: false, labelFormatter: shortMoney, grid: true, gridLineDash: [0, 0], gridStrokeOpacity: 0.08 },
          }}
          tooltip={{ items: [{ channel: 'y', name: 'Doanh thu', valueFormatter: (v: number) => `${v.toLocaleString('vi-VN')} ₫` }] }}
        />
      ) : (
        <Empty description="Không có doanh thu trong khoảng này" />
      )}
    </Card>
  )
}