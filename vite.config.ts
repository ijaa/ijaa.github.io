import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import glsl from 'vite-plugin-glsl'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    glsl({
      include: ['**/*.glsl', '**/*.vert', '**/*.frag'],
      defaultExtension: 'glsl',
      warnDuplicatedImports: false,
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.glsl'],
  },
  assetsInclude: ['**/*.glb', '**/*.png', '**/*.jpg', '**/*.webp'],
  build: {
    chunkSizeWarningLimit: 1200,
  },
})
