import { createFileRoute } from '@tanstack/react-router'
import { Flex, Typography } from 'antd'
import { getOverview, getPending } from '../../api/dashboard'
import StatCards from '../../components/dashboard/StatCards'
import RecentOrdersTable from '../../components/dashboard/RecentOrdersTable'
import PendingTasks from '../../components/dashboard/PendingTasks'

export const Route = createFileRoute('/_admin/')({
  loader: async () => {
    const [overview, pending] = await Promise.all([getOverview(), getPending()])
    return { ...overview, pending }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { stats, recentOrders, pending } = Route.useLoaderData()

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={3}>Tổng quan</Typography.Title>
      <StatCards stats={stats} />
      <Typography.Title level={5} style={{ margin: 0 }}>
        Việc cần xử lý
      </Typography.Title>
      <PendingTasks pending={pending} />
      <RecentOrdersTable orders={recentOrders} />
    </Flex>
  )
}
