import { useCallback, useEffect, useState } from 'react'
import { Alert, App, Badge, Card, Col, Descriptions, Flex, InputNumber, Popconfirm, Row, Segmented, Space, Statistic, Tag, Tooltip, Typography } from 'antd'
import { SyncOutlined } from '@ant-design/icons'
import { getDispatchStatus, setDispatchMode } from '../../api/dispatch'
import type { DispatchStatus } from '../../api/dispatch'
import type { MatchingMode } from '../../api/matching'
import type { ApiError } from '../../api/client'
import { MODES } from '../../constants/matching'
import { formatDateTime } from '../../constants/order'

const REFRESH_MS = 5000

type Props = { onModeChanged?: () => void }

/** Trạng thái bộ điều phối ghép cặp chạy nền trong backend (phần của thành viên B) + đổi nhanh chế độ ghép */
export default function DispatchStatusCard({ onModeChanged }: Props) {
  const { message } = App.useApp()
  const [data, setData] = useState<DispatchStatus>()
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [pending, setPending] = useState<{ mode: MatchingMode; k: number } | null>(null)

  const load = useCallback(async () => {
    try {
      setData(await getDispatchStatus())
      setError(undefined)
    } catch (e) {
      setError((e as ApiError).message)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, REFRESH_MS)
    return () => clearInterval(t)
  }, [load])

  const apply = async () => {
    if (!pending) return
    setSaving(true)
    try {
      const res = await setDispatchMode(pending.mode, pending.mode === 'batch' ? undefined : pending.k)
      message.success(res.message)
      setPending(null)
      await load()
      onModeChanged?.()
    } catch (e) {
      message.error((e as ApiError).message)
    } finally {
      setSaving(false)
    }
  }

  const d = data?.dispatcher
  const cfg = data?.config
  const queued = data?.queue.reduce((s, q) => s + q.orders, 0) ?? 0
  const lastTickAgo = d?.last_tick_at ? Math.round((Date.now() - new Date(d.last_tick_at).getTime()) / 1000) : null
  const healthy = !!d?.enabled && d.leader && lastTickAgo !== null && lastTickAgo < 30
  const shown = pending ?? (cfg ? { mode: cfg.mode, k: cfg.max_offers } : null)

  return (
    <Card
      title={
        <Space>
          <span>Bộ điều phối ghép cặp</span>
          {d && <Badge status={healthy ? 'processing' : 'error'} text={healthy ? 'Đang chạy' : 'Không hoạt động'} />}
        </Space>
      }
      extra={
        <Tooltip title={`Tự cập nhật mỗi ${REFRESH_MS / 1000} giây`}>
          <SyncOutlined spin={!data && !error} style={{ color: '#999' }} />
        </Tooltip>
      }
    >
      {error && <Alert type="error" showIcon title="Không lấy được trạng thái bộ điều phối" description={error} style={{ marginBottom: 16 }} />}
      {d?.last_error && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          title={`Lỗi gần nhất lúc ${formatDateTime(d.last_error.at)}`}
          description={d.last_error.message}
        />
      )}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Statistic title="Đơn đang chờ ghép" value={queued} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="Lời mời đang mở" value={data?.live_offers ?? 0} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="Lời mời đã gửi (từ lúc bật)" value={d?.offers_sent ?? 0} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="Số nhịp đã chạy" value={d?.ticks ?? 0} suffix={d ? <Typography.Text type="secondary">· {d.tick_seconds}s/nhịp</Typography.Text> : null} />
        </Col>
      </Row>

      <Descriptions size="small" column={{ xs: 1, md: 2 }} style={{ marginTop: 16 }}>
        <Descriptions.Item label="Cấu hình đang áp dụng">{cfg?.name ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Nhịp gần nhất">{lastTickAgo === null ? '—' : `${lastTickAgo} giây trước`}</Descriptions.Item>
        <Descriptions.Item label="Hàng đợi theo chế độ">
          {data?.queue.length
            ? data.queue.map((q) => (
                <Tag key={q.mode}>
                  {MODES.find((m) => m.value === q.mode)?.label ?? q.mode}: {q.orders} đơn
                </Tag>
              ))
            : 'Trống'}
        </Descriptions.Item>
        <Descriptions.Item label="Ghép tự động gần nhất">
          {d?.last_auto ? `${formatDateTime(d.last_auto.at)} · ${d.last_auto.orders} đơn` : '—'}
        </Descriptions.Item>
      </Descriptions>

      {shown && cfg?.id && (
        <Flex vertical gap={8} style={{ marginTop: 8 }}>
          <Typography.Text strong>Đổi nhanh chế độ ghép (áp dụng cho cấu hình đang bật)</Typography.Text>
          <Flex gap={12} wrap align="center">
            <Segmented<MatchingMode>
              value={shown.mode}
              onChange={(mode) => setPending({ mode, k: shown.k })}
              options={MODES.map((m) => ({ value: m.value, label: m.label }))}
            />
            <Space>
              <Typography.Text type="secondary">k =</Typography.Text>
              <InputNumber
                min={1}
                max={10}
                value={shown.k}
                disabled={shown.mode === 'batch'}
                onChange={(k) => k && setPending({ mode: shown.mode, k })}
                style={{ width: 72 }}
              />
            </Space>
            {pending && (
              <Popconfirm
                title="Đổi chế độ ghép?"
                description="Các đơn mới và đơn đang chờ sẽ được ghép theo chế độ này từ nhịp tiếp theo."
                okText="Đổi"
                cancelText="Hủy"
                onConfirm={apply}
                onCancel={() => setPending(null)}
              >
                <Typography.Link disabled={saving}>Áp dụng</Typography.Link>
              </Popconfirm>
            )}
          </Flex>
          <Typography.Text type="secondary">{MODES.find((m) => m.value === shown.mode)?.help}</Typography.Text>
        </Flex>
      )}
    </Card>
  )
}
