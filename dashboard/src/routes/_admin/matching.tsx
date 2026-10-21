import { useCallback, useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Alert, App, Button, Card, Flex, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { activateConfig, createConfig, deleteConfig, listConfigs, updateConfig } from '../../api/matching'
import type { MatchingConfig, MatchingConfigInput } from '../../api/matching'
import type { ApiError } from '../../api/client'
import ConfigTable from '../../components/matching/ConfigTable'
import ConfigFormModal from '../../components/matching/ConfigFormModal'
import type { FormMode } from '../../components/matching/ConfigFormModal'
import SimulationDrawer from '../../components/matching/StimulationDrawer'
import DispatchStatusCard from '../../components/matching/DispatchStatusCard'

export const Route = createFileRoute('/_admin/matching')({
  component: MatchingPage,
})

function MatchingPage() {
  const { message } = App.useApp()
  const [configs, setConfigs] = useState<MatchingConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<FormMode | null>(null)
  const [saving, setSaving] = useState(false)
  const [simulating, setSimulating] = useState<MatchingConfig | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setConfigs(await listConfigs())
    } catch (e) {
      message.error((e as ApiError).message)
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    load()
  }, [load])

  const run = async (action: () => Promise<{ message: string }>) => {
    try {
      const res = await action()
      message.success(res.message)
      load()
      return true
    } catch (e) {
      message.error((e as ApiError).message)
      return false
    }
  }

  const handleSubmit = async (values: MatchingConfigInput) => {
    if (!mode) return
    setSaving(true)
    const ok = await run(() => (mode.type === 'edit' ? updateConfig(mode.config.id, values) : createConfig(values)))
    setSaving(false)
    if (ok) setMode(null)
  }

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={3}>Cấu hình ghép cặp</Typography.Title>
      <Alert
        type="info"
        showIcon
        title="Cách hệ thống chọn thợ"
        description="Mỗi thợ trong bán kính được chấm điểm = Σ (trọng số × điểm tiêu chí), trong đó mỗi tiêu chí được chuẩn hóa về 0–1. Chế độ Tức thời gửi lời mời cho k thợ điểm cao nhất (Greedy); Theo lô gom đơn rồi ghép tối ưu bằng Hungarian; Tự động tự chọn giữa hai cách cho từng nhóm đơn. Khách không chọn chế độ — hệ thống dùng cấu hình đang áp dụng. Bộ đã có đơn sử dụng sẽ bị khóa chỉnh sửa để giữ nguyên kết quả thực nghiệm."
      />
      <DispatchStatusCard onModeChanged={load} />
      <Card
        title="Các bộ trọng số"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setMode({ type: 'create' })}>
            Tạo mới
          </Button>
        }
      >
        <ConfigTable
          configs={configs}
          loading={loading}
          onActivate={(c) => run(() => activateConfig(c.id))}
          onEdit={(c) => setMode({ type: 'edit', config: c })}
          onDuplicate={(c) => setMode({ type: 'duplicate', config: c })}
          onDelete={(c) => run(() => deleteConfig(c.id))}
          onSimulate={setSimulating}
        />
      </Card>

      <ConfigFormModal mode={mode} loading={saving} onCancel={() => setMode(null)} onSubmit={handleSubmit} />
      <SimulationDrawer config={simulating} onClose={() => setSimulating(null)} />
    </Flex>
  )
}