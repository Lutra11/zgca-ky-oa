import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  /** GitHub Pages 子路径部署：资源用相对路径（gitee 主线同步而来，Pages 依赖此项） */
  base: './',
  server: {
    host: '0.0.0.0',
  },
})
