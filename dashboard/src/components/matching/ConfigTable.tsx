import { Button, Popconfirm, Space, Table, Tag, Tooltip, Typography } from 'antd'
import type { TableProps } from 'antd'
import { CheckCircleOutlined, CopyOutlined, DeleteOutlined, EditOutlined, ExperimentOutlined } from '@ant-design/icons'
import type { MatchingConfig } from '../../api/matching'
import { WEIGHTS } from '../../constants/matching'


type Props = {
  configs: MatchingConfig[]
  loading: boolean
  onActivate: (c: MatchingConfig) => void
  onEdit: (c: MatchingConfig) => void
  onDuplicate: (c: MatchingConfig) => void
  onDelete: (c: MatchingConfig) => void
  onSimulate: (c: MatchingConfig) => void
}

export default function ConfigTable({ configs, loading, onActivate, onEdit, onDuplicate, onDelete, onSimulate }: Props) {
  const columns: TableProps<MatchingConfig>['columns'] = [
    {
      title: 'Bộ trọng số',
      dataIndex: 'name',
      render: (name: string, c) => (
        <Space orientation="vertical" size={0}>
          <Space>
            <Typography.Text strong>{name}</Typography.Text>
            {c.is_active && <Tag color="success">Đang áp dụng</Tag>}
          </Space>
          <Typography.Text type="secondary">
            Cập nhật {new Date(c.updated_at).toLocaleString('vi-VN')}
            {c.updated_by_name && ` · ${c.updated_by_name}`}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Trọng số',
      key: 'weights',
      render: (_, c) => (
        <Space size={[4, 4]} wrap>
          {WEIGHTS.map((w) => (
            <Tooltip key={w.key} title={w.label}>
              <Tag>
                {w.short} {Math.round(c[w.key] * 100)}%
              </Tag>
            </Tooltip>
          ))}
        </Space>
      ),
    },
    { title: 'Bán kính', dataIndex: 'max_radius_km', render: (v: number) => `${v} km` },
    { title: 'Chờ nhận', dataIndex: 'offer_timeout_seconds', render: (v: number) => `${v}s` },
    { title: 'Gom lô', dataIndex: 'batch_window_seconds', render: (v: number) => `${v}s` },
    { title: 'Đơn đã dùng', dataIndex: 'order_count', align: 'right' },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, c) => {
        const used = c.order_count > 0
        return (
          <Space>
            {!c.is_active && (
              <Popconfirm
                title="Áp dụng bộ trọng số này?"
                description="Các đơn mới sẽ được ghép theo bộ này."
                okText="Áp dụng"
                cancelText="Hủy"
                onConfirm={() => onActivate(c)}
              >
                <Button size="small" type="primary" icon={<CheckCircleOutlined />}>
                  Áp dụng
                </Button>
              </Popconfirm>
            )}
            <Tooltip title="Mô phỏng">
              <Button size="small" icon={<ExperimentOutlined />} onClick={() => onSimulate(c)} />
            </Tooltip>
            <Tooltip title={used ? 'Đã có đơn dùng bộ này, hãy nhân bản để chỉnh' : 'Sửa'}>
              <Button size="small" icon={<EditOutlined />} disabled={used} onClick={() => onEdit(c)} />
            </Tooltip>
            <Tooltip title="Nhân bản">
              <Button size="small" icon={<CopyOutlined />} onClick={() => onDuplicate(c)} />
            </Tooltip>
            {!c.is_active && !used && (
              <Popconfirm title="Xóa bộ trọng số này?" okText="Xóa" okButtonProps={{ danger: true }} cancelText="Hủy" onConfirm={() => onDelete(c)}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        )
      },
    },
  ]

  return <Table rowKey="id" columns={columns} dataSource={configs} loading={loading} pagination={false} scroll={{ x: 'max-content' }} />
}