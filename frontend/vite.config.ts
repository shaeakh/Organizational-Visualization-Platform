import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const port = parseInt(env.VITE_PORT || '5173', 10);
  const backendPort = env.VITE_BACKEND_PORT || '3001';
  const backendUrl = env.VITE_API_URL || `http://localhost:${backendPort}`;

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    server: {
      port: port,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true
        }
      }
    }
  };
});
