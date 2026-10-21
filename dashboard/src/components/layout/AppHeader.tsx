import { App, Avatar, Dropdown, Flex, Layout, Typography, theme } from 'antd'
import type { MenuProps } from 'antd'
import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { logout } from '../../api/auth'
import NotificationBell from './NotificationBell'

const adminRoute = getRouteApi('/_admin')

export default function AppHeader() {
  const { user } = adminRoute.useRouteContext()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { token } = theme.useToken()

  const handleLogout = async () => {
    await logout()
    message.success('Đã đăng xuất')
    navigate({ to: '/login' })
  }

  const menuItems: MenuProps['items'] = [
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true, onClick: handleLogout },
  ]

  return (
    <Layout.Header style={{ background: token.colorBgContainer, paddingInline: 24 }}>
      <Flex justify="end" align="center" gap={16} style={{ height: '100%' }}>
        <NotificationBell />
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Flex gap={8} align="center" style={{ cursor: 'pointer' }}>
            <Avatar src={user.avatar_url ?? undefined} icon={<UserOutlined />} />
            <Typography.Text strong>{user.full_name}</Typography.Text>
          </Flex>
        </Dropdown>
      </Flex>
    </Layout.Header>
  )
}