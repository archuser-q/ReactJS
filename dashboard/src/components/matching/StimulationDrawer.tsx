import { useEffect, useState } from 'react'
import {
  Alert, App, Button, Col, Drawer, Empty, Flex, Form, InputNumber, Row, Select, Space, Switch, Table, Tag, Tooltip, Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { ExperimentOutlined } from '@ant-design/icons'
import { simulate } from '../../api/matching'
import type { MatchingConfig, SimulationItem, SimulationResult } from '../../api/matching'
import { listCategories } from '../../api/catalog'
import type { Category } from '../../api/catalog'
import type { ApiError } from '../../api/client'
import { CRITERIA_OF, HANOI_DISTRICTS, WEIGHTS } from '../../constants/matching'

type Props = { config: MatchingConfig | null; onClose: () => void }

type FormValues = { category_id: number; district: string; lat: number; lng: number; include_offline: boolean }

const formatDistance = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`)

export default function SimulationDrawer({ config, onClose }: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm<FormValues>()
  const [categories, setCategories] = useState<Category[]>([])
  const [result, setResult] = useState<SimulationResult>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!config) return
    setResult(undefined)
    listCategories()
      .then((items) => {
        const active = items.filter((c) => c.is_active)
        setCategories(active)
        const d = HANOI_DISTRICTS[0]
        form.setFieldsValue({ category_id: active[0]?.id, district: d.name, lat: d.lat, lng: d.lng, include_offline: false })
      })
      .catch((e: ApiError) => message.error(e.message))
  }, [config, form, message])

  const run = async (values: FormValues) => {
    if (!config) return
    setLoading(true)
    try {
      setResult(
        await simulate({
          config: {
            w_distance: config.w_distance,
            w_trust: config.w_trust,
            w_skill: config.w_skill,
            w_acceptance: config.w_acceptance,
            w_workload: config.w_workload,
            max_radius_km: config.max_radius_km,
          },
          lat: values.lat,
          lng: values.lng,
          category_id: values.category_id,
          include_offline: values.include_offline,
          limit: 20,
        }),
      )
    } catch (e) {
      message.error((e as ApiError).message)
    } finally {
      setLoading(false)
    }
  }

  const columns: TableProps<SimulationItem>['columns'] = [
    { title: '#', key: 'rank', fixed: 'left', render: (_, __, i) => i + 1 },
    {
      title: 'Thợ',
      dataIndex: 'full_name',
      fixed: 'left',
      render: (name: string, w) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>{name}</Typography.Text>
          <Space size={4}>
            <Tag color={w.is_online ? 'green' : 'default'}>{w.is_online ? 'Online' : 'Offline'}</Tag>
            <Typography.Text type="secondary">{formatDistance(w.distance_m)}</Typography.Text>
          </Space>
        </Space>
      ),
    },
    ...WEIGHTS.map((weight) => ({
      title: (
        <Tooltip title={`${weight.label} · trọng số ${Math.round((config?.[weight.key] ?? 0) * 100)}%`}>
          {weight.short}
        </Tooltip>
      ),
      key: weight.key,
      align: 'right' as const,
      render: (_: unknown, w: SimulationItem) => {
        const value = w.criteria[CRITERIA_OF[weight.key]]
        const contribution = value * (config?.[weight.key] ?? 0)
        return (
          <Tooltip title={`${value.toFixed(2)} × ${Math.round((config?.[weight.key] ?? 0) * 100)}% = ${contribution.toFixed(3)}`}>
            <Typography.Text>{value.toFixed(2)}</Typography.Text>
          </Tooltip>
        )
      },
    })),
    {
      title: 'Tổng điểm',
      dataIndex: 'score',
      align: 'right',
      fixed: 'right',
      render: (v: number) => <Typography.Text strong>{v.toFixed(3)}</Typography.Text>,
    },
  ]

  return (
    <Drawer title={config ? `Mô phỏng: ${config.name}` : ''} size="large" open={!!config} onClose={onClose} destroyOnHidden>
      <Flex vertical gap={16}>
        <Form form={form} layout="vertical" onFinish={run} requiredMark={false}>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="category_id" label="Dịch vụ khách cần" rules={[{ required: true }]}>
                <Select options={categories.map((c) => ({ value: c.id, label: c.name }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="district" label="Vị trí khách">
                <Select
                  options={HANOI_DISTRICTS.map((d) => ({ value: d.name, label: d.name }))}
                  onChange={(name: string) => {
                    const d = HANOI_DISTRICTS.find((x) => x.name === name)
                    if (d) form.setFieldsValue({ lat: d.lat, lng: d.lng })
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name="lat" label="Vĩ độ" rules={[{ required: true }]}>
                <InputNumber step={0.001} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name="lng" label="Kinh độ" rules={[{ required: true }]}>
                <InputNumber step={0.001} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="include_offline" label="Tính cả thợ offline" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" icon={<ExperimentOutlined />} loading={loading}>
            Chạy mô phỏng
          </Button>
        </Form>

        {result && (
          <>
            <Alert
              type={result.total ? 'success' : 'warning'}
              showIcon
              title={
                result.total
                  ? `Tìm thấy ${result.total} thợ phù hợp trong bán kính ${config?.max_radius_km} km · truy vấn ${result.query_ms} ms`
                  : `Không có thợ phù hợp trong bán kính ${config?.max_radius_km} km`
              }
              description={result.total > result.items.length ? `Hiển thị ${result.items.length} thợ có điểm cao nhất.` : undefined}
            />
            {result.items.length ? (
              <Table
                rowKey="id"
                size="small"
                columns={columns}
                dataSource={result.items}
                pagination={false}
                scroll={{ x: 'max-content' }}
              />
            ) : (
              <Empty description="Thử tăng bán kính hoặc bật 'Tính cả thợ offline'" />
            )}
            <Typography.Text type="secondary">
              Mỗi cột là điểm tiêu chí đã chuẩn hóa 0–1. Rê chuột vào ô để xem phần đóng góp vào tổng điểm.
            </Typography.Text>
          </>
        )}
      </Flex>
    </Drawer>
  )
}