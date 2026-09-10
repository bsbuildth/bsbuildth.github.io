import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@firebase/firestore')) return 'firebase-firestore'
          if (id.includes('@firebase/auth')) return 'firebase-auth'
          if (id.includes('@firebase/storage')) return 'firebase-storage'
          if (id.includes('@firebase/') || id.includes('/firebase/')) return 'firebase-core'
          if (id.includes('/recharts/') || id.includes('\\recharts\\')) return 'charts'
          if (/node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/.test(id)) return 'react-vendor'
          return undefined
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
