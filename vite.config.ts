import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const githubPages = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  base: githubPages ? '/havk/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  server: {
    host: true,
    port: 5173,
    open: true,
  },
  preview: {
    host: true,
    port: 4173,
  },
})