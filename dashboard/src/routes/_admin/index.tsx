import { createFileRoute } from '@tanstack/react-router'
import { Flex, Typography } from 'antd'
import { getOverview } from '../../api/dashboard'
import StatCards from '../../components/dashboard/StatCards'
import RecentOrdersTable from '../../components/dashboard/RecentOrdersTable'

export const Route = createFileRoute('/_admin/')({
  loader: () => getOverview(),
  component: DashboardPage,
})

function DashboardPage() {
  const { stats, recentOrders } = Route.useLoaderData()

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={3}>Tổng quan</Typography.Title>
      <StatCards stats={stats} />
      <RecentOrdersTable orders={recentOrders} />
    </Flex>
  )
}