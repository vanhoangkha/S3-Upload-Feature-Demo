import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    host: '0.0.0.0', // Bind to all interfaces for public access
    strictPort: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
