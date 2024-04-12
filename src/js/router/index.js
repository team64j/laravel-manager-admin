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

router.key = (a, b) => {
  if (b) {
    return a?.meta?.group ?
      ((a.name && a.name === b.name) || a.matched[0]?.path === b.matched[0]?.path) :
      a.path === b.path
  } else {
    return a?.meta?.group ? (a.name || a.matched[0]?.path || a.path) : a.path
  }
}

/**
 * @param route - Raw route location to resolve
 * @see router.resolve()
 */
router.parse = (route) => {
  if (route.path && route.params) {
    Object.entries(route.params).forEach(([k, v]) => {
      if (!(v === undefined || v === null)) {
        const re = new RegExp(':' + k, 'g')
        v = v.toString()

        if (/:/.test(route?.path)) {
          route.path = route.path.replace(re, v).
            replace(/\/\//g, '/').
            replace(/\/$/, '')
        }

        if (route?.query?.[k]) {
          route.query[k] = route.query[k].replace(re, v)
        }
      }
    })
  }

  return router.resolve(route)
}

/**
 * @param route - Raw route location to push
 * @see router.push()
 */
router.to = (route) => router.push(router.parse(route))

export default router
