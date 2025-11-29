import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import autofit from 'autofit.js'
import {createPersistedState } from 'pinia-plugin-persistedstate'

const app = createApp(App)

const pinia = createPinia()
const persistedstate = createPersistedState()
pinia.use(persistedstate)
app.use(pinia)
app.use(router)
app.use(ElementPlus)

import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
NProgress.configure({
  easing: 'ease',
  speed: 500,
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.3
})
//路由监听
router.beforeEach((to, from, next) => {
  NProgress.start();
  next();
});
//路由跳转结束
router.afterEach(() => {
  NProgress.done()
})

// autofit.init({
//   dh: 1080,
//   dw: 1920,
//   el: "#app",
//   resize: false,
// });

app.mount('#app')