import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 상대 경로로 변경 (Netlify 배포용)
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      clientPort: 5173
    },
    allowedHosts: [
      '5173-ixgfkta6v39iv2yeq0lgt-c07dda5e.sandbox.novita.ai',
      '.sandbox.novita.ai'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
