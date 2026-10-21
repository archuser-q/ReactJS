import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, Flex, Segmented, Typography } from 'antd'
import { usePagedList } from '../../hooks/usePagedList'
import { listWorkers } from '../../api/workers'
import type { WorkerListParams } from '../../api/workers'
import WorkerFilters from '../../components/workers/WorkerFilters'
import WorkerTable from '../../components/workers/WorkerTable'
import WorkerDetailDrawer from '../../components/workers/WorkerDetailDrawer'

export const Route = createFileRoute('/_admin/workers')({
  component: WorkersPage,
})

type View = 'needed' | 'all'

function WorkersPage() {
  // Mặc định mở hàng chờ duyệt: hồ sơ thợ đã bấm "Gửi hồ sơ" + thợ đã duyệt gửi giấy tờ mới, gửi trước xếp trước
  const initial: WorkerListParams = { page: 1, pageSize: 10, review: 'needed' }
  const { params, data, loading, reload, updateParams } = usePagedList(listWorkers, initial)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const view: View = params.review === 'needed' ? 'needed' : 'all'

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={3}>Quản lý thợ</Typography.Title>
      <Card>
        <Flex vertical gap={16}>
          <Flex justify="space-between" wrap gap={12}>
            <Segmented<View>
              value={view}
              onChange={(v) => updateParams({ review: v === 'needed' ? 'needed' : undefined })}
              options={[
                { value: 'needed', label: 'Cần duyệt' },
                { value: 'all', label: 'Tất cả thợ' },
              ]}
            />
            <WorkerFilters onChange={updateParams} />
          </Flex>
          <WorkerTable
            data={data}
            loading={loading}
            params={params}
            onPageChange={updateParams}
            onChanged={reload}
            onView={setViewingId}
            reviewQueue={view === 'needed'}
          />
        </Flex>
      </Card>

      <WorkerDetailDrawer workerId={viewingId} onClose={() => setViewingId(null)} onChanged={reload} />
    </Flex>
  )
}
