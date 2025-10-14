import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router'],
          ui: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-select'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    allowedHosts: [
      'demonax23-1.onrender.com',
      'demonax23-xn9g.vercel.app',
      'localhost',
      '127.0.0.1',
      '0.0.0.0'
    ],
  },
})