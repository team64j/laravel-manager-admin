<script setup>
import { getCurrentInstance, onMounted } from 'vue'
import MainMenuItem from './MainMenuItem.vue'
import router from '../../router'
import store from '../../store'

defineOptions({
  name: 'MainMenu',
  __isStatic: true
})

const currentInstance = getCurrentInstance()
const props = defineProps(['data'])
const emit = defineEmits(['action'])

let enterTimer = 0, filterTimer = 0

function onClick (event, target) {
  if (store.getters.get('isMobile')) {
    const action = event.currentTarget.classList.contains('app-main-menu__hover') ? 'remove' : 'add'
    document.querySelectorAll('.app-main-menu__hover').forEach(i => i.classList.remove('app-main-menu__hover'))

    let item = event.currentTarget

    while (item) {
      item.classList[action]('app-main-menu__hover')
      item = item?.parentElement?.closest('li')
    }

    store.dispatch('set', { ['app-main-menu__active']: action === 'add' })

    if (event.target.classList.contains('app-main-menu__toggle') && target.data['url']) {
      loadData(target.data['url'], target)
      return
    }
  } else {
    store.dispatch('set', { ['app-main-menu__active']: !store.getters.get('app-main-menu__active') })
  }

  if (target.data['to']) {
    store.dispatch('set', { ['app-main-menu__active']: false })
    router.to(target.data['to'])
  } else if (target.data['href']) {
    store.dispatch('set', { ['app-main-menu__active']: false })
    window.open(target.data['href'])
  } else if (target.data['url']) {
    store.getters.get('app-main-menu__active') && loadData(target.data['url'], target)
  } else if (target.data['values']) {
    const value = store.getters['get']('Storage.root.' + target.data['key'])

    for (let i in target.data['values']) {
      i = parseInt(i)
      if (value === target.data['values'][i].value) {
        const item = target.data['values'][i + 1] ?? target.data['values'][0]
        store.dispatch('set', { ['Storage.root.' + target.data['key']]: item.value })
        break
      }
    }
  }
}

function onEnter (event, target) {
  if (event.currentTarget.classList.contains('app-main-menu__hover') || store.getters.get('isMobile')) {
    return
  }

  let delay = 0

  clearTimeout(enterTimer)

  if (target.data['url'] && !target.data['data']) {
    delay = 50
  }

  let item = event.currentTarget

  enterTimer = setTimeout(() => {
    document.querySelectorAll('.app-main-menu__hover').forEach(i => i.classList.remove('app-main-menu__hover'))

    while (item) {
      item.classList.add('app-main-menu__hover')
      item = item?.parentElement?.closest('li')
    }

    if (target.data['url'] && store.getters.get('app-main-menu__active')) {
      clearTimeout(enterTimer)
      target.data['data'] = null

      enterTimer = setTimeout(() => loadData(target.data['url'], target), 150)
    }
  }, delay)
}

function onOut (event, target) {
  if (store.getters.get('isMobile')) {
    return
  }

  if (target.data['url']) {
    clearTimeout(enterTimer)
  }

  if (target.data['data'] === undefined) {
    event.currentTarget.classList.remove('app-main-menu__hover')
  }
}

function onNav (event, url, target) {
  loadData(url, target)
}

function onFilterInput (event, target) {
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    target.data.filter = event.target.value
    loadData(
        router.parse({ path: target._.parent.proxy.data['url'], query: { filter: event.target.value } }).fullPath,
        target._.parent.proxy
    )
  }, 500)
}

function onFilterClear (event, target) {
  target.data.filter = ''
  loadData(
      router.parse({ path: target._.parent.proxy.data['url'] }).fullPath,
      target._.parent.proxy
  )
}

function loadData (url, target) {
  const route = router.parse(url)
  target.data['loading'] = true
  target.data['data'] = null
  //_.$forceUpdate()

  axios.get(route.fullPath).then(r => {
    const data = r.data['data'] || []
    const meta = r.data['meta'] || {}

    target.data['data'] = [].concat(
        meta['prepend'] ?? [],
        (meta['pagination'] && (meta['pagination']['total'] > meta['pagination']['per'])) || route.query['filter'] !==
        undefined
            ? [{ filter: route.query['filter'] || '' }]
            : [],
        data.map(i => {
          if (meta['route']) {
            i.to = router.parse({ path: meta['route'], params: i })
          }
          return i
        }),
        meta['append'] ?? [],
        meta['pagination'] && (meta['pagination']['prev'] || meta['pagination']['next']) ? [meta['pagination']] : []
    )
  }).finally(() => {
    target.data['loading'] = false
    //_.$forceUpdate()
  })
}

function action (...args) {
  if (typeof currentInstance.exposed[args[0]] === 'function') {
    currentInstance.exposed[args[0]](...Array.from(args).splice(1))
  } else {
    emit('action', ...args)
  }
}

onMounted(() => {
  document.addEventListener('click', function () {
    store.dispatch('set', { ['app-main-menu__active']: false })
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
  <div class="app-main-menu" :class="{ 'app-main-menu__active': store.getters.get('app-main-menu__active') }">
    <ul>
      <main-menu-item v-for="(i, k) in props.data" :data="i" :key="k" :level="1" @action="action"/>
    </ul>
  </div>
</template>

<style>
.app-main-menu > ul {
  @apply relative flex cursor-default
}
.app-main-menu li {
  @apply inline-flex select-none
}
.app-main-menu li[data-level="1"] {
  @apply lg:relative min-h-10 mx-0.5 my-1
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
  @apply fixed lg:absolute flex flex-col opacity-0 invisible top-12 lg:top-full left-0 w-[calc(100vw_-_0.5rem)] lg:w-80 h-[calc(100vh_-_3.5rem)] lg:h-auto lg:max-h-[calc(100vh_-_3.5rem)] m-1 lg:m-0 py-1 rounded bg-gray-700 shadow-2xl transition-all
}
.app-main-menu li[data-level="2"] ul {
  @apply z-10 left-0 lg:left-full lg:top-0 overflow-hidden overflow-y-auto h-[calc(100vh_-_3.5rem)] lg:h-auto
}
.app-position-end .app-main-menu li[data-level="1"] ul {
  @apply left-auto right-0
}
.app-position-end .app-main-menu li[data-level="2"] ul {
  @apply left-auto top-0 right-full
}
.app-main-menu.app-main-menu__active li.app-main-menu__hover > ul {
  @apply opacity-100 visible
}
</style>
