<script>
import { getCurrentInstance, h, watch } from 'vue'
import store from '../../store'
import router from '../../router'

export default {
  props: {
    url: String,
    data: String
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
        () => {
          if (instance.vnode.el.contentDocument) {
            instance.vnode.el.contentDocument.documentElement.className = store.getters.get('Storage.root.dark')
                ? 'dark'
                : 'light'
            const style = getComputedStyle(document.body)
            instance.vnode.el.contentDocument.body.style.font = style.font
            instance.vnode.el.contentDocument.body.style.color = style.color
            instance.vnode.el.contentDocument.body.style.background = style.background
          }
        }
    )

    const attrs = {
      class: 'w-full h-full overflow-auto',
      onload: (event) => {
        const title = (router.currentRoute.value?.['meta']?.['title'] || router.currentRoute.value['name']) + ' ' +
            (router.currentRoute.value?.['params']?.['id'] || '')

        emit('action', 'setTab', {
          key: instance.vnode.key,
          loading: false,
          meta: { title: event.target?.contentDocument?.title || title }
        })

        if (event.target?.contentDocument) {
          event.target.contentDocument.documentElement.className = store.getters.get('Storage.root.dark')
              ? 'dark'
              : 'light'
          const style = getComputedStyle(document.body)
          event.target.contentDocument.body.style.font = style.font
          event.target.contentDocument.body.style.color = style.color
          event.target.contentDocument.body.style.background = style.background
        }
      }
    }

    if (props.url) {
      attrs.src = props.url
    } else if (props.data !== undefined) {
      attrs.srcdoc = props.data
    } else {
      let query = router.currentRoute.value['query'] || {}

      attrs.url = store.getters.get('Storage.hostname', document.baseURI).replace(/\/$/g, '')

      query.token = store.getters.get('Storage.token')

      if (router.currentRoute.value['meta']['url']) {
        attrs.url += router.currentRoute.value['meta']['url'] +
            (router.currentRoute.value['params']['id'] ? '/' + router.currentRoute.value['params']['id'] : '')
      } else {
        attrs.url += router.currentRoute.value['path']
      }

      if (Object.values(query).length) {
        attrs.url += '?' + new URLSearchParams(query)
      }
    }

    return () => h('iframe', attrs)
  }
}
</script>
