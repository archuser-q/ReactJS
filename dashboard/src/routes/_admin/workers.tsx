import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, Flex, Typography } from 'antd'
import { usePagedList } from '../../hooks/usePagedList'
import { listWorkers } from '../../api/workers'
import WorkerFilters from '../../components/workers/WorkerFilters'
import WorkerTable from '../../components/workers/WorkerTable'
import WorkerDetailDrawer from '../../components/workers/WorkerDetailDrawer'

export const Route = createFileRoute('/_admin/workers')({
  component: WorkersPage,
})

function WorkersPage() {
  const { params, data, loading, reload, updateParams } = usePagedList(listWorkers, { page: 1, pageSize: 10 })
  const [viewingId, setViewingId] = useState<string | null>(null)

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={3}>Quản lý thợ</Typography.Title>
      <Card>
        <Flex vertical gap={16}>
          <WorkerFilters onChange={updateParams} />
          <WorkerTable
            data={data}
            loading={loading}
            params={params}
            onPageChange={updateParams}
            onChanged={reload}
            onView={setViewingId}
          />
        </Flex>
      </Card>

      <WorkerDetailDrawer workerId={viewingId} onClose={() => setViewingId(null)} onChanged={reload} />
    </Flex>
  )
}