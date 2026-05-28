import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Extract origin from VITE_API_URL if it exists, otherwise default to localhost:5000
  let proxyTarget = 'http://localhost:5000';
  if (env.VITE_API_URL) {
    try {
      proxyTarget = new URL(env.VITE_API_URL).origin;
    } catch (e) {
      proxyTarget = env.VITE_API_URL;
    }
  }

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
