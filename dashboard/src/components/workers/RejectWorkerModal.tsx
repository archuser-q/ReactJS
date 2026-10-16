import { Form, Input, Modal } from 'antd'

type Props = {
  open: boolean
  loading: boolean
  onCancel: () => void
  onSubmit: (note: string) => void
}

export default function RejectWorkerModal({ open, loading, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<{ note: string }>()

  return (
    <Modal
      title="Từ chối hồ sơ thợ"
      open={open}
      okText="Từ chối"
      okButtonProps={{ danger: true, loading }}
      cancelText="Hủy"
      onCancel={onCancel}
      onOk={() => form.submit()}
      afterClose={() => form.resetFields()}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={(v) => onSubmit(v.note)}>
        <Form.Item
          name="note"
          label="Lý do từ chối (thợ sẽ nhìn thấy)"
          rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập lý do' }]}
        >
          <Input.TextArea rows={4} placeholder="VD: Ảnh CCCD bị mờ, vui lòng chụp lại" />
        </Form.Item>
      </Form>
    </Modal>
  )
}