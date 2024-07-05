<script>
import { compile, h, shallowReactive, toRaw } from 'vue'
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

import('./App.css')

export default {
  name: 'App',
  computed: {
    store () {
      return store
    }
  },
  components: { Notifications, RouterView, Tooltip, Datepicker, GlobalMenu, GlobalTabs, Component, Search },
  data () {
    return {
      loaded: false,
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
      this.$el.classList.toggle('app-sidebar-hidden', !value)
    }
  },
  created () {
    this.bootstrap()

    document.documentElement.classList.toggle(
        'dark',
        this.$store.getters.get('Storage.root.dark', false)
    )
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

            const stack = {}

            this.initLayout(response.layout, stack)

            for (const i in stack) {
              this.$.slots[i] = () => stack[i]
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
      this.$.slots = {}
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
      this.$el.classList.add('app-sidebar-resize')
      event.currentTarget.classList.add('active')
      event.currentTarget.addEventListener('mousemove', this.splitterMove)
      event.currentTarget.addEventListener('mouseup', this.splitterUp)
    },
    splitterMove (event) {
      this.sidebarWidth = Math.min(Math.max(this.w - (this.x - event.clientX), 64), window.innerWidth * .64)
      this.$store.dispatch('Storage/set', { sidebarWidth: this.sidebarWidth })
    },
    splitterUp (event) {
      this.$el.classList.remove('app-sidebar-resize')
      event.currentTarget.classList.remove('active')
      event.currentTarget.removeEventListener('mousemove', this.splitterMove)
      event.currentTarget.removeEventListener('mouseup', this.splitterUp)
    },
    pushRouter (route, callback) {
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
    },
    initLayout (layout, stack) {
      layout = toRaw(layout || this.setLayoutData())

      if (!layout) {
        return
      }

      if (layout.component) {
        if (layout.slot) {
          if (!stack[layout.slot]) {
            stack[layout.slot] = []
          }

          stack[layout.slot].push(this.createComponent(layout))
          return
        }

        return this.createComponent(layout, stack)
      }

      if (typeof layout === 'string') {
        layout = layout.replace(/href=/g, 'to=').
            replace(/<a(.*?)>/g, '<router-link$1>').
            replace(/(<\/a>)/g, '</router-link>')
        return h(compile(layout))
      }

      if (typeof layout === 'object') {
        let obj
        if (Array.isArray(layout)) {
          obj = []
          layout.forEach(i => obj.push(this.initLayout(i, stack)))
        } else {
          obj = {}
          for (let i in layout) {
            const slots = this.initLayout(layout[i], stack)
            obj[i] = () => slots
          }
        }

        return obj
      }

      return layout
    },
    setLayoutData (data) {
      data = data || toRaw(this.layout)

      for (let i in data) {
        if (typeof data[i]?.data === 'string') {
          const keys = data[i].data.split('.')

          if (!data[i].attrs) {
            data[i].attrs = {}
          }

          data[i].attrs.data = this.findValue(keys, this.$props)
          data[i].attrs.onAction = this.action
        } else if (data[i]?.slots) {
          data[i].slots = this.setLayoutData(data[i].slots)
        } else if (Array.isArray(data[i])) {
          data[i] = this.setLayoutData(data[i])
        }
      }

      return data
    },
    createComponent (data, stack) {
      let component

      try {
        component = this.$.appContext.components[data.component] ||
            (data.component && (new Function('return ' + data.component + '')).call(this))
      } catch (exception) {
        return
      }

      if (!component) {
        return
      }

      const slots = data.slots && this.initLayout(data.slots, stack)
      const attrs = toRaw(data.attrs || {})

      attrs.key = data.model || data.component.name || ''
      attrs.modelValue = data?.attrs?.value

      if (attrs.key === 'data') {
        if (!attrs.data) {
          attrs.data = this.data
        } else {
          attrs.modelValue = this.data
        }
      } else if (this.data?.[attrs.key] !== undefined) {
        attrs.modelValue = this.data[attrs.key]
      } else if (~attrs.key.indexOf('.')) {
        attrs.modelValue = this.findValue(attrs.key.split('.'), this.$props)
      }

      if ((component?.extends?.props || component?.props)?.['meta']) {
        attrs.meta = attrs.meta ?? this.meta
      }

      if ((component?.extends?.props || component?.props)?.['error']) {
        attrs.error = this.errors?.[attrs.key]
      }

      (component.extends?.emits ?? component.emits ?? []).forEach(emit => {
        if (emit === 'action') {
          attrs['onAction'] = this.action
        } else if (emit === 'update:props') {
          attrs['onUpdate:props'] = (args) => this.updateProps(__attrs, args)
        } else if (emit === 'update:modelValue') {
          attrs['onUpdate:modelValue'] = this.updateModelValue
        }
      })

      const __attrs = shallowReactive(attrs)

      return h(component, __attrs, slots)
    },
    setDataValue (keys, value, data, first) {
      const key = keys[0]

      if (!first && data && data[key] === undefined) {
        data[key] = {}
      }

      if (data[key] !== undefined) {
        if (keys[1] !== undefined) {
          keys.shift()
          this.setDataValue(keys, value, data[key])
        } else {
          data[key] = value
        }
      }
    },
    findValue (keys, data) {
      const key = keys[0]
      let value

      if (data[key] !== undefined) {
        if (keys[1] !== undefined) {
          keys.shift()
          value = this.findValue(keys, data[key])
        } else {
          value = data[key]
        }
      }

      return value
    },
    setValue (key, value) {
      if (~key.indexOf('.')) {
        if (this.data[key] !== undefined) {
          this.data[key] = value
        } else {
          this.setDataValue(key.split('.'), value, this.$props, true)
        }
      } else {
        this.data[key] = value
      }
    },
    updateModelValue (value, instance) {
      if (!instance) {
        return
      }

      const key = typeof instance === 'object' ? instance._.vnode.key : instance

      this.setValue(key, value)

      if (instance?.relation?.['key']) {
        const empty = !(Array.isArray(value) ? value.length : (!isNaN(parseFloat(value))
            && !isNaN(value - 0)) ? parseFloat(value) : value)

        this.setValue(instance.relation['key'],
            empty ? instance.relation['falseValue'] : instance.relation['trueValue'])

        if (empty && instance.relation['notEmpty']) {
          this.$nextTick(() => this.setValue(key, instance.trueValue))
        }
      }

      this.$emit('update:modelValue', ...arguments)
    },
    updateProps (oldValue, newValue) {
      Object.assign(oldValue, newValue)
    }
  }
}
</script>

