import { Button, Card, Form, Input, Radio } from 'antd'
import type { HandleComplaintInput } from '../../api/complaints'

type Props = {
  loading: boolean
  onSubmit: (values: HandleComplaintInput) => void
}

export default function ComplaintHandleForm({ loading, onSubmit }: Props) {
  const [form] = Form.useForm<HandleComplaintInput>()
  const status = Form.useWatch('status', form)

  return (
    <Card size="small" title="Xử lý khiếu nại">
      <Form form={form} layout="vertical" initialValues={{ status: 'processing' }} onFinish={onSubmit}>
        <Form.Item name="status" label="Cập nhật trạng thái">
          <Radio.Group
            optionType="button"
            options={[
              { value: 'processing', label: 'Đang xử lý' },
              { value: 'resolved', label: 'Đã giải quyết' },
              { value: 'rejected', label: 'Từ chối' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="resolution"
          label="Hướng giải quyết (khách sẽ nhìn thấy)"
          rules={[{ required: status !== 'processing', whitespace: true, message: 'Vui lòng nhập hướng giải quyết' }]}
        >
          <Input.TextArea rows={3} placeholder="VD: Đã yêu cầu thợ quay lại bảo hành miễn phí trong 24h" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Lưu
        </Button>
      </Form>
    </Card>
  )
}