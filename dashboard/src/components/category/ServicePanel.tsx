import { useCallback, useEffect, useState } from 'react'
import { App, Button, Card, Input, Space, Switch, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import { createService, listServices, updateService } from '../../api/catalog'
import type { Category, Service, ServiceInput } from '../../api/catalog'
import type { ApiError } from '../../api/client'
import ServiceFormModal from './ServiceFormModal'

type Props = {
  categories: Category[]
  categoryId?: number
  onChanged: () => void
}

export default function ServicePanel({ categories, categoryId, onChanged }: Props) {
  const { message } = App.useApp()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState<string>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setServices(await listServices({ categoryId, search }))
    } catch (e) {
      message.error((e as ApiError).message)
    } finally {
      setLoading(false)
    }
  }, [categoryId, search, message])

  useEffect(() => {
    load()
  }, [load])

  const run = async (action: () => Promise<{ message: string }>) => {
    try {
      const res = await action()
      message.success(res.message)
      load()
      onChanged()
      return true
    } catch (e) {
      message.error((e as ApiError).message)
      return false
    }
  }

  const handleSubmit = async (values: ServiceInput) => {
    setSaving(true)
    const ok = await run(() => (editing ? updateService(editing.id, values) : createService(values)))
    setSaving(false)
    if (ok) setModalOpen(false)
  }

  const openModal = (service: Service | null) => {
    setEditing(service)
    setModalOpen(true)
  }

  const category = categories.find((c) => c.id === categoryId)

  const columns: TableProps<Service>['columns'] = [
    {
      title: 'Dịch vụ',
      dataIndex: 'name',
      render: (name: string, s) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>{name}</Typography.Text>
          {s.description && <Typography.Text type="secondary">{s.description}</Typography.Text>}
        </Space>
      ),
    },
    ...(categoryId ? [] : [{ title: 'Danh mục', dataIndex: 'category_name' }]),
    {
      title: 'Giá cơ bản',
      dataIndex: 'base_price',
      align: 'right',
      render: (v: number, s) => `${v.toLocaleString('vi-VN')} ₫ / ${s.unit}`,
    },
    { title: 'Bảo hành', dataIndex: 'warranty_days', render: (d: number) => (d ? `${d} ngày` : '—') },
    { title: 'Số đơn', dataIndex: 'order_count', align: 'right' },
    {
      title: 'Bật',
      dataIndex: 'is_active',
      render: (active: boolean, s) => (
        <Switch size="small" checked={active} onChange={(checked) => run(() => updateService(s.id, { is_active: checked }))} />
      ),
    },
    {
      key: 'edit',
      render: (_, s) => <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openModal(s)} />,
    },
  ]

  return (
    <Card
      title={category ? `Dịch vụ: ${category.name}` : 'Tất cả dịch vụ'}
      extra={
        <Space wrap>
          <Input.Search placeholder="Tìm dịch vụ" allowClear onSearch={(v) => setSearch(v || undefined)} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null)}>
            Thêm dịch vụ
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={services}
        loading={loading}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 'max-content' }}
      />
      <ServiceFormModal
        open={modalOpen}
        editing={editing}
        categories={categories}
        defaultCategoryId={categoryId}
        loading={saving}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </Card>
  )
}