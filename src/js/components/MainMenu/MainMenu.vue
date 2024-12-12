<script setup>
import MainMenuItem from './MainMenuItem.vue'
import { getCurrentInstance, onMounted } from 'vue'
import router from '../../router'
import store from '../../store'

defineOptions({
  name: 'MainMenu',
  __isStatic: true
})

const instance = getCurrentInstance()
const props = defineProps(['data'])
const emit = defineEmits(['action'])

let enterTimer = 0

const methods = {
  onClick (event, data) {
    instance.proxy.$el.classList.toggle('app-main-menu__active')

    if (data['to']) {
      instance.proxy.$el.classList.remove('app-main-menu__active')
      router.to(data['to'])
    } else if (data['href']) {
      instance.proxy.$el.classList.remove('app-main-menu__active')
      window.open(data['href'])
    } else if (data['url']) {
      methods.loadData(data['url'], data)
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
  },
  onEnter (event, data) {
    if (event.currentTarget.classList.contains('app-main-menu__hover')) {
      return
    }

    document.querySelectorAll('.app-main-menu__hover').forEach(i => i.classList.remove('app-main-menu__hover'))

    let item = event.currentTarget

    while (item) {
      item.classList.add('app-main-menu__hover')
      item = item?.parentElement?.closest('li')
    }

    if (data['url'] && instance.proxy.$el.classList.contains('app-main-menu__active')) {
      clearTimeout(enterTimer)
      data['data'] = null

      enterTimer = setTimeout(() => {
        methods.loadData(data['url'], data)
      }, 200)
    }
  },
  onOut (event, data) {
    if (data['url']) {
      clearTimeout(enterTimer)
    }

    if (!data['data']) {
      event.currentTarget.classList.remove('app-main-menu__hover')
    }
  },
  onNav (event, url, ctx) {
    methods.loadData(url, ctx.data)
  },
  loadData (url, item) {
    item['loading'] = true
    item['data'] = null
    axios.get(url).then(({ data: { data, meta } }) => {
      item['data'] = [].concat(
          meta['prepend'] ?? [],
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
}

const action = (...args) => {
  if (typeof methods[args[0]] === 'function') {
    methods[args[0]](...Array.from(args).splice(1))
  } else {
    emit('action', ...args)
  }
}

onMounted(() => {
  document.addEventListener('click', function () {
    instance.proxy.$el.classList.remove('app-main-menu__active')
  })
})
</script>

<template>
  <ul class="app-main-menu">
    <main-menu-item v-for="(i, k) in data" :data="i" :key="k" :level="1" @action="action"/>
  </ul>
</template>

<style>
.app-main-menu {
  @apply flex cursor-default p-1
}
.app-main-menu li {
  @apply inline-flex select-none
}
.app-main-menu li[data-level="1"] {
  @apply relative
}
.app-main-menu li > div {
  @apply flex w-full justify-between items-center px-4 transition
}
.app-main-menu li[data-level="1"] > div {
  @apply rounded
}
.app-main-menu li.app-main-menu__hover > div {
  @apply bg-blue-600 text-white
}
.app-main-menu li[data-level="1"].app-main-menu__hover > div {
  @apply bg-gray-600
}
.app-main-menu li ul {
  @apply absolute flex flex-col opacity-0 invisible top-full left-0 w-80 rounded py-1 bg-gray-700 shadow-2xl transition-all
}
.app-main-menu li[data-level="2"] ul {
  @apply left-full top-0 overflow-hidden overflow-y-auto max-h-[calc(100vh_-_4rem)]
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
