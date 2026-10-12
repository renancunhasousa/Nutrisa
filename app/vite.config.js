import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { localApiPlugin } from '../server/devApi.js';
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, '..', ''), ...loadEnv(mode, '.', ''), ...process.env };
  for (const key of [
    'GEMINI_API_KEY',
    'VITE_GEMINI_API_KEY',
    'GEMINI_MODELS',
    'OPENAI_API_KEY',
    'DEEPSEEK_API_KEY',
    'AI_ACCESS_TOKEN',
    'FDC_API_KEY',
    'FDC_API_BASE_URL',
    'TBCA_PARSE_API_KEY',
    'TBCA_PARSE_BASE_URL',
  ]) {
    if (env[key]) process.env[key] = env[key];
  }
  const port = Number(env.PORT) || 3000;
  return {
    server: { host: true, port },
    // Legacy provider keys must never be injected into browser code.
    envPrefix: ['VITE_SUPABASE_', 'VITE_GOOGLE_'],
    plugins: [react(), tailwindcss(), localApiPlugin()],
  };
});
