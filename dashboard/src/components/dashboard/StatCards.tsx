import { Card, Col, Row, Statistic } from 'antd'
import { DollarOutlined, ShoppingCartOutlined, TeamOutlined, WarningOutlined } from '@ant-design/icons'
import type { OverviewStats } from '../../api/dashboard'

export default function StatCards({ stats }: { stats: OverviewStats }) {
  const items = [
    { title: 'Doanh thu tháng này', value: stats.revenue_month, suffix: '₫', icon: <DollarOutlined /> },
    { title: 'Đơn hàng hôm nay', value: stats.orders_today, icon: <ShoppingCartOutlined /> },
    { title: 'Thợ đang trực tuyến', value: stats.workers_online, icon: <TeamOutlined /> },
    { title: 'Khiếu nại chưa xử lý', value: stats.open_complaints, icon: <WarningOutlined /> },
  ]

  return (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col key={item.title} xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title={item.title}
              value={item.value}
              prefix={item.icon}
              suffix={item.suffix}
              groupSeparator="."
            />
          </Card>
        </Col>
      ))}
    </Row>
  )
}