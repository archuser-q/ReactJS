import { useEffect } from 'react'
import { Form, Input, InputNumber, Modal } from 'antd'
import type { Category, CategoryInput } from '../../api/catalog'

type Props = {
  open: boolean
  editing: Category | null
  loading: boolean
  onCancel: () => void
  onSubmit: (values: CategoryInput) => void
}

export default function CategoryFormModal({ open, editing, loading, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<CategoryInput>()

  useEffect(() => {
    if (open) form.setFieldsValue(editing ?? { name: '', description: '', icon_url: '', sort_order: 0 })
  }, [open, editing, form])

  return (
    <Modal
      title={editing ? 'Sửa danh mục' : 'Thêm danh mục'}
      open={open}
      okText="Lưu"
      cancelText="Hủy"
      okButtonProps={{ loading }}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên' }]}>
          <Input placeholder="VD: Sửa chữa điện" />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="icon_url" label="Link icon">
          <Input placeholder="https://..." />
        </Form.Item>
        <Form.Item name="sort_order" label="Thứ tự hiển thị">
          <InputNumber min={0} />
        </Form.Item>
      </Form>
    </Modal>
  )
}