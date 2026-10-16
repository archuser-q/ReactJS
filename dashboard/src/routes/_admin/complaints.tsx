import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, Flex, Typography } from 'antd'
import { usePagedList } from '../../hooks/usePagedList'
import { listComplaints } from '../../api/complaints'
import ComplaintFilters from '../../components/complaints/ComplaintFilters'
import ComplaintTable from '../../components/complaints/ComplaintTable'
import ComplaintDetailDrawer from '../../components/complaints/ComplaintDetailDrawer'

export const Route = createFileRoute('/_admin/complaints')({
  component: ComplaintsPage,
})

function ComplaintsPage() {
  const { params, data, loading, reload, updateParams } = usePagedList(listComplaints, { page: 1, pageSize: 10 })
  const [viewingId, setViewingId] = useState<string | null>(null)

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={3}>Khiếu nại & bảo hành</Typography.Title>
      <Card>
        <Flex vertical gap={16}>
          <ComplaintFilters onChange={updateParams} />
          <ComplaintTable data={data} loading={loading} params={params} onPageChange={updateParams} onView={setViewingId} />
        </Flex>
      </Card>

      <ComplaintDetailDrawer complaintId={viewingId} onClose={() => setViewingId(null)} onChanged={reload} />
    </Flex>
  )
}