import { createFileRoute } from '@tanstack/react-router'
import { Typography } from 'antd'

export const Route = createFileRoute('/_admin/')({
  component: DashboardPage,
})

function DashboardPage() {
  return <Typography.Title level={3}>Tổng quan</Typography.Title>
}