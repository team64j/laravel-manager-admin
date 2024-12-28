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

function onClick (event, _) {
  if (instance.proxy.$root['isMobile']) {
    const action = event.currentTarget.classList.contains('app-main-menu__hover') ? 'remove' : 'add'
    document.querySelectorAll('.app-main-menu__hover').forEach(i => i.classList.remove('app-main-menu__hover'))

    let item = event.currentTarget

    while (item) {
      item.classList[action]('app-main-menu__hover')
      item = item?.parentElement?.closest('li')
    }

    instance.root.refs.rootElement.classList[action]('app-main-menu__active')

    if (event.target.classList.contains('app-main-menu__toggle') && _.data['url']) {
      loadData(_.data['url'], _.data)
      return
    }
  } else {
    instance.root.refs.rootElement.classList.toggle('app-main-menu__active')
  }

  if (_.data['to']) {
    instance.root.refs.rootElement.classList.remove('app-main-menu__active')
    router.to(_.data['to'])
  } else if (_.data['href']) {
    instance.root.refs.rootElement.classList.remove('app-main-menu__active')
    window.open(_.data['href'])
  } else if (_.data['url']) {
    instance.root.refs.rootElement.classList.contains('app-main-menu__active') && loadData(_.data['url'], _)
  } else if (_.data['values']) {
    const value = store.getters['get']('Storage.root.' + _.data['key'])

    for (let i in _.data['values']) {
      i = parseInt(i)
      if (value === _.data['values'][i].value) {
        const item = _.data['values'][i + 1] ?? _.data['values'][0]
        store.dispatch('set', { ['Storage.root.' + _.data['key']]: item.value })
        break
      }
    }
  }
}

function onEnter (event, _) {
  if (event.currentTarget.classList.contains('app-main-menu__hover') || instance.proxy.$root['isMobile']) {
    return
  }

  let delay = 0

  clearTimeout(enterTimer)

  if (_.data['url'] && !_.data['data']) {
    delay = 50
  }

  let item = event.currentTarget

  enterTimer = setTimeout(() => {
    document.querySelectorAll('.app-main-menu__hover').forEach(i => i.classList.remove('app-main-menu__hover'))

    while (item) {
      item.classList.add('app-main-menu__hover')
      item = item?.parentElement?.closest('li')
    }

    if (_.data['url'] && instance.root.refs.rootElement.classList.contains('app-main-menu__active')) {
      clearTimeout(enterTimer)
      _.data['data'] = null

      enterTimer = setTimeout(() => loadData(_.data['url'], _), 150)
    }
  }, delay)
}

function onOut (event, _) {
  if (instance.proxy.$root['isMobile']) {
    return
  }

  if (_.data['url']) {
    clearTimeout(enterTimer)
  }

  if (_.data['data'] === undefined) {
    event.currentTarget.classList.remove('app-main-menu__hover')
  }
}

function onNav (event, url, _) {
  loadData(url, _)
}

function onFilterInput (event, _) {
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    _.data.filter = event.target.value
    loadData(
        router.parse({ path: _._.parent.proxy.data['url'], query: { filter: event.target.value } }).fullPath,
        _._.parent.proxy
    )
  }, 500)
}

function onFilterClear (event, _) {
  _.data.filter = ''
  loadData(
      router.parse({ path: _._.parent.proxy.data['url'] }).fullPath,
      _._.parent.proxy
  )
}

function loadData (url, _) {
  const route = router.parse(url)
  _.data['loading'] = true
  _.data['data'] = null
  _.$forceUpdate()

  axios.get(route.fullPath).then(r => {
    const data = r.data['data'] || []
    const meta = r.data['meta'] || {}

    _.data['data'] = [].concat(
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
    _.data['loading'] = false
    _.$forceUpdate()
  })
}

function action (...args) {
  if (typeof instance.exposed[args[0]] === 'function') {
    instance.exposed[args[0]](...Array.from(args).splice(1))
  } else {
    emit('action', ...args)
  }
}

onMounted(() => {
  document.addEventListener('click', function () {
    instance.root.refs.rootElement.classList.remove('app-main-menu__active')
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
