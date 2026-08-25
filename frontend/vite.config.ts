import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/devices': 'http://127.0.0.1:5000',
      '^/assets$': 'http://127.0.0.1:5000',
      '/decision-trees': 'http://127.0.0.1:5000',
      '/health': 'http://127.0.0.1:5000',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
})
