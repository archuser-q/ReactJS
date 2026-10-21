import { useCallback, useState } from 'react'
import { Alert, Flex, Segmented, Select } from 'antd'
import { listComplaints } from '../../api/complaints'
import type { ComplaintListParams, ComplaintSource, ComplaintStatus } from '../../api/complaints'
import type { WorkerDetail } from '../../api/workers'
import { usePagedList } from '../../hooks/usePagedList'
import { COMPLAINT_STATUS } from '../../constants/complaints'
import ComplaintTable from '../complaints/ComplaintTable'
import ComplaintDetailDrawer from '../complaints/ComplaintDetailDrawer'

type Props = { workerId: string; stats: WorkerDetail['stats']; onChanged: () => void }

/**
 * Sự cố liên quan 1 thợ:
 *  - "Thợ báo cáo": thợ gửi từ app thợ (khách vắng mặt, không thanh toán...)
 *  - "Khách khiếu nại": khiếu nại / bảo hành của khách về các đơn thợ này làm
 */
export default function WorkerIssuesTab({ workerId, stats, onChanged }: Props) {
  const [viewingId, setViewingId] = useState<string | null>(null)
  const fetcher = useCallback((p: ComplaintListParams) => listComplaints({ ...p, workerId }), [workerId])
  const initial: ComplaintListParams = { page: 1, pageSize: 10, source: 'worker' }
  const { params, data, loading, reload, updateParams } = usePagedList(fetcher, initial)

  return (
    <Flex vertical gap={12}>
      {stats.open_issues > 0 && (
        <Alert type="warning" showIcon title={`Còn ${stats.open_issues} sự cố / khiếu nại chưa xử lý xong`} />
      )}
      <Flex justify="space-between" wrap gap={8}>
        <Segmented<ComplaintSource>
          value={params.source}
          onChange={(source) => updateParams({ source })}
          options={[
            { value: 'worker', label: `Thợ báo cáo (${stats.reports})` },
            { value: 'customer', label: `Khách khiếu nại (${stats.customer_complaints})` },
          ]}
        />
        <Select<ComplaintStatus>
          placeholder="Trạng thái"
          allowClear
          popupMatchSelectWidth={false}
          style={{ minWidth: 140 }}
          onChange={(status) => updateParams({ status })}
          options={Object.entries(COMPLAINT_STATUS).map(([value, s]) => ({ value: value as ComplaintStatus, label: s.label }))}
        />
      </Flex>
      <ComplaintTable
        data={data}
        loading={loading}
        params={params}
        onPageChange={updateParams}
        onView={setViewingId}
        emptyText={params.source === 'worker' ? 'Thợ chưa gửi báo cáo sự cố nào' : 'Chưa có khách khiếu nại về thợ này'}
      />
      <ComplaintDetailDrawer
        complaintId={viewingId}
        onClose={() => setViewingId(null)}
        onChanged={() => {
          reload()
          onChanged()
        }}
      />
    </Flex>
  )
}
