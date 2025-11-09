import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import path from 'path'

// Use the repo name as the base path so assets resolve correctly when served from GitHub Pages
const ghPagesBase = '/RDF-CM-demo/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? ghPagesBase : '/',
  plugins: [react(), tailwind()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tanstack/react-query': path.resolve(__dirname, './src/lib/simpleQuery.tsx'),
      '@heroicons/react/20/solid': path.resolve(__dirname, './src/lib/heroicons.tsx'),
    },
  },
}))
