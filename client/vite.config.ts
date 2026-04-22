import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5501,
    proxy: {
      '/api': 'http://localhost:5500',
      '/socket.io': {
        target: 'http://localhost:5500',
        ws: true
      }
    }
  }
})
