import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves this repo at https://<user>.github.io/tasktail/
export default defineConfig({
  base: '/tasktail/',
  plugins: [react(), tailwindcss()],
})
