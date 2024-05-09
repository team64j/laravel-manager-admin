<script>
import { getCurrentInstance, h, watch } from 'vue'
import store from '../../store'
import router from '../../router'

export default {
  props: {
    url: String,
    data: String
  },

  methods: {
    message (win) {
      const style = getComputedStyle(document.body)

      if (win.contentDocument) {
        win.contentDocument.documentElement.className = store.getters.get('Storage.root.dark') ? 'dark' : 'light'
        win.contentDocument.body.style = style
      }

      win.contentWindow?.postMessage({ dark: store.getters.get('Storage.root.dark') }, '*')
    }
  },

  setup (props, { emit }) {
    const instance = getCurrentInstance()

    emit('action', 'setTab', {
      key: instance.vnode.key,
      loading: true,
      meta: { title: '...' }
    })

    watch(
        () => store.state['Storage']['root']['dark'],
        () => instance.ctx.message(instance.vnode.el)
    )

    const attrs = {
      class: 'w-full h-full overflow-auto',
      onload: (event) => {
        const route = router.currentRoute.value
        const title = (route?.['meta']?.['title'] ?? route['name'] ?? 'Frame') +
            (route?.['params']?.['id'] ? ': ' + route?.['params']?.['id'] : '')

        emit('action', 'setTab', {
          key: instance.vnode.key,
          loading: false,
          meta: { title: event.target?.contentDocument?.title || title }
        })

        instance.ctx.message(event.target)

        window.addEventListener('message', event => {
          if (event.data.data) {
            const title = event.data.data?.title ?? event.data.data?.h1

            if (title) {
              emit('action', 'setTab', {
                key: instance.vnode.key,
                loading: false,
                meta: { title }
              })
            }
          }
        })
      }
    }

    const hostname = store.getters.get('Storage.hostname')
    const token = store.getters.get('Storage.token')

    if (props.url) {
      attrs.src = (/https?:/.test(props.url) ? '' : hostname) +
          props.url +
          (/\?/.test(props.url) ? '&' : '?') + 'token=' + token
    } else if (props.data !== undefined) {
      attrs.srcdoc = props.data
    } else {
      const route = { ...router.currentRoute.value }
      route.query ??= {}

      attrs.url = hostname
      route.query.token = token

      if (route['meta']['url']) {
        attrs.url += route['meta']['url'] + (route['params']['id'] ? '/' + route['params']['id'] : '')
      } else {
        attrs.url += route['path']
      }

      if (Object.values(route.query).length) {
        attrs.url += '?' + new URLSearchParams(route.query)
      }
    }

    return () => h('iframe', attrs)
  }
}
</script>
