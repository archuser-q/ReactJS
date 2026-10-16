import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, Flex, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { usePagedList } from '../../hooks/usePagedList'
import { listOrders } from '../../api/orders'
import OrderFilters from '../../components/orders/OrderFilters'
import OrderTable from '../../components/orders/OrderTable'
import OrderDetailDrawer from '../../components/orders/OrderDetailDrawer'

export const Route = createFileRoute('/_admin/orders')({
  component: OrdersPage,
})

function OrdersPage() {
  const { params, data, loading, reload, updateParams } = usePagedList(listOrders, { page: 1, pageSize: 10 })
  const [viewingId, setViewingId] = useState<string | null>(null)

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={3}>Giám sát đơn hàng</Typography.Title>
      <Card>
        <Flex vertical gap={16}>
          <Flex justify="space-between" wrap gap={8}>
            <OrderFilters onChange={updateParams} />
            <Button icon={<ReloadOutlined />} onClick={reload} loading={loading}>
              Làm mới
            </Button>
          </Flex>
          <OrderTable data={data} loading={loading} params={params} onPageChange={updateParams} onView={setViewingId} />
        </Flex>
      </Card>

      <OrderDetailDrawer orderId={viewingId} onClose={() => setViewingId(null)} onChanged={reload} />
    </Flex>
  )
}