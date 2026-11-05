import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Local mein bhi /api backend (localhost:5000) tak jata hai, bilkul live site jaisa
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
})
