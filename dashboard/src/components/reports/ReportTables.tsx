import { Card, Table, Typography } from 'antd'
import type { Report } from '../../api/reports'
import { MATCHING_MODE, formatMoney } from '../../constants/order'

const percent = (part: number, total: number) => (total ? `${Math.round((part / total) * 100)}%` : '—')

export function TopWorkersTable({ workers }: { workers: Report['topWorkers'] }) {
  return (
    <Card size="small" title="Top 10 thợ theo doanh thu">
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={workers}
        scroll={{ x: 'max-content' }}
        columns={[
          { title: '#', key: 'rank', render: (_, __, i) => i + 1 },
          { title: 'Thợ', dataIndex: 'full_name', render: (v: string) => <Typography.Text strong>{v}</Typography.Text> },
          { title: 'Số việc', dataIndex: 'jobs', align: 'right' },
          { title: 'Doanh thu', dataIndex: 'revenue', align: 'right', render: formatMoney },
          { title: 'Sao TB', dataIndex: 'avg_rating', align: 'right', render: (v: number | null) => (v == null ? '—' : v.toFixed(1)) },
          { title: 'Điểm tin cậy', dataIndex: 'trust_score', align: 'right', render: (v: number) => v.toFixed(2) },
        ]}
      />
    </Card>
  )
}

export function CancelReasonsTable({ reasons }: { reasons: Report['cancelReasons'] }) {
  const total = reasons.reduce((s, r) => s + r.count, 0)
  return (
    <Card size="small" title="Lý do hủy phổ biến">
      <Table
        rowKey="reason"
        size="small"
        pagination={false}
        dataSource={reasons}
        locale={{ emptyText: 'Không có đơn bị hủy' }}
        columns={[
          { title: 'Lý do', dataIndex: 'reason' },
          { title: 'Số đơn', dataIndex: 'count', align: 'right' },
          { title: 'Tỉ trọng', key: 'share', align: 'right', render: (_, r) => percent(r.count, total) },
        ]}
      />
    </Card>
  )
}

export function MatchingTable({ matching }: { matching: Report['matching'] }) {
  return (
    <Card size="small" title="So sánh chế độ ghép cặp">
      <Table
        rowKey="mode"
        size="small"
        pagination={false}
        dataSource={matching}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Không có dữ liệu' }}
        columns={[
          { title: 'Chế độ', dataIndex: 'mode', render: (m: 'instant' | 'batch') => MATCHING_MODE[m] },
          { title: 'Số đơn', dataIndex: 'total_orders', align: 'right' },
          { title: 'Hoàn thành', key: 'done', align: 'right', render: (_, m) => percent(m.completed_orders, m.total_orders) },
          { title: 'Hủy khi chưa có thợ', key: 'unmatched', align: 'right', render: (_, m) => percent(m.unmatched_cancelled, m.total_orders) },
          {
            title: 'Thời gian chờ TB',
            dataIndex: 'avg_wait_minutes',
            align: 'right',
            render: (v: number | null) => (v == null ? '—' : `${v.toLocaleString('vi-VN')} phút`),
          },
        ]}
      />
    </Card>
  )
}