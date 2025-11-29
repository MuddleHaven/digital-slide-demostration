import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/list',
    component: () => import('@/views/SlideListView.vue'),
  },
  {
    path: '/detail',
    component: () => import('@/views/SlideDetailView.vue'),
  },
]


const router = createRouter({
  history: createWebHistory(),
  routes
})
// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.path !== '/login' && !token) {
    next('/login');
  } else if (token && to.path === '/login') {
    next('/list');
  } else {
    next();
  }
});

export default router;
