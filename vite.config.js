import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// NOTE (Phase 2): To get 100% guaranteed exact-time alarms, wrap this same
// PWA with Capacitor (@capacitor/core + @capacitor/local-notifications) to
// produce a real Android APK with native AlarmManager notifications.
// Not needed for the initial PWA build.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // generateSW avoids Rolldown entry-resolution bug in Vite 8 injectManifest mode.
      // Plugin auto-generates the SW; runtimeCaching replicates the old custom sw.js rules.
      strategies: 'generateSW',
      injectRegister: 'auto',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon.svg'],
      navigateFallback: '/',
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: { cacheName: 'pages', networkTimeoutSeconds: 3 },
        },
        {
          urlPattern: ({ request }) =>
            ['style', 'script', 'worker', 'image', 'font'].includes(request.destination),
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'assets' },
        },
      ],
      manifest: {
        name: 'Winter Arc Tracker 🔥',
        short_name: 'WinterArc',
        description: 'Personal daily tracking for your Winter Arc challenge',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        lang: 'hi',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
