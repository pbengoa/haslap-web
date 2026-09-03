import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Sin proxy: el navegador habla directo con el módulo de PrestaShop, que
// autentica por Bearer token y admite peticiones cross-origin. El destino lo
// fija VITE_API_URL y lo lee el propio cliente, en `src/lib/haslapapp.ts`.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
});
