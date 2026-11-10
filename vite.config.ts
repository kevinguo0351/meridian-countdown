import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig(({ mode }) => {
  const single = mode === 'single'
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      ...(single
        ? [viteSingleFile({ removeViteModuleLoader: true, outputFileName: 'countdown-lockscreen.html' })]
        : []),
    ],
    build: {
      outDir: single ? 'dist-single' : 'dist',
      emptyOutDir: true,
    },
    server: {
      host: '0.0.0.0',
      port: 4731,
      strictPort: true,
    },
  }
})
