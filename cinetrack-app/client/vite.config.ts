import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: './',
  server: {
    port: 5173,
    host: true, // Expose to network (0.0.0.0)
    proxy: {
      // Proxy /api requests to the backend server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,
  }
})
