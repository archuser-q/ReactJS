import { useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { App, Button, Card, Col, Form, Input, Row, Typography } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { getMe, login } from '../api/auth'
import type { ApiError } from '../api/client'

export const Route = createFileRoute('/login')({
  beforeLoad: async()=>{
    const user = await getMe().catch(()=>null)
    if (user) throw redirect({ to: '/' })
  },
  component: LoginPage
})

type LoginForm = { identifier: string; password: string }

function LoginPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: LoginForm) => {
    setLoading(true)
    try {
      const res = await login(values.identifier, values.password)
      message.success(res.message)
      navigate({ to: '/' })
    } catch (e) {
      message.error((e as ApiError).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
      <Col xs={22} sm={16} md={10} lg={7}>
        <Card>
          <Typography.Title level={3}>THỢ NHANH</Typography.Title>
          <Typography.Paragraph type="secondary">Đăng nhập trang quản trị</Typography.Paragraph>

          <Form<LoginForm> layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              label="Email hoặc số điện thoại"
              name="identifier"
              rules={[{ required: true, message: 'Vui lòng nhập email hoặc số điện thoại' }]}
            >
              <Input prefix={<UserOutlined />} size="large" autoFocus />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password prefix={<LockOutlined />} size="large" />
            </Form.Item>

            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Đăng nhập
            </Button>
          </Form>
        </Card>
      </Col>
    </Row>
  )
}