import { createFileRoute } from '@tanstack/react-router'
import { Typography } from 'antd'

export const Route = createFileRoute('/')({
  component: () => <Typography.Title>Trang chủ</Typography.Title>,
})