/* eslint-disable no-undef */
import { defineConfig,loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const tissueType = mode
  // eslint-disable-next-line no-undef
  const env = loadEnv(mode, process.cwd())
  const title = env.VITE_APP_TITLE || '胃组织病理分析系统'
  return {
    server: {
      port: 8888,
      proxy: {
        '/api': {
          target: 'http://113.57.115.197:9526',
          // target: 'http://localhost:9526',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    // optimizeDeps: {
    //   exclude: ["@annotorious/openseadragon"],
    // },
    plugins: [
      vue(),
      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: false, // css in js
          }),
        ],
      }),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(
            /<title>.*?<\/title>/,
            `<title>${title}</title>`
          );
        }
      },
    ],
    define: {
      __TISSUE_TYPE__: JSON.stringify(tissueType),
      __TISSUE_APP_TITLE__: JSON.stringify(title),
    },
    build: {
      outDir: mode === 'production' ? 'dist' : `dist/${tissueType}`
    }
  }
})
