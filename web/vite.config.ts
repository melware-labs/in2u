import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// En desarrollo el frontend y el backend son dos puertos distintos; el proxy
// los junta bajo un solo origen, igual que hará Vercel en producción, para
// que la cookie de sesión sea de primera parte (sin CORS).
const backend = process.env.BACKEND_URL ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': backend,
      '/oauth2': backend,
      '/login/oauth2': backend,
    },
  },
});
