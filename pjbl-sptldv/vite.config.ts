import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

declare const process: { env: Record<string, string | undefined> };

// Port API lokal (dev/server.mjs) — mensimulasikan Cloudflare Worker + D1 + R2
const API_PORT = process.env.API_PORT || '8787';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Izinkan host preview (Cloudflare/e2b/ngrok/dll)
    allowedHosts: true,
    cors: true,
    hmr: { clientPort: 443, protocol: 'wss' },
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: false,
        ws: false,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
});
