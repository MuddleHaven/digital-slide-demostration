import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/fullScreen',
    component: () => import('../components/Openseadragon.vue'),
  },
  {
    path: '/test',
    component: () => import('../components/OpenseadragonAC.vue'),
  },
  {
    path: '/',
    component: () => import('../views/LayoutView.vue'),
    children: [
      {
        path: '/list',
        component: () => import('../views/Slice/SliceListAI.vue'),
      },
      {
        path: '/normalset',
        component: () => import('../views/Setting/NormalSetting.vue'),
      },
      {
        path: '/directset',
        component: () => import('../views/Setting/DirectorSetting.vue'),
      },
      {
        path: '/sliceDetailList',
        component: () => import('../views/Slice/SliceDetailList.vue')
      },
      {
        path: '/databoard',
        component: () => import('../views/DataBoard/DateBoardMange.vue')
      },
      {
        path: '/:pathMatch(.*)*',
        component: () => import('../views/NotFound.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})
// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token'); //获取token
  if (to.path !== '/login' && !token) {
    next('/login');
  } else if (token && to.path === '/login') {
    next('/list');
  }
  next();
});

export default router;
