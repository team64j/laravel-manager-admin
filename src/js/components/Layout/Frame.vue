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
    setTheme (obj) {
      obj.documentElement.className = store.getters.get('Storage.root.dark') ? 'dark' : 'light'
      const style = getComputedStyle(document.body)
      obj.body.style.font = style.font
      obj.body.style.color = style.color
      obj.body.style.background = style.background
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
        () => instance.vnode.el?.contentDocument && instance.ctx.setTheme(instance.vnode.el.contentDocument)
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

        event.target?.contentDocument && this.setTheme(event.target.contentDocument)
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
