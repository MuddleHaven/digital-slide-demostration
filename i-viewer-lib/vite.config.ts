import path from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [
    dts({
      // 自动生成类型声明文件
      outDir: 'dist/types',
      // 静态类型合并
      staticImport: true,
      // 包含类型引用
      insertTypesEntry: true,
      // 自动将类型添加到类的静态部分
      copyDtsFiles: true,
      include: ['src/**/*.ts', 'src/**/*.d.ts'],
      // 确保命名空间被正确处理
      compilerOptions: {
        preserveSymlinks: false,
      },
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts', // 入口文件
      name: 'IViewerLib', // UMD 全局变量名，可自定义
      fileName: format => `i-viewer-lib.${format}.js`, // 输出文件名
      formats: ['es', 'umd'], // 输出格式
    },
    rollupOptions: {
      // 确保外部依赖不被打包进库
      external: ['konva', 'lodash', 'nanoid', 'html2canvas'],
      output: {
        globals: {
          konva: 'Konva',
          lodash: 'lodash',
          nanoid: 'nanoid',
          html2canvas: 'html2canvas',
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:48448',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
}))
