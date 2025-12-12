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
        name: 'LogiTruck',
        short_name: 'LogiTruck',
        start_url: '/WebRIP/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0d66dd',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/logo192.png',
            type: 'image/png',
            sizes: '192x192',
          },
          {
            src: '/logo512.png',
            type: 'image/png',
            sizes: '512x512',
          },
        ],
      },
    }),
  ],
})