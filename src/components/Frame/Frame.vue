<script setup>
import { computed, getCurrentInstance, watch } from 'vue'
import router from '@/router'
import local from '@/services/local'

const currentInstance = getCurrentInstance()

defineOptions({
  name: 'Frame',
  __isStatic: true
})

const props = defineProps({
  url: String,
  data: String
})

const emit = defineEmits(['action'])

emit('action', 'setTab', {
  key: currentInstance.vnode.key,
  loading: true,
  meta: { title: '...' }
})

watch(
    () => local.storage['root']['dark'],
    () => message(currentInstance.vnode.el)
)

const src = computed(() => {
  if (props.data !== undefined) {
    return null
  }

  let src

  if (props.url) {
    src = (/https?:/.test(props.url) ? '' : local.get('hostname')) +
        props.url +
        (/\?/.test(props.url) ? '&' : '?') + 'token=' + local.get('token')
  } else {
    const route = { ...router.currentRoute.value }
    route.query ??= {}

    src = local.get('hostname')
    route.query.token = local.get('token')

    if (route['meta']['url']) {
      src += route['meta']['url'] + (route['params']['id'] ? '/' + route['params']['id'] : '')
    } else {
      src += route['path']
    }

    if (Object.values(route.query).length) {
      src += '?' + new URLSearchParams(route.query)
    }
  }

  return src
})

function onLoad (event) {
  const route = router.currentRoute.value
  const title = (route?.['meta']?.['title'] ?? route['name'] ?? 'Frame') +
      (route?.['params']?.['id'] ? ': ' + route?.['params']?.['id'] : '')

  emit('action', 'setTab', {
    key: currentInstance.vnode.key,
    loading: false,
    meta: { title: event.target?.contentDocument?.title || title }
  })

  message(event.target)

  window.addEventListener('message', event => {
    if (event.data.data) {
      const title = event.data.data?.title ?? event.data.data?.h1

      if (title) {
        emit('action', 'setTab', {
          key: currentInstance.vnode.key,
          loading: false,
          meta: { title }
        })
      }
    }
  })
}

function message (win) {
  if (win.contentDocument) {
    win.contentDocument.documentElement.className = local.get('root.dark') ? 'dark' : 'light'
    win.contentDocument.body.style = getComputedStyle(document.body)
  }

  win.contentWindow?.postMessage({ dark: local.get('root.dark') }, '*')
}
</script>

<template>
  <iframe :src="src"
          :srcdoc="props.data"
          class="w-full h-full overflow-auto"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          @load="onLoad"/>
</template>
