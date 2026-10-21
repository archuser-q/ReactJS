import { useCallback } from 'react'
import { Card, Col, DatePicker, Flex, Input, Row, Select, Space, Statistic, Table, Tag, Tooltip, Typography } from 'antd'
import type { TableProps } from 'antd'
import { listTransactions } from '../../api/finance'
import type { TxnParams, TxnType, WalletTxn } from '../../api/finance'
import { usePagedList } from '../../hooks/usePagedList'
import { TXN_TYPE, toDay } from '../../constants/finance'
import { formatDateTime, formatMoney } from '../../constants/order'

type Props = {
  /** Chỉ xem ví của 1 thợ (tab Ví trong hồ sơ thợ) */
  workerId?: string
  onOpenOrder?: (id: string) => void
}

const signed = (v: number) => (
  <Typography.Text strong type={v < 0 ? 'danger' : 'success'}>
    {v > 0 ? '+' : ''}
    {formatMoney(v)}
  </Typography.Text>
)

/** Biến động ví thợ: thu nhập, hoa hồng, nạp, rút, hoàn tiền (bảng worker_transactions, do app thợ ghi) */
export default function TransactionsPanel({ workerId, onOpenOrder }: Props) {
  const fetcher = useCallback((p: TxnParams) => listTransactions({ ...p, workerId }), [workerId])
  const initial: TxnParams = { page: 1, pageSize: 10 }
  const { params, data, loading, updateParams } = usePagedList(fetcher, initial)

  const sum = (t: TxnType) => data?.summary.find((s) => s.type === t)
  const cards: { type: TxnType; title: string }[] = [
    { type: 'earning', title: 'Thu nhập đơn online' },
    { type: 'commission', title: 'Hoa hồng đơn tiền mặt' },
    { type: 'topup', title: 'Nạp ví' },
    { type: 'withdraw', title: 'Rút tiền' },
  ]

  const columns: TableProps<WalletTxn>['columns'] = [
    { title: 'Thời gian', dataIndex: 'created_at', render: formatDateTime },
    ...(workerId
      ? []
      : [
          {
            title: 'Thợ',
            dataIndex: 'worker_name',
            render: (_: string, t: WalletTxn) => (
              <Space orientation="vertical" size={0}>
                <Typography.Text strong>{t.worker_name}</Typography.Text>
                <Typography.Text type="secondary">{t.worker_phone ?? '—'}</Typography.Text>
              </Space>
            ),
          },
        ]),
    {
      title: 'Loại',
      dataIndex: 'type',
      render: (v: TxnType) => (
        <Tooltip title={TXN_TYPE[v]?.help}>
          <Tag color={TXN_TYPE[v]?.color}>{TXN_TYPE[v]?.label ?? v}</Tag>
        </Tooltip>
      ),
    },
    { title: 'Số tiền', dataIndex: 'amount', align: 'right', render: signed },
    { title: 'Số dư sau', dataIndex: 'balance_after', align: 'right', render: formatMoney },
    {
      title: 'Đơn / lệnh rút',
      key: 'ref',
      render: (_, t) =>
        t.order_code ? (
          <Typography.Link onClick={() => onOpenOrder?.(t.order_id!)}>{t.order_code}</Typography.Link>
        ) : t.withdrawal_id ? (
          `Lệnh rút #${t.withdrawal_id}`
        ) : (
          '—'
        ),
    },
    { title: 'Ghi chú', dataIndex: 'note', render: (v: string | null) => v ?? '—' },
  ]

  return (
    <Flex vertical gap={16}>
      <Row gutter={[12, 12]}>
        {cards.map((c) => (
          <Col key={c.type} xs={12} lg={workerId ? 12 : 6}>
            <Card size="small">
              <Statistic
                title={c.title}
                value={Math.abs(sum(c.type)?.amount ?? 0)}
                suffix="₫"
                groupSeparator="."
              />
              <Typography.Text type="secondary">{sum(c.type)?.count ?? 0} giao dịch</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>
      <Space wrap>
        {!workerId && (
          <Input.Search
            placeholder="Tên / SĐT thợ, mã đơn"
            allowClear
            enterButton
            onSearch={(v) => updateParams({ search: v || undefined })}
          />
        )}
        <Select<TxnType>
          placeholder="Loại giao dịch"
          allowClear
          popupMatchSelectWidth={false}
          onChange={(type) => updateParams({ type })}
          options={Object.entries(TXN_TYPE).map(([value, t]) => ({ value: value as TxnType, label: t.label }))}
        />
        <DatePicker.RangePicker
          format="DD/MM/YYYY"
          placeholder={['Từ ngày', 'Đến ngày']}
          onChange={(r) => updateParams({ from: toDay(r?.[0]), to: toDay(r?.[1]) })}
        />
      </Space>
      <Table
        rowKey="id"
        size={workerId ? 'small' : 'middle'}
        columns={columns}
        dataSource={data?.items}
        loading={loading}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Chưa có giao dịch' }}
        pagination={{
          current: params.page,
          pageSize: params.pageSize,
          total: data?.total,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} giao dịch`,
          onChange: (page, pageSize) => updateParams({ page, pageSize }),
        }}
      />
    </Flex>
  )
}
