import { useCallback, useEffect, useState } from 'react'
import { Card, Empty, Flex, Rate, Segmented, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { listWorkerOrders } from '../../api/workers'
import type { WorkerOrder, WorkerOrderGroup, WorkerOrderList, WorkerOrderParams } from '../../api/workers'
import { usePagedList } from '../../hooks/usePagedList'
import { ORDER_STATUS, formatDateTime, formatMoney } from '../../constants/order'

type Props = { workerId: string; onOpenOrder: (id: string) => void }
type HistoryGroup = Exclude<WorkerOrderGroup, 'active'>

/** Đơn của 1 thợ: đơn đang làm (nếu có) + lịch sử đã hoàn thành / đã huỷ có phân trang */
export default function WorkerOrdersTab({ workerId, onOpenOrder }: Props) {
  const [active, setActive] = useState<WorkerOrderList>()
  const fetcher = useCallback((p: WorkerOrderParams) => listWorkerOrders(workerId, p), [workerId])
  const initial: WorkerOrderParams = { group: 'completed', page: 1, pageSize: 10 }
  const { params, data, loading, updateParams } = usePagedList(fetcher, initial)

  useEffect(() => {
    listWorkerOrders(workerId, { group: 'active', page: 1, pageSize: 20 }).then(setActive).catch(() => undefined)
  }, [workerId])

  const onRow = (o: WorkerOrder) => ({ onClick: () => onOpenOrder(o.id), style: { cursor: 'pointer' } })
  const counts = data?.counts ?? active?.counts

  const activeColumns: TableProps<WorkerOrder>['columns'] = [
    { title: 'Mã đơn', dataIndex: 'code', render: (v: string) => <Typography.Text strong>{v}</Typography.Text> },
    { title: 'Trạng thái', dataIndex: 'status', render: (s: WorkerOrder['status']) => <Tag color={ORDER_STATUS[s].color}>{ORDER_STATUS[s].label}</Tag> },
    { title: 'Dịch vụ', dataIndex: 'service_name' },
    { title: 'Khách', dataIndex: 'customer_name' },
    { title: 'Nhận lúc', dataIndex: 'accepted_at', render: formatDateTime },
    { title: 'Hẹn lúc', dataIndex: 'scheduled_at', render: (v: string | null) => (v ? formatDateTime(v) : 'Gọi ngay') },
  ]

  const historyColumns: TableProps<WorkerOrder>['columns'] = [
    { title: 'Mã đơn', dataIndex: 'code', render: (v: string) => <Typography.Text strong>{v}</Typography.Text> },
    { title: 'Dịch vụ', dataIndex: 'service_name' },
    { title: 'Khách', dataIndex: 'customer_name' },
    ...(params.group === 'completed'
      ? [
          { title: 'Hoàn thành', dataIndex: 'completed_at', render: formatDateTime },
          { title: 'Thành tiền', dataIndex: 'price', align: 'right' as const, render: formatMoney },
          { title: 'Hoa hồng', dataIndex: 'commission_amount', align: 'right' as const, render: formatMoney },
          {
            title: 'Đánh giá',
            dataIndex: 'rating',
            render: (v: number | null) => (v ? <Rate disabled value={v} style={{ fontSize: 12 }} /> : <Typography.Text type="secondary">Chưa có</Typography.Text>),
          },
        ]
      : [
          { title: 'Huỷ lúc', dataIndex: 'cancelled_at', render: formatDateTime },
          { title: 'Lý do', dataIndex: 'cancel_reason', render: (v: string | null) => v ?? '—' },
        ]),
  ]

  return (
    <Flex vertical gap={16}>
      <Card size="small" title={`Đơn đang làm (${active?.items.length ?? 0})`}>
        {active && active.items.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Thợ không có đơn nào đang làm" />
        ) : (
          <Table rowKey="id" size="small" pagination={false} columns={activeColumns} dataSource={active?.items} loading={!active} onRow={onRow} scroll={{ x: 'max-content' }} />
        )}
      </Card>

      <Card
        size="small"
        title={
          <Segmented<HistoryGroup>
            value={params.group as HistoryGroup}
            onChange={(group) => updateParams({ group })}
            options={[
              { value: 'completed', label: `Đã hoàn thành (${counts?.completed ?? 0})` },
              { value: 'cancelled', label: `Đã huỷ (${counts?.cancelled ?? 0})` },
            ]}
          />
        }
      >
        <Table
          rowKey="id"
          size="small"
          columns={historyColumns}
          dataSource={data?.items}
          loading={loading}
          onRow={onRow}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: params.group === 'completed' ? 'Chưa hoàn thành đơn nào' : 'Không có đơn bị huỷ' }}
          pagination={{
            current: params.page,
            pageSize: params.pageSize,
            total: data?.total,
            size: 'small',
            showSizeChanger: true,
            showTotal: (total) => `${total} đơn`,
            onChange: (page, pageSize) => updateParams({ page, pageSize }),
          }}
        />
        <Space style={{ marginTop: 4 }}>
          <Typography.Text type="secondary">Bấm vào một đơn để xem chi tiết (ảnh, lời mời, vết di chuyển).</Typography.Text>
        </Space>
      </Card>
    </Flex>
  )
}
