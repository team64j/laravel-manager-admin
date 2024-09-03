<script>
import { getCurrentInstance, h, onMounted, reactive, ref } from 'vue'
import router from '../router'
import store from '../store'
import Component from '../components/Layout/Component.vue'

export default {
  name: 'DefaultPage',
  setup (props, { emit }) {
    const instance = getCurrentInstance()['ctx']

    const loaded = ref(false)

    const $data = reactive({
      url: null,
      data: null,
      meta: null,
      layout: null,
      errors: null
    })

    const methods = {
      submit ({ action, method, route, stay } = {}, changed = false) {
        if (route) {
          route = router.parse(route)
        } else {
          route = router.currentRoute.value
        }

        const url = route?.['meta']?.['url'] ? route['meta']['url'] : route['path']
        const isNumericId = !isNaN(route['params']['id'] - 0)

        if (action === 'cancel') {
          emit('action', 'closeTab')
          return
        } else if (action === 'save') {
          method ??= isNumericId ? 'patch' : 'post'
        } else if (action === 'delete') {
          method ??= 'delete'
        } else {
          method ??= 'get'
          action ??= 'read'
        }

        emit('action', 'setTab', {
          key: instance._.vnode.key,
          loading: true,
          meta: {
            title: $data.meta?.['title'] ?? route?.['meta']?.['title'] !== undefined ? route['meta']['title'] : '...'
          }
        })

        $data.errors = null

        axios({
          method,
          url,
          params: route.query,
          data: Object.assign({}, $data.data, route.query)
        }).
            then(r => {
              r?.data && setData(r.data, stay, r.request.responseURL, action)
            }).catch(({ response }) => {
          if (response?.data.errors) {
            $data.errors = response.data.errors
          }
        }).finally(() => {
          emit('action', 'setTab', {
            key: instance._.vnode.key,
            changed,
            loading: false
          })
        })
      },
      pushRouter (route) {
        if (!route.matched) {
          route = router.parse(route)
        }

        emit(
            'action',
            'pushRouter',
            route,
            router.key(router.currentRoute.value, route) && methods.submit
        )
      },
      inputReloadQuery (value, ctx) {
        const route = router.parse({
          query: Object.assign({}, router.currentRoute.value.query, { [ctx._.vnode.key]: value })
        })
        emit('action', 'pushRouter', route, () => methods.submit({}, true))
      },
      inputChangeQuery (value, ctx) {
        const route = router.parse({
          query: Object.assign({}, router.currentRoute.value.query, { [ctx._.vnode.key]: value })
        })
        emit('action', 'pushRouter', route, () => methods.submit({}, true))
      }
    }

    function setData (data, stay, url, action) {
      const route = router.currentRoute.value

      if (data?.['meta']?.['redirect']) {
        location.href = data['meta']['redirect']
        return
      }

      if (data?.['meta']?.['reload']) {
        location.reload()
        return
      }

      if (stay === 0) {
        emit('action', 'closeTab')
        return
      } else if (stay === 1) {
        emit('action', 'toTab', { ...route, params: { id: 'new' } })
        return
      }

      Object.assign($data, data)

      const meta = {}

      if (data['meta']?.['title'] !== undefined) {
        meta['title'] = data['meta']['title']
      }

      if (data['meta']?.['icon'] !== undefined) {
        meta['icon'] = data['meta']['icon']
      }

      if (Object.values(meta).length) {
        emit('action', 'setTab', {
          key: instance._.vnode.key,
          meta
        })
      }

      $data.url = url
      loaded.value = true

      store.dispatch('set', {
        action,
        data: $data.data,
        route: router.key(route),
        actionUpdate: Date.now()
      })
    }

    function action () {
      if (typeof methods[arguments[0]] === 'function') {
        methods[arguments[0]](...Array.from(arguments).splice(1))
      } else {
        emit('action', ...arguments)
      }
    }

    function updateModelValue () {
      emit('action', 'setTab', {
        changed: true
      })
    }

    onMounted(methods.submit)

    return () => h('div', {
          class: 'app-page__default w-full h-full flex flex-col overflow-auto'
        },
        [
          loaded.value ?
              h(Component, {
                ...$data,
                onAction: action,
                'onUpdate:modelValue': updateModelValue
              }) :
              h('div', { class: 'flex items-center justify-center grow' },
                  h('div', {
                    class: 'inline-block rounded-full border-4 border-slate-200 border-r-blue-500 dark:border-white/20 dark:border-r-blue-500 h-20 w-20 animate-spin transition duration-500 opacity-0',
                    onVnodeMounted (ctx) {
                      setTimeout(() => ctx.el.classList.remove('opacity-0'), 100)
                    }
                  })
              )
        ]
    )
  }
}
</script>
