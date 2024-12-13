<script>
import { RouterView } from 'vue-router'
import { Notifications } from '@kyvg/vue3-notification'
import GlobalMenu from '../GlobalMenu/GlobalMenu.vue'
import GlobalTabs from '../GlobalTabs/GlobalTabs.vue'
import Datepicker from '../Datepicker/Datepicker.vue'
import Component from '../Layout/Component.vue'
import Tooltip from '../Tooltip/Tooltip.vue'
import Search from '../Search/Search.vue'
import router from '../../router'
import store from '../../store'
import Logo from '../Layout/Logo.vue'
import Modal from '../Modal/Modal.vue'

import('./App.css')

export default {
  name: 'App',
  components: {
    Logo,
    Notifications,
    RouterView,
    Tooltip,
    Datepicker,
    GlobalMenu,
    GlobalTabs,
    Component,
    Search,
    Modal
  },
  data () {
    return {
      layout: null,
      loaded: false,
      sidebarWidth: this.$store.getters.get('Storage.sidebarWidth', 26),
      isMobile: this.calcIsMobile()
    }
  },
  computed: {
    currentRoute () {
      return router.currentRoute.value
    },
    store () {
      return store
    },
    slotTop () {
      return this.layout.find(i => i.slot === 'top')
    },
    slotTopLeft () {
      return this.layout.find(i => i.slot === 'top.left')
    },
    slotTopRight () {
      return this.layout.find(i => i.slot === 'top.right')
    },
    slotLeft () {
      return this.layout.find(i => i.slot === 'left')
    },
    slotLeftTop () {
      return this.layout.find(i => i.slot === 'left.top')
    },
    slotLeftBottom () {
      return this.layout.find(i => i.slot === 'left.bottom')
    },
    slotSidebar () {
      return this.layout.find(i => i.slot === 'sidebar')
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
      this.$el.classList.toggle('app-sidebar-hidden', !value)
    }
  },
  created () {
    this.bootstrap()

    window.addEventListener('resize', event => {
      const check = this.calcIsMobile()
      if (check !== this.isMobile) {
        this.isMobile = check
      }
    })

    document.documentElement.classList.toggle(
        'dark',
        this.$store.getters.get('Storage.root.dark', false)
    )

    // window['confirm'] = (message) => {
    //   const promise = new Promise(async function(resolve, reject) {
    //     const dialog = document.createElement('div')
    //     dialog.className = 'fixed flex flex-wrap justify-center rounded z-50 bg-white dark:bg-gray-600 top-1/2 left-1/2 w-96 max-w-full h-auto max-h-full -translate-x-1/2 -translate-y-1/2 p-5 shadow-xl'
    //     dialog.innerHTML = `<div class="grow w-full pb-3">${message}</div>`
    //
    //     const btnCancel  = document.createElement('button')
    //     btnCancel.className = 'btn-sm mx-1 px-4 border-none'
    //     btnCancel.innerHTML = 'Cancel'
    //     btnCancel.onclick = () => resolve(false)
    //
    //     const btnOk = document.createElement('button')
    //     btnOk.className = 'btn-sm btn-green mx-1 px-4 border-none'
    //     btnOk.innerHTML = 'OK'
    //     btnOk.onclick = () => resolve(true)
    //
    //     dialog.append(btnCancel, btnOk)
    //
    //     document.body.append(dialog)
    //   })
    //
    //   return promise
    // }
  },
  mounted () {
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
      this.loaded = false

      if (this.$store.getters.get('Storage.token')) {
        axios.post('/bootstrap').then(({ data: response }) => {
          if (response.data) {
            this.loaded = true
            this.layout = response.layout

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

            if (response.data?.config?.['site_name']) {
              document.title = response.data.config['site_name']
            }

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

      this.loaded = true
      this.layout = false
      this.$.slots = {}
      router.to('/login')
    },
    assets (assets) {
      assets.forEach(i => {
        switch (i.rel) {
          case 'plugin':
            import(/* @vite-ignore */i.src).then(j => {
              window['app']._.appContext.app.use(j.default)
            })
            break

          case 'component':
            import(/* @vite-ignore */i.src).then(j => {
              window['app']._.appContext.app.component(j.default.name, j.default)
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
    onTouchstartSidebar (event) {
      this.sx = event.touches[0].clientX
      this.sl = null
      this.$refs.mid.addEventListener('touchmove', this.onTouchmoveSidebar)
      this.$refs.mid.addEventListener('touchend', this.onTouchendSidebar)
    },
    onTouchmoveSidebar (event) {
      if (this.isMobile) {
        this.sl = null

        if (event.touches[0].clientX - this.sx < 0) {
          this.sl = false
          if (store.getters.get('Storage.root.sidebarShow')) {
            let x = event.touches[0].clientX - this.sx

            if (Math.abs(x) > this.$refs.sidebar.offsetWidth) {
              x = -this.$refs.sidebar.offsetWidth
            }

            this.$refs.sidebar.style.transform = 'translateX(' + x + 'px)'
            this.$refs.sidebar.style.transition = 'none'
          }
        } else if (this.sx < 40) {
          this.sl = true
          if (!store.getters.get('Storage.root.sidebarShow')) {
            let x = this.$refs.sidebar.offsetWidth - (event.touches[0].clientX - this.sx)

            if (x < 0) {
              x = 0
            }

            this.$refs.sidebar.style.transform = 'translateX(-' + x + 'px)'
            this.$refs.sidebar.style.transition = 'none'
          }
        }
      }
    },
    onTouchendSidebar (event) {
      let x = event.changedTouches[0].clientX - this.sx

      if (Math.abs(x) > this.$refs.sidebar.offsetWidth / 3) {
        this.sl !== null && store.dispatch('set', { ['Storage.root.sidebarShow']: this.sl })
      }

      this.$refs.mid.removeEventListener('touchmove', this.onTouchmoveSidebar)
      this.$refs.mid.removeEventListener('touchend', this.onTouchendSidebar)
      this.$refs.sidebar.style.transform = null
      this.$refs.sidebar.style.transition = null
    },
    splitterDown (event) {
      this.x = event.clientX
      this.w = this.convertRemToPixels(this.sidebarWidth)
      this.$el.classList.add('app-sidebar-resize')
      event.currentTarget.classList.add('active')
      event.currentTarget.addEventListener('mousemove', this.splitterMove)
      event.currentTarget.addEventListener('mouseup', this.splitterUp)
    },
    splitterMove (event) {
      this.sidebarWidth = this.convertPixelsToRem(
          Math.min(Math.max(this.w - (this.x - event.clientX), 64), window.innerWidth * .5))
      this.$store.dispatch('Storage/set', { sidebarWidth: this.sidebarWidth })
    },
    splitterUp (event) {
      this.$el.classList.remove('app-sidebar-resize')
      event.currentTarget.classList.remove('active')
      event.currentTarget.removeEventListener('mousemove', this.splitterMove)
      event.currentTarget.removeEventListener('mouseup', this.splitterUp)
    },
    pushRouter (route, callback) {
      this.$nextTick(() => router.to(route).then(callback))
    },
    calcIsMobile () {
      return 'ontouchstart' in window || navigator.maxTouchPoints || navigator['msMaxTouchPoints'] ||
          window.innerWidth <
          1024
    },
    convertRemToPixels (rem) {
      return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
    },
    convertPixelsToRem (px) {
      return px / parseFloat(getComputedStyle(document.documentElement).fontSize)
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
    },
    'modal:component' (event, ctx) {
      if (ctx['url']) {
        this.$refs.modal.setOwner(ctx).setUrl(ctx['url']).open()
      }
    },
    collapse (value) {
      this.$store.dispatch('set', { ['Storage.root.sidebarShow']: !value })
    }
  }
}
</script>

<template>
  <div v-if="loaded" class="app"
       :class="{
        'app-mobile': isMobile,
        'app-sidebar-hidden': !store.getters.get('Storage.root.sidebarShow', true)
      }">
    <template v-if="layout">
      <div v-if="slotTop || slotTopLeft || slotTopRight" class="grow-0 shrink-0 flex justify-between z-40 shadow bg-gray-750 text-white/80 dark app-position-horizontal">
        <div class="grow-0 flex app-position-start">
          <Component v-if="slotTopLeft" :currentRoute="currentRoute" :layout="slotTopLeft" @action="action"/>
        </div>
        <div class="grow flex justify-center">
          <Component v-if="slotTop" :currentRoute="currentRoute" :layout="slotTop" @action="action"/>
        </div>
        <div class="grow-0 flex app-position-end">
          <Component v-if="slotTopRight" :currentRoute="currentRoute" :layout="slotTopRight" @action="action"/>
        </div>
      </div>
      <div ref="mid" class="grow flex flex-row overflow-hidden relative" @touchstart="onTouchstartSidebar">
        <div v-if="slotLeft || slotLeftTop || slotLeftBottom"
             class="z-30 grow-0 shrink-0 flex flex-col justify-between bg-gray-800 w-12 app-left app-position-vertical dark">
          <div class="grow-0 flex">
            <Component v-if="slotLeftTop" :currentRoute="currentRoute" :layout="slotLeftTop" @action="action"/>
          </div>
          <div class="grow flex items-center">
            <Component v-if="slotLeft" :currentRoute="currentRoute" :layout="slotLeft" @action="action"/>
          </div>
          <div class="grow-0 flex app-position-end">
            <Component v-if="slotLeftBottom" :currentRoute="currentRoute" :layout="slotLeftBottom" @action="action"/>
          </div>
        </div>
        <div v-if="slotSidebar" ref="sidebar"
             class="relative z-20 grow-0 shrink-0 max-w-full lg:max-w-[75%] app-sidebar dark"
             :style="{ width: sidebarWidth + `rem` }">
          <Component :currentRoute="currentRoute" :layout="slotSidebar" @action="action"/>
          <div class="app-resizer grow-0 shrink-0 flex" @mousedown="splitterDown">
            <div/>
          </div>
        </div>
        <div class="grow flex flex-col overflow-hidden z-10 app-main">
          <global-tabs :currentRoute="currentRoute" @action="action"/>
        </div>
      </div>

      <modal ref="modal"/>
      <search ref="search"/>
      <tooltip ref="tooltip"/>
      <datepicker ref="datepicker"/>
    </template>

    <router-view v-else/>

    <notifications position="top right" class="app-notifications" :dangerouslySetInnerHtml="true"/>
  </div>
  <div v-else class="flex flex-col h-full justify-center items-center">
    <logo class="w-24 h-24 animate-ping"/>
  </div>
</template>
