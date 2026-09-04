import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// TEMPORARY — local verification only, delete after use.
export default defineConfig({
  plugins: [react()],
  server: { port: 5199, proxy: { '/api': 'http://localhost:8099' } },
})
