<script setup>
import { getCurrentInstance, onMounted } from 'vue'
import MainMenuItem from './MainMenuItem.vue'
import router from '../../router'
import store from '../../store'

defineOptions({
  name: 'MainMenu',
  __isStatic: true
})

const instance = getCurrentInstance()
const props = defineProps(['data'])
const emit = defineEmits(['action'])

let enterTimer = 0, filterTimer = 0

function onClick (event, data) {
    if (instance.proxy.$root['isMobile']) {
      const action = event.currentTarget.classList.contains('app-main-menu__hover') ? 'remove' : 'add'
      document.querySelectorAll('.app-main-menu__hover').forEach(i => i.classList.remove('app-main-menu__hover'))

      let item = event.currentTarget

      while (item) {
        item.classList[action]('app-main-menu__hover')
        item = item?.parentElement?.closest('li')
      }

      instance.proxy.$root.$el.classList[action]('app-main-menu__active')

      if (event.target.classList.contains('app-main-menu__toggle') && data['url']) {
        loadData(data['url'], data)
        return
      }
    } else {
      instance.proxy.$root.$el.classList.toggle('app-main-menu__active')
    }

    if (data['to']) {
      instance.proxy.$root.$el.classList.remove('app-main-menu__active')
      router.to(data['to'])
    } else if (data['href']) {
      instance.proxy.$root.$el.classList.remove('app-main-menu__active')
      window.open(data['href'])
    } else if (data['url']) {
      instance.proxy.$root.$el.classList.contains('app-main-menu__active') && loadData(data['url'], data)
    } else if (data['values']) {
      const value = store.getters['get']('Storage.root.' + data['key'])

      for (let i in data['values']) {
        i = parseInt(i)
        if (value === data['values'][i].value) {
          const item = data['values'][i + 1] ?? data['values'][0]
          store.dispatch('set', { ['Storage.root.' + data['key']]: item.value })
          break
        }
      }
    }
}

function onEnter (event, data) {
    if (event.currentTarget.classList.contains('app-main-menu__hover') || instance.proxy.$root['isMobile']) {
      return
    }

    let delay = 0

    clearTimeout(enterTimer)

    if (data['url'] && !data['data']) {
      delay = 50
    }

    let item = event.currentTarget

    enterTimer = setTimeout(() => {
      document.querySelectorAll('.app-main-menu__hover').forEach(i => i.classList.remove('app-main-menu__hover'))

      while (item) {
        item.classList.add('app-main-menu__hover')
        item = item?.parentElement?.closest('li')
      }

      if (data['url'] && instance.proxy.$root.$el.classList.contains('app-main-menu__active')) {
        clearTimeout(enterTimer)
        data['data'] = null

        enterTimer = setTimeout(() => loadData(data['url'], data), 150)
      }
    }, delay)
}

function onOut (event, data) {
    if (instance.proxy.$root['isMobile']) {
      return
    }

    if (data['url']) {
      clearTimeout(enterTimer)
    }

    if (!data['data']) {
      event.currentTarget.classList.remove('app-main-menu__hover')
    }
}

function onNav (event, url, ctx) {
  loadData(url, ctx.data)
}

function onFilterInput (event, item, ctx) {
    clearTimeout(filterTimer)
    filterTimer = setTimeout(() => {
      item.filter = event.target.value
      loadData(
          router.parse({ path: ctx.data['url'], query: { filter: event.target.value } }).fullPath,
          ctx.data
      )
    }, 500)
}

function onFilterClear (event, item, ctx) {
    item.filter = ''
  loadData(
        router.parse({ path: ctx.data['url'] }).fullPath,
        ctx.data
    )
}

function loadData (url, item) {
    const route = router.parse(url)
    item['loading'] = true
    item['data'] = null
    axios.get(route.fullPath).then(({ data: { data, meta } }) => {
      item['data'] = [].concat(
          meta['prepend'] ?? [],
          (meta['pagination'] && (meta['pagination']['total'] > meta['pagination']['per'])) || route.query['filter'] !== undefined
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
      item['loading'] = false
    })
  }

const action = (...args) => {
  if (typeof instance.exposed[args[0]] === 'function') {
    instance.exposed[args[0]](...Array.from(args).splice(1))
  } else {
    emit('action', ...args)
  }
}

onMounted(() => {
  document.addEventListener('click', function () {
    instance.proxy.$root.$el.classList.remove('app-main-menu__active')
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
  <div class="app-main-menu">
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
.app-main-menu__active .app-main-menu li.app-main-menu__hover > ul {
  @apply opacity-100 visible
}
</style>
