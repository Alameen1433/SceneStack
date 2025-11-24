import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: './',
  server: {
    port: 5173,
  },
  build: {
    sourcemap: false, // Disable source maps to avoid the warning
  }
})
