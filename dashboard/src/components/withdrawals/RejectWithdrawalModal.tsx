import { Form, Input, Modal, Typography } from 'antd'
import type { Withdrawal } from '../../api/withdrawals'
import { formatMoney } from '../../constants/order'

type Props = {
  withdrawal: Withdrawal | null
  loading: boolean
  onCancel: () => void
  onSubmit: (note: string) => void
}

export default function RejectWithdrawalModal({ withdrawal, loading, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<{ note: string }>()

  return (
    <Modal
      title="Từ chối lệnh rút tiền"
      open={!!withdrawal}
      okText="Từ chối & hoàn tiền"
      okButtonProps={{ danger: true, loading }}
      cancelText="Hủy"
      onCancel={onCancel}
      onOk={() => form.submit()}
      afterClose={() => form.resetFields()}
      destroyOnHidden
    >
      {withdrawal && (
        <Typography.Paragraph>
          {formatMoney(withdrawal.amount)} sẽ được hoàn lại vào ví của <b>{withdrawal.worker_name}</b>. Thợ nhận được thông báo kèm lý do.
        </Typography.Paragraph>
      )}
      <Form form={form} layout="vertical" onFinish={(v) => onSubmit(v.note.trim())}>
        <Form.Item
          name="note"
          label="Lý do (thợ sẽ nhìn thấy)"
          rules={[
            { required: true, whitespace: true, message: 'Vui lòng nhập lý do' },
            { max: 500, message: 'Tối đa 500 ký tự' },
          ]}
        >
          <Input.TextArea rows={3} placeholder="VD: Tên chủ tài khoản không khớp với họ tên thợ" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
