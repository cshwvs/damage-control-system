import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      port: 3000,
      // 忽略编辑器“临时目录 + 改名”方式落盘时产生的中间文件，避免 watcher 触发 EBUSY 崩溃
      watch: {
        ignored: ['**/.*.tmpdir/**', '**/*.tmp']
      },
      proxy: {
        '/api/om': {
          target: env.VITE_PROXY_TARGET || 'http://192.168.10.3:8585',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/om/, '/api')
        }
      }
    }
  }
})