import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { budgetTipPlugin } from './server/budgetTip.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'OPENAI_') // server-side only, never exposed to the client
  return {
    plugins: [react(), tailwindcss(), budgetTipPlugin(env)],
  }
})
