import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Импортируем конфигурацию напрямую, чтобы избежать циклических зависимостей
// Используем статические значения для vite.config, чтобы избежать постоянных перезапусков
const target_tauri = false
const USE_IP = false
const SERVER_IP = "192.168.1.94"
const api_host = USE_IP ? SERVER_IP : "localhost"
const img_host = USE_IP ? SERVER_IP : "localhost"
const api_proxy_addr = `http://${api_host}:8080`
const img_proxy_addr = `http://${img_host}:9000`
const dest_root = target_tauri ? "" : ""

// Отключаем PWA для Tauri (не нужен для десктопного приложения)
// PWA отключается как в build, так и в dev режиме Tauri
// Tauri устанавливает переменную TAURI_FAMILY при запуске
// Также отключаем PWA для обычной сборки из-за проблем с зависимостями browserslist
const isTauri = process.env.TAURI_BUILD === 'true' 
  || process.env.TAURI_PLATFORM !== undefined 
  || process.env.TAURI_FAMILY !== undefined
  || process.env.TAURI_DEV === 'true';

// Временно отключаем PWA из-за проблем с browserslist/node-releases
const enablePWA = false;

export default defineConfig({
  base: dest_root,
  server: {
    port: 3000,
    watch: {
      // Игнорируем изменения в конфигурационных файлах, чтобы избежать постоянных перезапусков
      ignored: [
        '**/tsconfig.json',
        '**/tsconfig.*.json',
        '**/node_modules/**',
        '**/.git/**',
      ],
    },
    proxy: {
      '/api': {
        target: api_proxy_addr,
        changeOrigin: true,
        secure: false,
      },
      '/img-proxy': {
        target: img_proxy_addr,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/img-proxy/, ''),
      },
    },
  },
  plugins: [
    react(),
    // PWA плагин только для веб-версии, не для Tauri
    // Временно отключен из-за проблем с browserslist/node-releases
    ...(isTauri || !enablePWA ? [] : [VitePWA({
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
    })]),
  ],
})