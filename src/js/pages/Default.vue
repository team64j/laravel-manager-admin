<script>
import { h, shallowRef } from 'vue'
import router from '../router'
import Component from '../components/Layout/Component.vue'
import Frame from '../components/Layout/Frame.vue'

export default {
  name: 'DefaultPage',
  data () {
    return {
      url: null,
      data: null,
      meta: null,
      layout: null,
      errors: null,
      componentName: null,
      currentComponent: null
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
      //this.currentComponent = null

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
    save (stay) {
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
              route: this.$route['name'],
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
                route: this.$route['name'],
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
      this.$emit(
          'action',
          'pushRouter',
          route,
          router.key(this.$route, router.parse(route)) && this.get
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
      this.url = url

      if (data?.['meta']?.['redirect']) {
        location.href = data['meta']['redirect']
      }

      if (data?.['meta']?.['reload']) {
        location.reload()
      }

      if (stay === 0) {
        this.$emit('action', 'closeTab')
        return
      } else if (stay === 1) {
        this.$emit('action', 'toTab', { name: this.$route['name'], params: { id: 'new' } })
        return
      }

      let component

      if (typeof data === 'string' || typeof data['layout'] === 'string') {
        this.data = data['layout'] ?? data
        this.componentName = 'frame'
        component = Frame
      } else {
        Object.assign(this.$data, data)
        this.componentName = 'page'
        component = Component

        if (data['meta']?.['title'] !== undefined || data['meta']?.['icon'] !== undefined) {
          this.$emit('action', 'setTab', {
            key: this._.vnode.key,
            meta: {
              title: data['meta']['title'] ?? '',
              icon: data['meta']['icon'] ?? ''
            }
          })
        }
      }

      if (!this.currentComponent) {
        this.currentComponent = shallowRef(component)
      }
    }
  },
  setup () {
    return function () {
      return h('div', {
        class: 'app-page__default w-full h-full flex flex-col overflow-auto'
      }, [
        this.currentComponent ?
            h(this.currentComponent, {
              url: this.url,
              data: this.data,
              meta: this.meta,
              layout: this.layout,
              errors: this.errors,
              onAction: this.action,
              'onUpdate:modelValue': this.updateModelValue
            }) :
            h('div', { class: 'flex items-center justify-center grow' },
                h('div', { class: 'app-loader animate-ping w-48 h-48 bg-no-repeat bg-center' })
            )
      ])
    }
  }
}
</script>

<style scoped>
.app-loader {
  background-image: url("../../img/logo.svg")
}
</style>
