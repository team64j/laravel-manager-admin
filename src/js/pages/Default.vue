<script>
import { h } from 'vue'
import router from '../router'
import Component from '../components/Layout/Component.vue'

export default {
  name: 'DefaultPage',
  components: { Component },
  data () {
    return {
      url: null,
      data: null,
      meta: null,
      layout: null,
      errors: null,
      loaded: false
    }
  },
  mounted () {
    this.get()
  },
  methods: {
    action () {
      if (typeof this[arguments[0]] === 'function') {
        this[arguments[0]](...Array.from(arguments).splice(1))
      } else {
        this.$emit('action', ...arguments)
      }
    },
    get () {
      const url = this.$route?.['meta']?.['url'] ? this.$route['meta']['url'] : this.$route['path']

      this.$emit('action', 'setTab', {
        key: this._.vnode.key,
        changed: false,
        loading: true,
        meta: {
          title: this.$route?.['meta']?.['title'] !== undefined ? this.$route['meta']['title'] : '...'
        }
      })

      this.data = null
      this.meta = null
      this.errors = null
      this.loaded = true

      if (!this.$route['meta']['group']) {
        this.layout = null
      }

      axios.get(url, {
        params: this.$route['query']
      }).then(r => {
        r?.data && this.setData(r.data, null, r.request.responseURL)
      }).finally(() => {
        this.$emit('action', 'setTab', {
          key: this._.vnode.key,
          changed: false,
          loading: false
        })
      })
    },
    custom ({ action, stay }) {
      this.errors = null

      this.$emit('action', 'setTab', {
        key: this._.vnode.key,
        changed: false,
        loading: true
      })

      axios[action.method](action.url, { ...this.data, ...(action.params || {}) }).
          then(({ data }) => {
            this.setData(data, stay)

            this.$store.dispatch('set', {
              action: action.action.split(':')[1],
              data: Object.assign({}, this.data),
              route: router.key(this.$route),
              actionUpdate: Date.now()
            })
          }).catch(({ response }) => {
        if (response?.data.errors) {
          this.errors = response.data.errors
        }
      }).finally(() => {
        this.$emit('action', 'setTab', {
          key: this._.vnode.key,
          changed: false,
          loading: false
        })
      })
    },
    save ({ stay }) {
      const url = this.$route?.['meta']?.['url'] ? this.$route['meta']['url'] : this.$route['matched'][0]['path']

      this.errors = null

      this.$emit('action', 'setTab', {
        key: this._.vnode.key,
        changed: false,
        loading: true
      })

      const isNumericId = !isNaN(this.$route['params']['id'] - 0)
      const method = isNumericId ? 'patch' : 'post'
      const action = isNumericId ? 'update' : 'create'

      axios[method](url, this.data).
          then(({ data }) => {
            this.setData(data, stay)

            this.$store.dispatch('set', {
              action: action,
              data: Object.assign({}, this.data),
              route: router.key(this.$route),
              actionUpdate: Date.now()
            })
          }).catch(({ response }) => {
        if (response.data.errors) {
          this.errors = response.data.errors
        }
      }).finally(() => {
        this.$emit('action', 'setTab', {
          key: this._.vnode.key,
          changed: false,
          loading: false
        })
      })
    },
    delete () {
      if (confirm('OK ?')) {
        const url = this.$route?.['meta']?.['url'] ? this.$route['meta']['url'] : this.$route['path']

        axios.delete(url, this.data).
            then(() => {
              this.$store.dispatch('set', {
                action: 'delete',
                data: Object.assign({}, this.data),
                route: router.key(this.$route),
                actionUpdate: Date.now()
              })

              this.$emit('action', 'closeTab')
            })
      }
    },
    cancel () {
      this.$emit('action', 'closeTab')
    },
    pushRouter (route) {
      if (!route.matched) {
        route = router.parse(route)
      }

      this.$emit(
          'action',
          'pushRouter',
          route,
          router.key(this.$route, route) && this.get
      )
    },
    inputChangeQuery (event, ctx) {
      const route = router.parse({
        query: Object.assign({}, router.currentRoute.value.query, { [ctx._.vnode.key]: event.target.value })
      })
      this.$emit('action', 'pushRouter', route, this.get)
    },
    updateModelValue () {
      this.$emit('action', 'setTab', {
        changed: true
      })
    },
    setData (data, stay, url) {
      if (data?.['meta']?.['redirect']) {
        location.href = data['meta']['redirect']
        return
      }

      if (data?.['meta']?.['reload']) {
        location.reload()
        return
      }

      if (stay === 0) {
        this.$emit('action', 'closeTab')
        return
      } else if (stay === 1) {
        this.$emit('action', 'toTab', { ...this.$route, params: { id: 'new' } })
        return
      }

      Object.assign(this.$data, data)

      const meta = {}

      if (data['meta']?.['title'] !== undefined) {
        meta['title'] = data['meta']['title']
      }

      if (data['meta']?.['icon'] !== undefined) {
        meta['icon'] = data['meta']['icon']
      }

      if (Object.values(meta).length) {
        this.$emit('action', 'setTab', {
          key: this._.vnode.key,
          meta
        })
      }

      this.url = url
      this.loaded = true
    }
  },
  setup2 () {
    return function () {
      return h('div', {
            class: 'app-page__default w-full h-full flex flex-col overflow-auto'
          },
          this.loaded ?
              h(Component, {
                url: this.url,
                data: this.data,
                meta: this.meta,
                layout: this.layout,
                errors: this.errors,
                onAction: this.action,
                'onUpdate:modelValue': this.updateModelValue
              }) :
              h('div', { class: 'flex items-center justify-center grow' },
                  h('div', {
                    class: 'inline-block rounded-full border-4 border-slate-200 border-r-blue-500 dark:border-white/20 dark:border-r-blue-500 h-20 w-20 animate-spin transition duration-500 opacity-0',
                    onVnodeMounted (ctx) {
                      setTimeout(() => ctx.el.classList.remove('opacity-0'), 100)
                    }
                  })
              )
      )
    }
  }
}
</script>

<template>
  <div class="app-page__default w-full h-full flex flex-col overflow-auto">
    <Component v-if="this.loaded"
               :url="url"
               :data="data"
               :meta="meta"
               :layout="layout"
               :errors="errors"
               @action="action"
               @update:modelValue="updateModelValue"/>
    <div v-else class="flex items-center justify-center grow">
      <div
          class="inline-block rounded-full border-4 border-slate-200 border-r-blue-500 dark:border-white/20 dark:border-r-blue-500 h-20 w-20 animate-spin transition duration-500 opacity-100"/>
    </div>
  </div>
</template>
