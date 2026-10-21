import { useEffect } from 'react'
import { Alert, Form, Input, Modal } from 'antd'

type Props = {
  open: boolean
  loading: boolean
  /** Gợi ý sẵn lý do từ các giấy tờ đã bị từ chối */
  initialNote?: string
  onCancel: () => void
  onSubmit: (note: string) => void
}

export default function RejectWorkerModal({ open, loading, initialNote, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<{ note: string }>()

  useEffect(() => {
    if (open) form.setFieldsValue({ note: initialNote ?? '' })
  }, [open, initialNote, form])

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
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title="Giấy tờ hợp lệ được giữ nguyên"
        description="Muốn thợ tải lại giấy nào, hãy bấm “Từ chối” ở đúng giấy đó trước. Thợ sửa xong có thể gửi lại hồ sơ ngay trên app."
      />
      <Form form={form} layout="vertical" onFinish={(v) => onSubmit(v.note.trim())}>
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
