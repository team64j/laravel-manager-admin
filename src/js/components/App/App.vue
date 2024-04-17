<script>
import { RouterView } from 'vue-router'
import { Notifications } from '@kyvg/vue3-notification'
import GlobalMenu from '../GlobalMenu/GlobalMenu.vue'
import GlobalTabs from '../GlobalTabs/GlobalTabs.vue'
import Component from '../Layout/Component.vue'
import Tooltip from '../Tooltip/Tooltip.vue'
import Search from '../Search/Search.vue'
import router from '../../router'

import('./App.css')

export default {
  name: 'App',
  components: { Notifications, RouterView, Tooltip, GlobalMenu, GlobalTabs, Component, Search },
  data () {
    return {
      loaded: false,
      layout: null,
      sidebarWidth: this.$store.getters.get('Storage.sidebarWidth', 325)
    }
  },
  watch: {
    '$store.state.Storage.token' () {
      this.bootstrap()
    },
    '$store.state.Storage.root.dark' (value) {
      document.documentElement.classList.toggle('dark', value)
    },
    '$store.state.Storage.root.sidebarShow' (value) {
      this.$refs.sidebar && this.$refs.sidebar.classList.toggle('app-sidebar-hidden', !value)
    }
  },
  created () {
    this.bootstrap()

    document.documentElement.classList.toggle(
        'dark',
        this.$store.getters.get('Storage.root.dark', false)
    )

    /**
     * @see https://dennisreimann.de/articles/delegating-html-links-to-vue-router.html
     */
    window.addEventListener('click', event => {
      // ensure we use the link, in case the click has been received by a sub element
      let { target } = event
      while (target && target.tagName !== 'A') target = target.parentNode
      // handle only links that do not reference external resources
      if (target && target.matches('a:not([href*=\'://\'])') && target.href) {
        // some sanity checks taken from vue-router:
        // https://github.com/vuejs/vue-router/blob/dev/src/components/link.js#L106
        const { altKey, ctrlKey, metaKey, shiftKey, button, defaultPrevented } = event
        // don't handle with control keys
        if (metaKey || altKey || ctrlKey || shiftKey) return
        // don't handle when preventDefault called
        if (defaultPrevented) return
        // don't handle right clicks
        if (button !== undefined && button !== 0) return
        // don't handle if `target="_blank"`
        if (target && target.getAttribute) {
          const linkTarget = target.getAttribute('target')
          if (/\b_blank\b/i.test(linkTarget)) return
        }
        // don't handle same page links/anchors
        const url = new URL(target.href)
        const to = url.pathname.replace(document.baseURI.replace(/\/$/g, '').replace(location.origin, '') + '/', '/')
        if (window.location.pathname !== to && event.preventDefault) {
          event.preventDefault()
          router.to(to)
        }
      }
    })
  },
  methods: {
    action () {
      if (typeof this[arguments[0]] === 'function') {
        this[arguments[0]](...Array.from(arguments).splice(1))
      } else {
        this.$emit('action', ...arguments)
      }
    },
    bootstrap () {
      this.layout = null
      this.loaded = false

      if (this.$store.getters.get('Storage.token')) {
        axios.post('/bootstrap').then(({ data: response }) => {
          if (response.data) {
            if (response.data.routes) {
              const routes = router.getRoutes()
              const component = () => import('../../pages/Default.vue')
              for (const route of response.data.routes) {
                if (routes.some(i => (i.name || i.path) === (route.name || route.path))) {
                  continue
                }
                router.addRoute({ ...route, component })
              }
            }

            if (response.data.assets) {
              this.assets(response.data.assets)
            }

            this.$store.dispatch('set', {
              config: response.data.config || {},
              lang: response.data.lang || {}
            })

            document.title = response.data.config['site_name']

            Object.entries(import.meta.glob('../*/*.vue', { eager: true })).
                forEach(([, { default: module }]) => {
                  const name = `App` + (module.name || module.__name)
                  if (module?.['__isStatic'] && !this.$.appContext.components[name]) {
                    this.$.appContext.app.component(name, module)
                  }
                })

            if (!this.$.appContext.components.RouterView) {
              this.$.appContext.app.use(router)
            }

            this.layout = response.layout
            this.loaded = true
          } else {
            this.login()
          }
        }).catch(this.login)
      } else {
        this.login()
      }
    },
    login () {
      this.$store.dispatch('set', { ['Storage.token']: null })

      if (!this.$.appContext.components.RouterView) {
        this.$.appContext.app.use(router)
      }

      this.layout = null
      this.loaded = true
      router.to('/login')
    },
    assets (assets) {
      assets.forEach(i => {
        switch (i.rel) {
          case 'plugin':
            import(/* @vite-ignore */i.src).then(j => {
              Vue.use(j.default)
            })
            break

          case 'component':
            import(/* @vite-ignore */i.src).then(j => {
              Vue.component(j.default.name, j.default)
            })
            break

          case 'manifest':
            const fragment = document.createRange().createContextualFragment(i.source)
            document.head.appendChild(fragment)
            break

          case 'module':
            const script = document.createElement('script')
            script.setAttribute('src', i.src)
            script.setAttribute('type', 'module')
            script.setAttribute('crossorigin', 'anonymous')
            document.head.appendChild(script)
            break

          case 'css':
            document.head.innerHTML += `<link rel="stylesheet" href="${i.src}">`
            break
        }
      })
    },
    splitterDown (event) {
      this.x = event.clientX
      this.w = this.sidebarWidth
      this.$refs.sidebar.classList.add('app-sidebar-resize')
      event.currentTarget.classList.add('active')
      event.currentTarget.addEventListener('mousemove', this.splitterMove)
      event.currentTarget.addEventListener('mouseup', this.splitterUp)
    },
    splitterMove (event) {
      this.sidebarWidth = Math.min(Math.max(this.w - (this.x - event.clientX), 64), window.innerWidth * .64)
      this.$store.dispatch('Storage/set', { sidebarWidth: this.sidebarWidth })
    },
    splitterUp (event) {
      this.$refs.sidebar.classList.remove('app-sidebar-resize')
      event.currentTarget.classList.remove('active')
      event.currentTarget.removeEventListener('mousemove', this.splitterMove)
      event.currentTarget.removeEventListener('mouseup', this.splitterUp)
    },
    pushRouter (route, callback) {
      if (typeof route === 'string' || !route.path) {
        route = router.resolve(route)
      }
      router.to(route).then(callback)
    },
    inputTreeSelect (event, context) {
      this.$store.dispatch('set', { event, context })

      const input = context.$el.querySelector('input')
      if (input.classList.contains('focus')) {
        input.classList.remove('focus')
        this.$store.dispatch('set', { treeSelect: false })
      } else {
        input.classList.add('focus')
        this.$store.dispatch('set', { treeSelect: true })
      }
    }
  }
}
</script>

<template>
  <div v-if="loaded" class="app">
    <notifications position="top right" class="app-notifications" :dangerouslySetInnerHtml="true"/>

    <template v-if="layout">
      <global-menu :data="layout?.['menu']" @action="action"/>

      <div class="app-main">
        <template v-if="layout?.['sidebar']?.slots">
          <div
              ref="sidebar"
              class="app-sidebar"
              :class="{ 'app-sidebar-hidden': !$store.getters.get('Storage.root.sidebarShow', true) }"
              :style="{ width: `${sidebarWidth}px` }"
          >
            <Component :layout="layout?.['sidebar']" @action="action"/>
          </div>
          <div class="app-resizer" @mousedown="splitterDown">
            <div/>
          </div>
        </template>
        <global-tabs @action="action"/>
      </div>

      <search ref="search"/>
      <tooltip/>
    </template>

    <router-view v-else/>
  </div>
</template>
