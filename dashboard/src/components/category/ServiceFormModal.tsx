import { useEffect } from 'react'
import { Form, Input, InputNumber, Modal, Select } from 'antd'
import type { Category, Service, ServiceInput } from '../../api/catalog'

type Props = {
  open: boolean
  editing: Service | null
  categories: Category[]
  defaultCategoryId?: number
  loading: boolean
  onCancel: () => void
  onSubmit: (values: ServiceInput) => void
}

export default function ServiceFormModal({ open, editing, categories, defaultCategoryId, loading, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<ServiceInput>()

  useEffect(() => {
    if (!open) return
    form.setFieldsValue(
      editing ?? { category_id: defaultCategoryId, name: '', description: '', base_price: undefined, unit: 'lần', warranty_days: 0 },
    )
  }, [open, editing, defaultCategoryId, form])

  return (
    <Modal
      title={editing ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}
      open={open}
      okText="Lưu"
      cancelText="Hủy"
      okButtonProps={{ loading }}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item name="category_id" label="Danh mục" rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}>
          <Select options={categories.map((c) => ({ value: c.id, label: c.name }))} />
        </Form.Item>
        <Form.Item name="name" label="Tên dịch vụ" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên' }]}>
          <Input placeholder="VD: Vệ sinh điều hòa" />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="base_price" label="Giá cơ bản (₫)" rules={[{ required: true, message: 'Vui lòng nhập giá' }]}>
          <InputNumber<number>
            min={0}
            step={10000}
            style={{ width: '100%' }}
            formatter={(v) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
            parser={(v) => Number((v ?? '').replace(/\./g, ''))}
          />
        </Form.Item>
        <Form.Item name="unit" label="Đơn vị tính">
          <Input placeholder="VD: lần, máy, m²" />
        </Form.Item>
        <Form.Item name="warranty_days" label="Bảo hành (ngày)">
          <InputNumber min={0} />
        </Form.Item>
      </Form>
    </Modal>
  )
}