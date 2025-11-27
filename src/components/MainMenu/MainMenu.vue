<script setup>
import { getCurrentInstance, onMounted, reactive } from 'vue'
import { action } from '@/composables'
import MainMenuItem from './MainMenuItem.vue'
import router from '@/router'
import store from '@/store'

defineOptions({
  name: 'MainMenu',
  __isStatic: true
})

const currentInstance = getCurrentInstance()

const props = defineProps({
  data: [Array, Object],
  isVertical: Boolean
})

const data = reactive({
  active: false
})

const emit = defineEmits(['action'])

let enterTimer = 0, filterTimer = 0

function onClick (event, $props) {
  if (store.getters.get('isMobile')) {
    const action = event.currentTarget.classList.contains('app-main-menu__hover') ? 'remove' : 'add'
    document.querySelectorAll('.app-main-menu__hover').forEach(i => i.classList.remove('app-main-menu__hover'))

    let item = event.currentTarget

    while (item) {
      item.classList[action]('app-main-menu__hover')
      item = item?.parentElement?.closest('li')
    }

    data.active = action === 'add'

    if (event.target.classList.contains('app-main-menu__toggle') && $props.data['url']) {
      loadData($props.data['url'], $props)
      return
    }
  } else {
    data.active = !data.active
  }

  if ($props.data['to']) {
    data.active = false
    router.to($props.data['to'])
  } else if ($props.data['href']) {
    data.active = false
    window.open($props.data['href'])
  } else if ($props.data['url']) {
    data.active && loadData($props.data['url'], $props)
  } else if ($props.data['values']) {
    data.active = false
    const value = store.getters['get']('Storage.root.' + $props.data['key'])

    for (let i in $props.data['values']) {
      i = parseInt(i)
      if (value === $props.data['values'][i].value) {
        const item = $props.data['values'][i + 1] ?? $props.data['values'][0]
        Object.assign($props.data, item)
        store.dispatch('set', { ['Storage.root.' + $props.data['key']]: item.value })
        break
      }
    }
  }
  store.dispatch('set', { AppMainOverlay: data.active })
}

function onEnter (event, $props) {
  if (event.currentTarget.classList.contains('app-main-menu__hover') || store.getters.get('isMobile')) {
    return
  }

  let delay = 0

  clearTimeout(enterTimer)

  if ($props.data['url'] && !$props.data['data']) {
    delay = 50
  }

  let item = event.currentTarget

  enterTimer = setTimeout(() => {
    document.querySelectorAll('.app-main-menu__hover').forEach(i => i.classList.remove('app-main-menu__hover'))

    while (item) {
      item.classList.add('app-main-menu__hover')
      item = item?.parentElement?.closest('li')
    }

    if ($props.data['url'] && data.active) {
      clearTimeout(enterTimer)
      $props.data['data'] = null

      enterTimer = setTimeout(() => loadData($props.data['url'], $props), 150)
    }
  }, delay)
}

function onOut (event, $props) {
  if (store.getters.get('isMobile')) {
    return
  }

  if ($props.data['url']) {
    clearTimeout(enterTimer)
  }

  if ($props.data['data'] === undefined) {
    event.currentTarget.classList.remove('app-main-menu__hover')
  }
}

function onNav (event, url, $props) {
  loadData(url, $props)
}

function onFilterInput (event, $props) {
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    loadData(
        router.parse({ path: $props.data['url'], query: { filter: event.target.value } }).fullPath,
        $props
    )
  }, 500)
}

function onFilterClear (event, $props) {
  loadData(
      router.parse({ path: $props.data['url'] }).fullPath,
      $props
  )
}

function loadData (url, $props) {
  const route = router.parse(url)
  $props.data['loading'] = true
  $props.data['data'] = null

  axios({
    method: route?.['meta']?.['method']?.toLowerCase() ?? 'get',
    url: route.path,
    params: route.query,
    data: Object.assign({}, route.query)
  }).then(r => {
    const meta = r.data['meta'] || {}

    $props.data['data'] = [].concat(
        meta['prepend'] ?? [],
        (meta['pagination'] && (meta['pagination']['total'] > meta['pagination']['per'])) || route.query['filter'] !==
        undefined
            ? [{ filter: route.query['filter'] || '' }]
            : [],
        (r.data['data'] || []).map(i => {
          if (meta['route']) {
            i.to = router.parse({ path: meta['route'], params: i })
          }
          return i
        }),
        meta['append'] ?? [],
        meta['pagination'] && (meta['pagination']['prev'] || meta['pagination']['next']) ? [meta['pagination']] : []
    )
  }).finally(() => {
    $props.data['loading'] = false
  })
}

function _action () {
  return action.call(currentInstance.exposed, ...arguments)
}

onMounted(() => {
  document.addEventListener('click', function () {
    data.active = false
    store.dispatch('set', { AppMainOverlay: data.active })
  })
})

defineExpose({
  onEnter,
  onClick,
  onOut,
  onNav,
  onFilterInput,
  onFilterClear
})
</script>

<template>
  <div class="app-main-menu"
       :class="{
        'app-main-menu__active': store.getters.get('AppMainOverlay'),
        'app-main-menu__vertical': props.isVertical
      }">
    <ul>
      <main-menu-item v-for="(i, k) in props.data" :data="i" :key="k" :level="1" @action="_action"/>
    </ul>
  </div>
</template>

<style>
.app-main-menu > ul {
  @apply relative z-10 flex cursor-default
}
.app-main-menu li {
  @apply inline-flex select-none
}
.app-main-menu li[data-level="1"] {
  @apply lg:relative h-10 m-0.5
}
.app-main-menu li > div {
  @apply flex w-full justify-between items-center px-3 lg:px-4 transition
}
.app-main-menu li[data-level="1"] > div {
  @apply rounded
}
.app-main-menu li.app-main-menu__hover:not(.app-main-menu__filter) > div {
  @apply bg-blue-600 text-white
}
.app-main-menu li[data-level="1"].app-main-menu__hover > div {
  @apply bg-gray-600
}
.app-main-menu li ul {
  @apply fixed lg:absolute flex flex-col opacity-0 invisible top-12 lg:top-full left-12 lg:left-0 w-[calc(100vw_-_3.5rem)] lg:w-80 h-[calc(100vh_-_3.5rem)] lg:h-auto lg:max-h-[calc(100vh_-_3rem)] m-1 lg:m-0 lg:mt-1.5 py-1 rounded bg-gray-700 shadow-2xl transition-all
}
.app-main-menu li[data-level="2"] ul {
  @apply z-10 left-12 lg:left-full lg:top-0 m-0 overflow-hidden overflow-y-auto h-[calc(100vh_-_3.5rem)] lg:h-auto
}
.app-position-horizontal .app-position-end .app-main-menu li[data-level="1"] ul {
  @apply left-auto right-0
}
.app-position-horizontal .app-position-end .app-main-menu li[data-level="2"] ul {
  @apply left-auto top-0 right-full
}
.app-position-vertical .app-main-menu li ul {
  @apply lg:left-full top-auto right-auto bottom-0 lg:m-0 lg:ml-1.5
}
.app-position-vertical .app-main-menu li > div {
  @apply px-3
}
.app-position-vertical .app-main-menu__toggle {
  @apply !hidden
}
.app-main-menu.app-main-menu__active li.app-main-menu__hover > ul {
  @apply opacity-100 visible
}
</style>
