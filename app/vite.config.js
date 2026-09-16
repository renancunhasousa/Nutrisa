import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { localApiPlugin } from '../server/devApi.js';
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, '..', ''), ...loadEnv(mode, '.', ''), ...process.env };
  for (const key of ['GEMINI_API_KEY', 'VITE_GEMINI_API_KEY', 'GEMINI_MODELS', 'AI_ACCESS_TOKEN']) {
    if (env[key]) process.env[key] = env[key];
  }
  return {
    server: { host: true, port: 5173 },
    // Legacy provider keys must never be injected into browser code.
    envPrefix: ['VITE_SUPABASE_', 'VITE_GOOGLE_'],
    plugins: [react(), tailwindcss(), localApiPlugin()],
  };
});
