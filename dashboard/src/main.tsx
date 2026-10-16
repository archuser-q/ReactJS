import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { ConfigProvider, App as AntApp } from 'antd'
import { routeTree } from './routeTree.gen'
import RouteError from './components/layout/RouteError'

const router = createRouter({ routeTree, defaultErrorComponent: RouteError })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider>
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
)