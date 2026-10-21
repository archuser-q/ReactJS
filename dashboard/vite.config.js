import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Backend Node dùng chung của nhóm (repo nodejs, mặc định cổng 3000)
  const target = env.VITE_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true
      }),
      react()
    ],
    server: {
      port: 5173,
      // Gọi API cùng origin để cookie đăng nhập (httpOnly) luôn gửi kèm, không vướng CORS
      proxy: {
        '/api': { target, changeOrigin: true },
        '/media': { target, changeOrigin: true },
      },
    },
  }
})
