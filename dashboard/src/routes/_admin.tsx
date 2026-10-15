import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getMe } from '../api/auth'
import { Layout } from 'antd'
import AppSidebar from '../components/layout/AppSidebar'
import AppHeader from '../components/layout/AppHeader'

export const Route = createFileRoute('/_admin')({
  beforeLoad: async()=>{
    try{
        const user = await getMe()
        return {user}
    } catch{
        throw redirect({
            to: '/login'
        })
    }
  },
  component: AdminLayout
})

function AdminLayout() {
  return (
    <Layout hasSider style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Layout.Content style={{ margin: 24 }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  )
}