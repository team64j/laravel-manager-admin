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
    path: '/auth/login',
    component: () => import('../pages/Login.vue'),
    meta: {
      hidden: true
    }
  },
  {
    path: '/auth/logout',
    component: () => import('../pages/Logout.vue'),
    meta: {
      hidden: true
    }
  },
  {
    path: '/auth/forgot',
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
  /**
   * @see https://github.com/nuxt/nuxt/issues/27982
   */
  const meta = { ...to.meta }
  delete meta['__navigationId']
  to.meta = meta

  if (!store.getters.get('Storage.token') && to.path !== '/auth/login') {
    next('/auth/login')
  } else {
    next()
  }
})

router.key = (route, compareRoute) => {
  let queryKey

  if (compareRoute) {
    queryKey = true

    if (route?.meta['queryKey'] && compareRoute?.meta['queryKey'] && route?.query['id'] !== undefined &&
      compareRoute?.query['id'] !== undefined) {
      queryKey = route.query['id'] === compareRoute.query['id']
    }

    return (route?.meta?.group ?
      ((route.name && route.name === compareRoute.name) || route.matched[0]?.path === compareRoute.matched[0]?.path) :
      route.path === compareRoute.path) && queryKey
  } else {
    queryKey = ''

    if (route?.meta['queryKey'] && route?.query['id'] !== undefined) {
      queryKey = '/' + route.query['id']
    }

    return (route?.meta?.group ? (route.name || route.matched[0]?.path || route.path) : route.path) + queryKey
  }
}

/**
 * @param route - Raw route location to resolve
 * @see router.resolve()
 */
router.parse = (route) => {
  if (!route) {
    return null
  }

  if (typeof route === 'string') {
    if (/^(http|https):\/\/[^ "]+$/.test(route)) {
      route = route.replace((store.getters.get('Storage.hostname') || document.baseURI).replace(/\/$/g, ''), '')
    }

    route = router.resolve(route)
  } else {
    if (/^(http|https):\/\/[^ "]+$/.test(route.path)) {
      route.path = route.path.replace((store.getters.get('Storage.hostname') || document.baseURI).replace(/\/$/g, ''), '')
    }
  }

  if (route.path && route.params) {
    route.params = { ...route.params }
    const query = route.path.split('?')[1] ?? null

    if (query) {
      if (!route.query) {
        route.query = {}
      }

      for (const i of query.split('&')) {
        const q = i.split('=')
        route.query[q[0]] = q[1]
      }
    }

    Object.entries(route.params).forEach(([k, v]) => {
      if (!(v === undefined || v === null)) {
        const re = new RegExp(':' + k, 'g')
        v = v.toString()

        if (/:/.test(route?.path)) {
          route.path = route.path.replace(re, v).
            replace(/\/\//g, '/').
            replace(/\/$/, '')
        }

        for (const q in route?.query) {
          if (route.query[q] === ':' + k) {
            route.query[q] = v
          }
        }

        if (route?.query?.[k]) {
          route.query[k] = route.query[k].replace(re, v)
        }

        //delete route.params[k]
      }
    })

    // for(const i in route.params) {
    //   if (route.params[i] === null) {
    //     delete route.params[i]
    //   }
    // }
  }

  return router.resolve(route)
}

/**
 * @param route - Raw route location to push
 * @see router.push()
 */
router.to = (route) => router.push(router.parse(route))

export default router
