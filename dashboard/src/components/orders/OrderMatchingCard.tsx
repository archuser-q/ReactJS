import { Card, Descriptions, Empty, Table, Tag, Typography } from 'antd'
import type { OrderDetail, OrderOffer } from '../../api/orders'
import { MATCHING_MODE, OFFER_STATUS, formatDateTime } from '../../constants/order'
import { MODES } from '../../constants/matching'

const REASON: Record<string, string> = { closed: 'Đơn đã có thợ khác nhận / bị huỷ' }

/** Lịch sử ghép cặp của đơn: bộ điều phối đã mời những thợ nào, điểm phù hợp, thợ trả lời ra sao */
export default function OrderMatchingCard({ data }: { data: OrderDetail }) {
  const { offers, dispatch } = data

  return (
    <Card size="small" title={`Ghép cặp (${offers.length} lời mời)`}>
      {dispatch && (
        <Descriptions size="small" column={{ xs: 1, md: 2 }} style={{ marginBottom: 12 }}>
          <Descriptions.Item label="Chế độ hàng đợi">{MODES.find((m) => m.value === dispatch.mode)?.label ?? dispatch.mode}</Descriptions.Item>
          <Descriptions.Item label="Số đợt đã gửi">{dispatch.rounds}</Descriptions.Item>
          <Descriptions.Item label="Thợ phù hợp lần gần nhất">{dispatch.last_candidates ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Hệ thống huỷ nếu chưa có thợ lúc">{formatDateTime(dispatch.deadline_at)}</Descriptions.Item>
        </Descriptions>
      )}
      {offers.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa gửi lời mời cho thợ nào" />
      ) : (
        <Table<OrderOffer>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={offers}
          scroll={{ x: 'max-content' }}
          columns={[
            { title: 'Đợt', dataIndex: 'round', render: (v: number, f) => `${v}${f.rank_position ? ` · #${f.rank_position}` : ''}` },
            { title: 'Thợ', dataIndex: 'worker_name' },
            { title: 'Cách', dataIndex: 'distance_km', align: 'right', render: (v: number | null) => (v == null ? '—' : `${v.toFixed(1)} km`) },
            { title: 'Điểm', dataIndex: 'score', align: 'right', render: (v: number) => v.toFixed(3) },
            { title: 'Thuật toán', dataIndex: 'mode', render: (m: OrderOffer['mode']) => (m === 'batch' ? 'Hungarian' : 'Greedy') + ` (${MATCHING_MODE[m]})` },
            {
              title: 'Kết quả',
              dataIndex: 'status',
              render: (s: OrderOffer['status'], f) => (
                <>
                  <Tag color={OFFER_STATUS[s]?.color}>{OFFER_STATUS[s]?.label ?? s}</Tag>
                  {f.reason && <Typography.Text type="secondary">{REASON[f.reason] ?? f.reason}</Typography.Text>}
                </>
              ),
            },
            { title: 'Mời lúc', dataIndex: 'offered_at', render: formatDateTime },
            { title: 'Trả lời lúc', dataIndex: 'responded_at', render: formatDateTime },
          ]}
        />
      )}
    </Card>
  )
}
