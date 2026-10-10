import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The backend RAG API (npm run rag:server) — proxied so the browser calls /api on the same origin.
const ragApi = {
  '/api': { target: `http://localhost:${process.env.RAG_PORT ?? 8787}`, changeOrigin: true, xfwd: true },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: ragApi },
  preview: { proxy: ragApi },
})
