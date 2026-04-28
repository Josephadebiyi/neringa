import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

const adminBasePath = process.env.ADMIN_BASE_PATH || '/'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: adminBasePath,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: ['full-stack-preview-2.preview.emergentagent.com'],
  },
})
