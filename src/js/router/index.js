import { createRouter, createWebHashHistory } from 'vue-router'
import store from '../store'

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
    meta: {
      hidden: true,
    }
  },
  {
    path: '/dashboard',
    component: () => import('../pages/Default.vue'),
    meta: {
      fixed: true,
      icon: 'fa fa-home',
      title: null
    }
  },
  {
    path: '/login',
    component: () => import('../pages/Login.vue'),
    meta: {
      hidden: true
    }
  },
  {
    path: '/logout',
    component: () => import('../pages/Logout.vue'),
    meta: {
      hidden: true
    }
  },
  {
    path: '/forgot',
    meta: {
      hidden: true
    }
  },
  {
    path: '/redirect',
    component: () => import('../pages/Redirect.vue'),
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('../pages/Redirect.vue')
      }
    ],
    meta: {
      hidden: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('../pages/NotFound.vue'),
    meta: {
      icon: 'fa fa-circle-exclamation'
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (!store.getters.get('Storage.token') && to.path !== '/login') {
    next('/login')
  } else {
    next()
  }
})

export default router
