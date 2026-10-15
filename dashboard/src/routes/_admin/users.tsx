import { createFileRoute } from '@tanstack/react-router'
import { Card, Flex, Typography } from 'antd'
import { useUserList } from '../../hooks/useUserList'
import UserFilters from '../../components/users/UserFilters'
import UserTable from '../../components/users/UserTable'
import UserDetailDrawer from '../../components/users/UserDetailDrawer'
import { useState } from 'react'

export const Route = createFileRoute('/_admin/users')({
  component: UsersPage,
})

function UsersPage() {
  const [viewingId, setViewingId] = useState<string | null>(null)
  const { params, data, loading, reload, updateParams } = useUserList({
    role: 'customer',
    page: 1,
    pageSize: 10,
  })

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={3}>Quản lý khách hàng</Typography.Title>
      <Card>
        <Flex vertical gap={16}>
          <UserFilters onChange={updateParams} />
          <UserTable
            data={data}
            loading={loading}
            params={params}
            onPageChange={updateParams}
            onChanged={reload}
            onView={setViewingId}
          />
          <UserDetailDrawer userId={viewingId} onClose={() => setViewingId(null)} />
        </Flex>
      </Card>
    </Flex>
  )
}