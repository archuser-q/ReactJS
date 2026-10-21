import { Card, Col, Row, Statistic, Typography } from 'antd'
import { AlertOutlined, ClockCircleOutlined, IdcardOutlined, WalletOutlined } from '@ant-design/icons'
import { useNavigate } from '@tanstack/react-router'
import type { FileRouteTypes } from '../../routeTree.gen'
import type { PendingCounts } from '../../api/dashboard'
import { formatMoney } from '../../constants/order'

/** Việc cần admin xử lý — phát sinh từ app thợ (hồ sơ, rút tiền, báo cáo sự cố) và app khách (khiếu nại) */
export default function PendingTasks({ pending }: { pending: PendingCounts }) {
  const navigate = useNavigate()
  const items: { title: string; value: number; icon: React.ReactNode; to: FileRouteTypes['to']; sub?: string }[] = [
    { title: 'Hồ sơ thợ cần duyệt', value: pending.workers_to_review, icon: <IdcardOutlined />, to: '/workers' },
    {
      title: 'Lệnh rút tiền chờ duyệt',
      value: pending.withdrawals_pending,
      icon: <WalletOutlined />,
      to: '/withdrawals',
      sub: pending.withdrawals_pending ? formatMoney(pending.withdrawals_pending_amount) : undefined,
    },
    { title: 'Báo cáo sự cố của thợ', value: pending.reports_open, icon: <AlertOutlined />, to: '/complaints' },
    { title: 'Đơn đang tìm thợ', value: pending.orders_matching, icon: <ClockCircleOutlined />, to: '/monitor',
      sub: pending.orders_waiting_long ? `${pending.orders_waiting_long} đơn chờ quá 5 phút` : undefined },
  ]

  return (
    <Row gutter={[16, 16]}>
      {items.map((it) => (
        <Col key={it.title} xs={24} sm={12} xl={6}>
          <Card hoverable size="small" onClick={() => navigate({ to: it.to })}>
            <Statistic
              title={it.title}
              value={it.value}
              prefix={it.icon}
              styles={it.value > 0 ? { content: { color: '#d4380d' } } : undefined}
            />
            <Typography.Text type="secondary">{it.sub ?? (it.value ? 'Bấm để xử lý' : 'Không có việc tồn đọng')}</Typography.Text>
          </Card>
        </Col>
      ))}
    </Row>
  )
}
