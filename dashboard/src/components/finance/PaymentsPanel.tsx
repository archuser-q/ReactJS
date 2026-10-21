import { Card, Col, DatePicker, Flex, Input, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { listPayments } from '../../api/finance'
import type { CustomerPayment, PaymentMethod, PaymentParams, PaymentStatus } from '../../api/finance'
import { usePagedList } from '../../hooks/usePagedList'
import { toDay } from '../../constants/finance'
import { PAYMENT_METHOD, PAYMENT_STATUS, formatDateTime, formatMoney } from '../../constants/order'

type Props = { onOpenOrder: (id: string) => void }

/**
 * Thanh toán của khách theo từng đơn (bảng payments). Khách không có ví: trả tiền mặt cho thợ hoặc trả online
 * qua MoMo / VNPay (sandbox). Dùng để đối soát số tiền đã thu qua từng cổng với mã giao dịch của cổng.
 */
export default function PaymentsPanel({ onOpenOrder }: Props) {
  const initial: PaymentParams = { page: 1, pageSize: 10 }
  const { params, data, loading, updateParams } = usePagedList(listPayments, initial)

  const success = (m: PaymentMethod) => data?.summary.find((s) => s.method === m && s.status === 'success')
  const notOk = data?.summary.filter((s) => s.status === 'failed' || s.status === 'pending').reduce((n, s) => n + s.count, 0) ?? 0

  const columns: TableProps<CustomerPayment>['columns'] = [
    { title: 'Thời gian', dataIndex: 'created_at', render: (v: string, p) => formatDateTime(p.paid_at ?? v) },
    {
      title: 'Mã đơn',
      dataIndex: 'order_code',
      render: (v: string, p) => <Typography.Link onClick={() => onOpenOrder(p.order_id)}>{v}</Typography.Link>,
    },
    {
      title: 'Khách',
      dataIndex: 'customer_name',
      render: (_, p) => (
        <Space orientation="vertical" size={0}>
          <span>{p.customer_name}</span>
          <Typography.Text type="secondary">{p.customer_phone ?? '—'}</Typography.Text>
        </Space>
      ),
    },
    { title: 'Thợ', dataIndex: 'worker_name', render: (v: string | null) => v ?? '—' },
    { title: 'Phương thức', dataIndex: 'method', render: (m: PaymentMethod) => <Tag>{PAYMENT_METHOD[m]}</Tag> },
    { title: 'Số tiền', dataIndex: 'amount', align: 'right', render: (v: number) => <Typography.Text strong>{formatMoney(v)}</Typography.Text> },
    { title: 'Hoa hồng', dataIndex: 'commission_amount', align: 'right', render: formatMoney },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (s: PaymentStatus) => <Tag color={PAYMENT_STATUS[s].color}>{PAYMENT_STATUS[s].label}</Tag>,
    },
    {
      title: 'Mã giao dịch cổng',
      dataIndex: 'provider_txn_id',
      render: (v: string | null) => (v ? <Typography.Text copyable>{v}</Typography.Text> : '—'),
    },
  ]

  return (
    <Flex vertical gap={16}>
      <Row gutter={[12, 12]}>
        {(['cash', 'momo', 'vnpay'] as PaymentMethod[]).map((m) => (
          <Col key={m} xs={12} lg={6}>
            <Card size="small">
              <Statistic title={`Đã thu · ${PAYMENT_METHOD[m]}`} value={success(m)?.amount ?? 0} suffix="₫" groupSeparator="." />
              <Typography.Text type="secondary">{success(m)?.count ?? 0} giao dịch thành công</Typography.Text>
            </Card>
          </Col>
        ))}
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Chờ / thất bại" value={notOk} styles={notOk ? { content: { color: '#d4380d' } } : undefined} />
            <Typography.Text type="secondary">cần kiểm tra với cổng thanh toán</Typography.Text>
          </Card>
        </Col>
      </Row>
      <Space wrap>
        <Input.Search
          placeholder="Mã đơn, khách, thợ, mã GD"
          allowClear
          enterButton
          onSearch={(v) => updateParams({ search: v || undefined })}
        />
        <Select<PaymentMethod>
          placeholder="Phương thức"
          allowClear
          onChange={(method) => updateParams({ method })}
          options={Object.entries(PAYMENT_METHOD).map(([value, label]) => ({ value: value as PaymentMethod, label }))}
        />
        <Select<PaymentStatus>
          placeholder="Trạng thái"
          allowClear
          popupMatchSelectWidth={false}
          onChange={(status) => updateParams({ status })}
          options={Object.entries(PAYMENT_STATUS).map(([value, s]) => ({ value: value as PaymentStatus, label: s.label }))}
        />
        <DatePicker.RangePicker
          format="DD/MM/YYYY"
          placeholder={['Từ ngày', 'Đến ngày']}
          onChange={(r) => updateParams({ from: toDay(r?.[0]), to: toDay(r?.[1]) })}
        />
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={loading}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Chưa có thanh toán' }}
        pagination={{
          current: params.page,
          pageSize: params.pageSize,
          total: data?.total,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} thanh toán`,
          onChange: (page, pageSize) => updateParams({ page, pageSize }),
        }}
      />
    </Flex>
  )
}
