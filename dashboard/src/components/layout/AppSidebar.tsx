import { Flex, Layout, Menu, MenuProps, Typography } from "antd";
import { FileRouteTypes } from "../../routeTree.gen";
import { AppstoreOutlined, DashboardOutlined, FileTextOutlined, ToolOutlined, UserOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

type MenuItem = Required<MenuProps>['items'][number] & {key:FileRouteTypes['to']}

const items: MenuItem[] = [
  { key: '/', icon: <DashboardOutlined />, label: 'Tổng quan' },
  { key: '/users', icon: <UserOutlined />, label: 'Khách hàng' },
  { key: '/workers', icon: <ToolOutlined />, label: 'Thợ' },
  { key: '/services', icon: <AppstoreOutlined />, label: 'Dịch vụ' },
  { key: '/orders', icon: <FileTextOutlined />, label: 'Đơn hàng' }
]

export default function AppSidebar(){
    const [collapsed, setCollapsed] = useState(false)
    const navigate = useNavigate()
    const pathname = useRouterState({
        select: (s) => s.location.pathname
    })

    return (
        <Layout.Sider theme="light" collapsible collapsed={collapsed} onCollapse={setCollapsed} breakpoint="lg">
        <Flex justify="center" align="center" style={{ height: 64 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
            {collapsed ? 'TN' : 'THỢ NHANH'}
            </Typography.Title>
        </Flex>
        <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={items}
            onClick={({ key }) => navigate({ to: key as FileRouteTypes['to'] })}
        />
        </Layout.Sider>
    )
}