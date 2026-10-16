import { Form, Input, Modal } from 'antd'

type Props = {
  open: boolean
  loading: boolean
  onCancel: () => void
  onSubmit: (reason: string) => void
}

export default function CancelOrderModal({ open, loading, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<{ reason: string }>()

  return (
    <Modal
      title="Hủy đơn hàng"
      open={open}
      okText="Hủy đơn"
      okButtonProps={{ danger: true, loading }}
      cancelText="Đóng"
      onCancel={onCancel}
      onOk={() => form.submit()}
      afterClose={() => form.resetFields()}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={(v) => onSubmit(v.reason)}>
        <Form.Item
          name="reason"
          label="Lý do hủy (khách và thợ sẽ nhìn thấy)"
          rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập lý do' }]}
        >
          <Input.TextArea rows={3} placeholder="VD: Khách báo hủy qua hotline" />
        </Form.Item>
      </Form>
    </Modal>
  )
}