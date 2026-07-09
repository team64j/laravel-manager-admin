import { createRouter, createWebHashHistory } from 'vue-router'
import local from '@/services/local'

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
    component: () => import('../pages/AppPage.vue'),
    meta: {
      fixed: true,
      icon: 'fa fa-home'
    }
  },
  {
    path: '/login',
    component: () => import('../pages/LoginPage.vue'),
    meta: {
      hidden: true
    }
  },
  {
    path: '/logout',
    component: () => import('../pages/LogoutPage.vue'),
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
    component: () => import('../pages/RedirectPage.vue'),
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('../pages/RedirectPage.vue')
      }
    ],
    meta: {
      hidden: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('../pages/NotFoundPage.vue'),
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
  // const meta = { ...to.meta }
  // delete meta['__navigationId']
  // to.meta = meta

  if (!__VUE_PROD_DEVTOOLS__) {
    to.meta['__navigationId'] = 0
  }

  if (!local.get('token') && to.path !== '/login') {
    next('/login')
  } else {
    next()
  }
})

router.key = (route, compareRoute) => {
  let queryKey

  if (compareRoute) {
    queryKey = true

    if (route?.meta['queryKey'] && compareRoute?.meta['queryKey'] &&
      route?.query['id'] !== undefined &&
      compareRoute?.query['id'] !== undefined) {
      queryKey = route.query['id'] === compareRoute.query['id']
    }

    return (route?.meta?.group || route.matched?.[0]?.meta?.group ?
      (
        (route.name && route.name === compareRoute.name) ||
        (route.matched?.[0]?.path && route.matched?.[0]?.path ===
          compareRoute.matched[0]?.path) ||
        (route.matched?.[0]?.meta?.group && route.matched?.[0]?.meta?.group ===
          compareRoute.matched[0]?.meta?.group)
      ) :
      route.path === compareRoute.path) && queryKey
  } else {
    queryKey = ''

    if (route?.meta['queryKey'] && route?.query['id'] !== undefined) {
      queryKey = '/' + route.query['id']
    }

    return (route?.meta?.group || route.matched?.[0]?.meta?.group ?
        (route.name || route.matched?.[0]?.path || route.path) : route.path) +
      queryKey
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
      route = route.replace(
        (local.get('hostname') || document.baseURI).replace(
          /\/$/g, ''), '')
    }

    route = router.resolve(route)
  } else {
    if (/^(http|https):\/\/[^ "]+$/.test(route.path)) {
      route.path = route.path.replace(
        (local.get('hostname') || document.baseURI).replace(
          /\/$/g, ''),
        '')
    }
  }

  return router.resolve(router.parseParams(route))
}

router.parseParams = (route) => {
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
      }
    })
  }

  return route
}

/**
 * @param route - Raw route location to push
 * @see router.push()
 */
router.to = (route) => {
  if ((route.href || route.path) && route.target) {
    window.open(router.parseParams(Object.assign(route, { path: route.href || route.path })).path, route.target)
    return router.push(router.currentRoute.value.fullPath)
  }

  return router.push(router.parse(route))
}

export default router
