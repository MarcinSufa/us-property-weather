import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('../apps/web', import.meta.url)),
  cacheDir: fileURLToPath(new URL('./dist/vite-cache', import.meta.url)),
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5273,
    strictPort: true,
    proxy: { '/graphql': 'http://localhost:4100' },
  },
});
