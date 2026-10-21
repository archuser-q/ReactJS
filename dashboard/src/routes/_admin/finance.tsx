import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Card, Typography, Flex, Tabs } from 'antd'
import WithdrawalsPanel from '../../components/finance/WithdrawalsPanel'
import TransactionsPanel from '../../components/finance/TransactionsPanel'
import PaymentsPanel from '../../components/finance/PaymentsPanel'
import OrderDetailDrawer from '../../components/orders/OrderDetailDrawer'

const TABS = ['withdrawals', 'transactions', 'payments'] as const
type FinanceTab = (typeof TABS)[number]

export const Route = createFileRoute('/_admin/finance')({
  validateSearch: (s: Record<string, unknown>): { tab?: FinanceTab } => ({
    tab: TABS.includes(s.tab as FinanceTab) ? (s.tab as FinanceTab) : undefined,
  }),
  component: FinancePage,
})

/**
 * Tài chính: thợ có ví (nạp / rút / thu nhập / hoa hồng), khách KHÔNG có ví — khách trả theo từng đơn
 * (tiền mặt, MoMo, VNPay) nên chỉ có tab thanh toán để đối soát.
 */
function FinancePage() {
  const { tab = 'withdrawals' } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [orderId, setOrderId] = useState<string | null>(null)

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={3}>Tài chính</Typography.Title>
      <Card styles={{ body: { paddingTop: 8 } }}>
        <Tabs
          activeKey={tab}
          onChange={(k) => navigate({ search: { tab: k as FinanceTab } })}
          items={[
            { key: 'withdrawals', label: 'Duyệt rút tiền', children: <WithdrawalsPanel /> },
            { key: 'transactions', label: 'Giao dịch ví thợ', children: <TransactionsPanel onOpenOrder={setOrderId} /> },
            { key: 'payments', label: 'Thanh toán của khách', children: <PaymentsPanel onOpenOrder={setOrderId} /> },
          ]}
        />
      </Card>
      <OrderDetailDrawer orderId={orderId} onClose={() => setOrderId(null)} onChanged={() => undefined} />
    </Flex>
  )
}
