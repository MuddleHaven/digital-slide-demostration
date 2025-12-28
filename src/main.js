import { createApp } from 'vue'
import 'ant-design-vue/dist/reset.css';
import './style.css'
import App from './App.vue'
import router from '@/router'
import { createPinia } from 'pinia'

const pinia = createPinia()

if (import.meta.env.DEV) {
  import('./mock.js').catch((error) => {
    console.error('Failed to load mock module', error)
  })
}

const app = createApp(App)
app.use(router)
app.use(pinia)
app.mount('#app')
