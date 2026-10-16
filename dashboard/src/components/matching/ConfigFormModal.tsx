import { useEffect } from 'react'
import { Alert, Button, Col, Divider, Form, Input, InputNumber, Modal, Progress, Row, Tooltip, Typography } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import type { MatchingConfig, MatchingConfigInput } from '../../api/matching'
import { WEIGHTS } from '../../constants/matching'
import WeightInput from './WeightInput'

export type FormMode = { type: 'create' } | { type: 'edit'; config: MatchingConfig } | { type: 'duplicate'; config: MatchingConfig }

type Props = {
  mode: FormMode | null
  loading: boolean
  onCancel: () => void
  onSubmit: (values: MatchingConfigInput) => void
}

const DEFAULTS: MatchingConfigInput = {
  name: '',
  w_distance: 0.35,
  w_trust: 0.3,
  w_skill: 0.15,
  w_acceptance: 0.1,
  w_workload: 0.1,
  max_radius_km: 10,
  offer_timeout_seconds: 30,
  batch_window_seconds: 10,
}

const TITLES = { create: 'Tạo bộ trọng số', edit: 'Sửa bộ trọng số', duplicate: 'Nhân bản bộ trọng số' }

export default function ConfigFormModal({ mode, loading, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<MatchingConfigInput>()
  const values = Form.useWatch([], form)
  const sum = Math.round(WEIGHTS.reduce((s, w) => s + (values?.[w.key] ?? 0), 0) * 100)

  useEffect(() => {
    if (!mode) return
    if (mode.type === 'create') form.setFieldsValue(DEFAULTS)
    else form.setFieldsValue({ ...mode.config, name: mode.type === 'duplicate' ? `${mode.config.name} (bản sao)` : mode.config.name })
  }, [mode, form])

  const normalize = () => {
    const current = form.getFieldsValue()
    const total = WEIGHTS.reduce((s, w) => s + (current[w.key] ?? 0), 0)
    if (!total) return
    const rounded = WEIGHTS.map((w) => Math.round(((current[w.key] ?? 0) / total) * 100))
    rounded[0] += 100 - rounded.reduce((a, b) => a + b, 0)
    form.setFieldsValue(Object.fromEntries(WEIGHTS.map((w, i) => [w.key, rounded[i] / 100])))
  }

  return (
    <Modal
      title={mode ? TITLES[mode.type] : ''}
      open={!!mode}
      width={640}
      okText="Lưu"
      cancelText="Hủy"
      okButtonProps={{ loading, disabled: sum !== 100 }}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
        <Form.Item name="name" label="Tên bộ trọng số" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên' }]}>
          <Input placeholder="VD: Ưu tiên khoảng cách" />
        </Form.Item>

        <Divider titlePlacement="start" plain>
          Trọng số
        </Divider>
        {WEIGHTS.map((w) => (
          <Form.Item
            key={w.key}
            name={w.key}
            label={
              <>
                {w.label}&nbsp;
                <Tooltip title={w.help}>
                  <QuestionCircleOutlined />
                </Tooltip>
              </>
            }
          >
            <WeightInput />
          </Form.Item>
        ))}

        <Progress percent={Math.min(sum, 100)} status={sum === 100 ? 'success' : 'exception'} format={() => `${sum}%`} />
        {sum !== 100 && (
          <Alert
            type="warning"
            showIcon
            title={`Tổng trọng số đang là ${sum}%, phải bằng đúng 100%.`}
            action={
              <Button size="small" onClick={normalize}>
                Chuẩn hóa
              </Button>
            }
          />
        )}

        <Divider titlePlacement="start" plain>
          Tham số
        </Divider>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="max_radius_km" label="Bán kính tìm thợ">
              <InputNumber min={1} max={50} step={0.5} suffix="km" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="offer_timeout_seconds" label="Thời gian chờ thợ nhận">
              <InputNumber min={10} max={300} suffix="giây" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="batch_window_seconds" label="Cửa sổ gom lô">
              <InputNumber min={5} max={120} suffix="giây" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Typography.Text type="secondary">
          Cửa sổ gom lô chỉ áp dụng cho chế độ theo lô: hệ thống gom các đơn trong khoảng thời gian này rồi ghép một lượt bằng thuật toán Hungarian.
        </Typography.Text>
      </Form>
    </Modal>
  )
}