import { Card, Col, Row, Statistic } from 'antd'
import type { Report } from '../../api/reports'

const percent = (part: number, total: number) => (total ? Math.round((part / total) * 1000) / 10 : 0)

export default function ReportSummary({ summary }: { summary: Report['summary'] }) {
  const items = [
    { title: 'Tổng đơn', value: summary.total_orders },
    { title: 'Tỉ lệ hoàn thành', value: percent(summary.completed_orders, summary.total_orders), suffix: '%' },
    { title: 'Tỉ lệ hủy', value: percent(summary.cancelled_orders, summary.total_orders), suffix: '%' },
    { title: 'Doanh thu (GMV)', value: summary.revenue, suffix: '₫' },
    { title: 'Hoa hồng nền tảng', value: summary.commission, suffix: '₫' },
    { title: 'Giá trị TB / đơn', value: Math.round(summary.avg_order_value), suffix: '₫' },
  ]

  return (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col key={item.title} xs={24} sm={12} md={8} xl={4}>
          <Card size="small">
            <Statistic title={item.title} value={item.value} suffix={item.suffix} groupSeparator="." decimalSeparator="," />
          </Card>
        </Col>
      ))}
    </Row>
  )
}