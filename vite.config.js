import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    }
  },
  plugins: [
    vue(),
    tailwindcss(),
    Components({
      resolvers: [
        AntDesignVueResolver({ importStyle: false })
      ],
    })
    ,
    {
      name: 'serve-local-slices',
      configureServer(server) {
        const projectRoot = fileURLToPath(new URL('.', import.meta.url))
        const slicesRoot = path.join(projectRoot, 'Slices')

        server.middlewares.use('/Slices', (req, res, next) => {
          const rawUrl = req.url || ''
          const [rawPathname, rawQuery = ''] = rawUrl.split('?')
          if (rawQuery.includes('import')) {
            next()
            return
          }

          const requestPath = decodeURIComponent(rawPathname || '/')
          const filePath = path.join(slicesRoot, requestPath)

          fs.stat(filePath, (err, stat) => {
            if (err || !stat.isFile()) {
              next()
              return
            }

            const ext = path.extname(filePath).toLowerCase()
            if (ext === '.jpeg' || ext === '.jpg') res.setHeader('Content-Type', 'image/jpeg')
            else if (ext === '.png') res.setHeader('Content-Type', 'image/png')
            else if (ext === '.json') res.setHeader('Content-Type', 'application/json; charset=utf-8')

            fs.createReadStream(filePath).pipe(res)
          })
        })
      },
    }
  ],
})
