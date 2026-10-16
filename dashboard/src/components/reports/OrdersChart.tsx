import { Card, Empty } from 'antd'
import { Line } from '@ant-design/plots'
import type { Report } from '../../api/reports'
import { CHART_COLORS, formatPeriod } from '../../constants/chart'

const SERIES = { completed: 'Hoàn thành', cancelled: 'Đã hủy' }

export default function OrdersChart({ report }: { report: Report }) {
  const data = report.timeline.flatMap((t) => {
    const period = formatPeriod(t.period, report.groupBy)
    return [
      { period, series: SERIES.completed, value: t.completed_orders },
      { period, series: SERIES.cancelled, value: t.cancelled_orders },
    ]
  })
  const hasData = report.timeline.some((t) => t.total_orders > 0)

  return (
    <Card size="small" title="Số đơn hoàn thành và bị hủy">
      {hasData ? (
        <Line
          height={280}
          data={data}
          xField="period"
          yField="value"
          colorField="series"
          scale={{ color: { domain: [SERIES.completed, SERIES.cancelled], range: [CHART_COLORS.primary, CHART_COLORS.secondary] } }}
          style={{ lineWidth: 2 }}
          point={{ shapeField: 'circle', sizeField: 3 }}
          axis={{
            x: { title: false, labelAutoHide: true, labelAutoRotate: false },
            y: { title: false, grid: true, gridLineDash: [0, 0], gridStrokeOpacity: 0.08 },
          }}
          legend={{ color: { position: 'top', layout: { justifyContent: 'flex-start' } } }}
        />
      ) : (
        <Empty description="Không có đơn trong khoảng này" />
      )}
    </Card>
  )
}