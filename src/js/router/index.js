import { createRouter, createWebHashHistory } from 'vue-router'
import store from '../store'

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
    meta: {
      hidden: true
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../pages/Default.vue'),
    meta: {
      fixed: true,
      icon: 'fa fa-home',
      title: null
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/Login.vue'),
    meta: {
      hidden: true
    }
  },
  {
    path: '/logout',
    name: 'Logout',
    component: () => import('../pages/Logout.vue'),
    meta: {
      hidden: true
    }
  },
  {
    path: '/forgot',
    name: 'Forgot',
    meta: {
      hidden: true
    }
  },
  {
    path: '/redirect',
    name: 'Redirect',
    component: () => import('../pages/Redirect.vue'),
    children: [
      {
        path: '/redirect/:path(.*)',
        name: 'RedirectChild',
        component: () => import('../pages/Redirect.vue')
      }
    ],
    meta: {
      hidden: true
    }
  },
  {
    path: '/:path(.*)',
    component: () => import('../pages/Default.vue'),
    props: true
  },
  {
    path: '/:path(.*)/:id(\\d+)',
    component: () => import('../pages/Default.vue'),
    props: true
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
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
  if (!store.getters.get('Storage.token') && to.name !== 'Login') {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router
