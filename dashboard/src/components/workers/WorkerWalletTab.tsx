import { Alert, Card, Col, Descriptions, Flex, Row, Statistic } from 'antd'
import type { WorkerDetail } from '../../api/workers'
import TransactionsPanel from '../finance/TransactionsPanel'

type Props = { data: WorkerDetail; onOpenOrder: (id: string) => void }

/** Ví của thợ: số dư, tài khoản nhận tiền, toàn bộ biến động (nạp, rút, thu nhập, hoa hồng) */
export default function WorkerWalletTab({ data, onOpenOrder }: Props) {
  const w = data.worker
  const b = data.bankAccount
  return (
    <Flex vertical gap={16}>
      <Row gutter={[12, 12]}>
        <Col xs={24} md={8}>
          <Card size="small">
            <Statistic
              title="Số dư ví"
              value={w.wallet_balance}
              suffix="₫"
              groupSeparator="."
              styles={w.wallet_balance < 0 ? { content: { color: '#cf1322' } } : undefined}
            />
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card size="small" title="Tài khoản nhận tiền">
            {b ? (
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Ngân hàng">{b.bank_name}</Descriptions.Item>
                <Descriptions.Item label="Số tài khoản">{b.account_number}</Descriptions.Item>
                <Descriptions.Item label="Chủ tài khoản">{b.account_holder}</Descriptions.Item>
              </Descriptions>
            ) : (
              'Thợ chưa liên kết tài khoản ngân hàng'
            )}
          </Card>
        </Col>
      </Row>
      {w.wallet_balance < 0 && (
        <Alert
          type="warning"
          showIcon
          title="Ví đang âm"
          description="Thợ nợ hoa hồng các đơn khách trả tiền mặt. Ví âm quá hạn mức (mặc định 500.000đ) thì app thợ không cho bật nhận đơn cho tới khi nạp tiền."
        />
      )}
      <TransactionsPanel workerId={w.id} onOpenOrder={onOpenOrder} />
    </Flex>
  )
}
