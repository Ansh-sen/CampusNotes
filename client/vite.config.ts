import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:3001';
  const apiPattern = new RegExp(`^${apiUrl.replace(/\//g, '\\/')}\\/api\\/.*$`);

  return {
    build: {
      outDir: 'dist',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'fonts/*.woff2', 'images/*.png'],
        manifest: {
          name: 'CampusNotes',
          short_name: 'CampusNotes',
          description: 'Your campus notes marketplace',
          theme_color: '#1a3a8a',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: apiPattern,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'campusnotes-api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 24 * 60 * 60 // 24 hours
                }
              }
            },
            {
              urlPattern: /\.(?:js|css|png|jpg|jpeg|svg|gif|woff2)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'campusnotes-static-assets'
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
