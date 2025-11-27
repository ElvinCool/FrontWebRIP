import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/WebRIP/',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/img': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      manifest: {
        id: '/WebRIP/',
        name: 'LogiTruck',
        short_name: 'LogiTruck',
        start_url: '/WebRIP/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0d66dd',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/WebRIP/vite.svg',
            type: 'image/svg+xml',
            sizes: 'any',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})