<template>
  <div v-if="loaded" class="app"
       :class="{ 'app-sidebar-hidden': !store.getters.get('Storage.root.sidebarShow', true) }">
    <template v-if="Object.values($slots).length">
      <div id="app-slot-top" class="grow-0 shrink-0 border-b dark:border-b-black/30">
        <slot name="top"/>
      </div>
      <div class="grow flex flex-row overflow-hidden relative">
        <div id="app-slot-left" class="grow-0 shrink-0 border-r dark:border-r-black/30">
          <slot name="left"/>
        </div>
        <div class="grow flex flex-row overflow-hidden">
          <div id="app-slot-sidebar" class="grow-0 shrink-0 app-sidebar" :style="{ width: `${sidebarWidth}px` }">
            <slot name="sidebar"/>
          </div>
          <div class="app-resizer grow-0 shrink-0 flex" @mousedown="splitterDown">
            <div/>
          </div>
          <div id="app-slot-main" class="grow flex flex-col overflow-hidden">
            <slot name="main"/>
          </div>
        </div>
        <div id="app-slot-right" class="grow-0 shrink-0 border-l dark:border-l-black/30">
          <slot name="right"/>
        </div>
      </div>
      <div id="app-slot-bottom" class="grow-0 shrink-0 border-t dark:border-t-black/30">
        <slot name="bottom"/>
      </div>

      <search ref="search"/>
      <tooltip ref="tooltip"/>
      <datepicker ref="datepicker"/>
    </template>

    <router-view v-else/>

    <notifications position="top right" class="app-notifications" :dangerouslySetInnerHtml="true"/>
  </div>
  <div v-else class="flex flex-col h-full justify-center items-center">
    <img src="../../../img/logo.svg" alt="" class="w-24 h-24 animate-ping">
  </div>
</template>
