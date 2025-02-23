import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/', // 关键修改点
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
