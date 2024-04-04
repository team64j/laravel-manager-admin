<script>
import { RouterView } from 'vue-router'
import { Notifications } from '@kyvg/vue3-notification'
import GlobalMenu from './components/GlobalMenu/GlobalMenu.vue'
import GlobalTabs from './components/GlobalTabs/GlobalTabs.vue'
import Sidebar from './components/Sidebar/Sidebar.vue'
import Tooltip from './components/Tooltip/Tooltip.vue'
import Search from './components/Search/Search.vue'
import router from './router'

export default {
  name: 'App',
  components: { Notifications, RouterView, Tooltip, GlobalMenu, GlobalTabs, Sidebar, Search },
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
      this.$refs.sidebar && this.$refs.sidebar.$el.classList.toggle('app-sidebar__hidden', !value)
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
          router.push(to)
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
        axios.post('bootstrap').then(({ data: response }) => {
          if (response.data.routes) {
            const component = () => import('./pages/Default.vue')
            for (const route of response.data.routes) {
              router.addRoute({ ...route, component })
            }

            this.$store.dispatch('set', { config: response.data.config || {} })
            this.$store.dispatch('set', { lang: response.data.lang || {} })

            document.title = response.data.config['site_name']

            response.data.assets && this.assets(response.data.assets)

            Object.entries(import.meta.glob('./components/*/*.vue', { eager: true })).
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
      router.push({ name: 'Login' })
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
      event.currentTarget.classList.add('active')
      event.currentTarget.addEventListener('mousemove', this.splitterMove)
      event.currentTarget.addEventListener('mouseup', this.splitterUp)
    },
    splitterMove (event) {
      this.sidebarWidth = Math.min(Math.max(this.w - (this.x - event.clientX), 64), window.innerWidth * .64)
      this.$store.dispatch('Storage/set', { sidebarWidth: this.sidebarWidth })
    },
    splitterUp (event) {
      event.currentTarget.classList.remove('active')
      event.currentTarget.removeEventListener('mousemove', this.splitterMove)
      event.currentTarget.removeEventListener('mouseup', this.splitterUp)
    },
    pushRouter (route, callback) {
      if (typeof route === 'string') {
        route = router.resolve(route)
      }

      router.push(route).then(callback)
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
  <div v-if="loaded" class="app flex flex-col h-full w-full">
    <notifications position="top right" class="app-notifications" :dangerouslySetInnerHtml="true"/>

    <template v-if="layout">
      <global-menu :data="layout?.['menu']" @action="action"/>

      <div class="app-main">
        <template v-if="layout?.['sidebar']?.slots">
          <sidebar ref="sidebar" class="w-80 shrink-0 shadow-2xl md:shadow overflow-hidden"
                   :style="{ width: `${sidebarWidth}px` }"
                   :layout="layout?.['sidebar']"
                   :class="{ 'app-sidebar__hidden': !$store.getters.get('Storage.root.sidebarShow', true) }"
                   @action="action"/>
          <div class="relative z-10 md:z-20 group shrink-0 w-0 cursor-col-resize" @mousedown="splitterDown">
            <div class="absolute h-full w-1.5 -ml-0.5"/>
            <div class="absolute h-full w-0.5 group-hover:bg-blue-500 transition"/>
            <div class="fixed z-50 w-full h-full left-0 top-0 hidden cursor-col-resize group-active:block"/>
          </div>
        </template>
        <global-tabs class="grow flex flex-col overflow-hidden" @action="action"/>
      </div>

      <search ref="search"/>
      <tooltip/>
    </template>

    <router-view v-else/>
  </div>
</template>

<style scoped>
.app-main {
  @apply grow flex flex-row overflow-hidden
}
</style>
