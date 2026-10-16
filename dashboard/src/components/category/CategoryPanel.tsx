import { useState } from 'react'
import { App, Button, Card, Switch, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import { createCategory, updateCategory } from '../../api/catalog'
import type { Category, CategoryInput } from '../../api/catalog'
import type { ApiError } from '../../api/client'
import CategoryFormModal from './CategoryFormModal'

type Props = {
  categories: Category[]
  loading: boolean
  selectedId?: number
  onSelect: (id?: number) => void
  onChanged: () => void
}

export default function CategoryPanel({ categories, loading, selectedId, onSelect, onChanged }: Props) {
  const { message } = App.useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)

  const run = async (action: () => Promise<{ message: string }>) => {
    try {
      const res = await action()
      message.success(res.message)
      onChanged()
      return true
    } catch (e) {
      message.error((e as ApiError).message)
      return false
    }
  }

  const handleSubmit = async (values: CategoryInput) => {
    setSaving(true)
    const ok = await run(() => (editing ? updateCategory(editing.id, values) : createCategory(values)))
    setSaving(false)
    if (ok) setModalOpen(false)
  }

  const openModal = (category: Category | null) => {
    setEditing(category)
    setModalOpen(true)
  }

  const columns: TableProps<Category>['columns'] = [
    {
      title: 'Danh mục',
      dataIndex: 'name',
      render: (name: string, c) => (
        <Typography.Text type={c.is_active ? undefined : 'secondary'} delete={!c.is_active}>
          {name}
        </Typography.Text>
      ),
    },
    { title: 'Dịch vụ', dataIndex: 'service_count', align: 'right' },
    {
      title: 'Bật',
      dataIndex: 'is_active',
      render: (active: boolean, c) => (
        <Switch
          size="small"
          checked={active}
          onClick={(_, e) => e.stopPropagation()}
          onChange={(checked) => run(() => updateCategory(c.id, { is_active: checked }))}
        />
      ),
    },
    {
      key: 'edit',
      render: (_, c) => (
        <Button
          size="small"
          type="text"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            openModal(c)
          }}
        />
      ),
    },
  ]

  return (
    <Card
      title="Danh mục"
      extra={
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openModal(null)}>
          Thêm
        </Button>
      }
    >
      <Button type="link" disabled={!selectedId} onClick={() => onSelect(undefined)}>
        Xem tất cả dịch vụ
      </Button>
      <Table
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={categories}
        loading={loading}
        pagination={false}
        scroll={{ x: 'max-content' }}
        rowSelection={{
          type: 'radio',
          selectedRowKeys: selectedId ? [selectedId] : [],
          onChange: (keys) => onSelect(keys[0] as number),
        }}
        onRow={(c) => ({ onClick: () => onSelect(c.id) })}
      />
      <CategoryFormModal
        open={modalOpen}
        editing={editing}
        loading={saving}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </Card>
  )
}