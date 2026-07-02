<script setup>
import { defineAsyncComponent, getCurrentInstance, h, nextTick, onMounted, reactive, shallowRef, watch } from 'vue'
import { convertPixelsToRem, convertRemToPixels } from './utils'
import router from '@/router'
import store from '@/services/store'
import local from '@/services/local'
import { RouterView } from 'vue-router'
import { Notifications, notify } from '@kyvg/vue3-notification'
import GlobalTabs from '@/components/GlobalTabs/GlobalTabs.vue'
import Datepicker from '@/components/Datepicker/Datepicker.vue'
import Tooltip from '@/components/Tooltip/Tooltip.vue'
import Search from '@/components/Search/Search.vue'
import Modal from '@/components/Modal/Modal.vue'
import Logo from '@/components/Logo/Logo.vue'
import { action as _action } from '@/composables'
import { DynamicComponent } from '@/utils/dynamic-component'

defineOptions({
  name: 'App'
})

const emit = defineEmits(['action'])

const currentInstance = getCurrentInstance()

const rootElement = shallowRef()
const globalTabs = shallowRef()
const midElement = shallowRef()
const modalElement = shallowRef()
const sidebarElement = shallowRef()
const datepickerElement = shallowRef()

const data = reactive({
  loaded: false,
  layout: null,
  sidebarWidth: local.get('sidebarWidth', 26),
  breakpoints: {
    'sm': 0,
    'md': 768,
    'lg': 1024,
    'xl': 1280,
    '2xl': 1536
  }
})

store.set({
  isMobile: calcIsMobile(),
  breakpoint: calcBreakpoint()
})

watch(
    () => local.storage['token'],
    bootstrap
)

watch(
    () => local.storage['root']?.['dark'],
    (value) => document.documentElement.classList.toggle('dark', !!value)
)

watch(
    () => local.storage['root']?.['sidebarShow'],
    (value) => rootElement.value.classList.toggle('app-sidebar-hidden', !value)
)

onMounted(() => {
  /**
   * @see https://dennisreimann.de/articles/delegating-html-links-to-vue-router.html
   */
  window.addEventListener('click', event => {
    // ensure we use the link, in case the click has been received by a sub element
    let { target } = event
    while (target && target.tagName !== 'A') target = target.parentNode
    // handle only links that do not reference external resources
    if (target && target.matches('a:not([href*=\'://\'])') && target.href) {
      // some sanity checks taken from vue-router:
      // https://github.com/vuejs/vue-router/blob/dev/src/components/link.js#L106
      const { altKey, ctrlKey, metaKey, shiftKey, button, defaultPrevented } = event
      // don't handle with control keys
      if (metaKey || altKey || ctrlKey || shiftKey) return
      // don't handle when preventDefault called
      if (defaultPrevented) return
      // don't handle right clicks
      if (button !== undefined && button !== 0) return
      // don't handle if `target="_blank"`
      if (target && target.getAttribute) {
        const linkTarget = target.getAttribute('target')
        if (/\b_blank\b/i.test(linkTarget)) return
      }
      // don't handle same page links/anchors
      const url = new URL(target.href)
      const to = url.pathname.replace(document.baseURI.replace(/\/$/g, '').replace(location.origin, '') + '/', '/')
      if (window.location.pathname !== to && event.preventDefault) {
        event.preventDefault()
        router.to(to)
      }
    }
  })
})

window.addEventListener('resize', () => {
  const check = calcIsMobile()

  if (check !== store.get('isMobile')) {
    store.set('isMobile', check)
  }

  store.set('breakpoint', calcBreakpoint())
})

document.documentElement.classList.toggle(
    'dark',
    local.get('root.dark')
)

bootstrap()

function action (...args) {
  return _action.call(currentInstance.exposed, ...args)
}

function login () {
  local.set('token', null)

  if (!currentInstance.appContext.components.RouterView) {
    currentInstance.appContext.app.use(router)
  }

  data.loaded = true
  data.layout = null
  router.to('/login')
}

function bootstrap () {
  data.loaded = false

  if (!local.get('token')) {
    login()
  }

  axios.post('/bootstrap').then((response) => {
    if (response.data['data']) {
      if (response.data['data']?.['config']?.['siteName']) {
        document.title = response.data['data']['config']['siteName']
      }

      store.set({
        config: response.data['data']['config'] || {},
        lang: response.data['data']['lang'] || {}
      })

      setComponents()

      setRoutes(response.data['data']['routes'])

      setAssets(response.data['data']['assets'])

      //setSlots(response.data['layout'])

      setLayout(response.data['layout'])

      if (!currentInstance.appContext.components.RouterView) {
        currentInstance.appContext.app.use(router)
      }

      data.loaded = true

    } else {
      notify({
        text: 'No data',
        type: 'error'
      })

      setTimeout(() => {
        login()
      }, 2000)
    }
  }).catch(login)
}

function setRoutes (data) {
  if (data?.length) {
    const routes = router.getRoutes()
    const component = () => import('./pages/AppPage.vue')
    for (const route of data) {
      if (router.hasRoute(route.name) || routes.some(i => i.path === route.path)) {
        continue
      }
      router.addRoute({ ...route, component })
    }
  }
}

function setAssets (data) {
  if (data?.length) {
    data.forEach(i => {
      switch (i.rel) {
        case 'plugin':
          import(/* @vite-ignore */i.src).then(j => {
            currentInstance.appContext.app.use(j.default)
          })
          break

        case 'component':
          import(/* @vite-ignore */i.src).then(j => {
            currentInstance.appContext.app.component(j.default.name, j.default)
          })
          break

        case 'manifest':
          const fragment = document.createRange().createContextualFragment(i.source)
          document.head.appendChild(fragment)
          break

        case 'module':
          const script = document.createElement('script')
          script.setAttribute('src', i.src)
          script.setAttribute('type', 'module')
          script.setAttribute('crossorigin', 'anonymous')
          document.head.appendChild(script)
          break

        case 'css':
          document.head.innerHTML += `<link rel="stylesheet" href="${i.src}">`
          break
      }
    })
  }
}

function setComponents () {
  Object.entries(import.meta.glob('./components/*/*.vue', { eager: true })).
      forEach(([, { default: module }]) => {
        const name = `App` + (module.name || module.__name)
        if (module?.['__isStatic'] && !currentInstance.appContext.components[name]) {
          currentInstance.appContext.app.component(name, module)
        }
      })
}

function setSlots (data) {
  if (data?.length) {
    const slots = {
      'top': null,
      'top.left': null,
      'top.right': null,
      'left': null,
      'left.top': null,
      'left.bottom': null,
      'sidebar': null
    }

    for (const slot in slots) {
      currentInstance.slots[slot] = () => {
        const i = data.find(i => i.slot === slot)

        return [
          i && h(Component, {
            layout: i,
            currentRoute: router.currentRoute.value,
            onAction: action
          })
        ]
      }
    }

    currentInstance.slots['default'] = () => [
      h(GlobalTabs, {
        currentRoute: router.currentRoute.value,
        onAction: action
      })
    ]
  }
}

function setLayout (layout) {
  if (layout?.length) {
    data['layout'] = {}

    layout.forEach(i => {
      data.layout[i.slot] = i
    })
  }
}

function onTouchstartSidebar (event) {
  if (!store.get('isMobile')) {
    return
  }

  let sx = event.touches[0].clientX,
      sy = event.touches[0].clientY,
      sl = null

  function onTouchmoveSidebar (event) {
    sl = null

    if (Math.abs(event.touches[0].clientX - sx) < Math.abs(event.touches[0].clientY - sy)) {
      return
    }

    if (event.touches[0].clientX - sx < 0) {
      sl = false
      if (local.get('root.sidebarShow')) {
        let x = event.touches[0].clientX - sx

        if (Math.abs(x) > sidebarElement.value.offsetWidth) {
          x = -sidebarElement.value.offsetWidth
        }

        sidebarElement.value.style.transform = 'translateX(' + x + 'px)'
        sidebarElement.value.style.transition = 'none'
      }
    } else if (sx < 40) {
      sl = true
      if (!local.get('root.sidebarShow')) {
        let x = sidebarElement.value.offsetWidth - (event.touches[0].clientX - sx)

        if (x < 0) {
          x = 0
        }

        sidebarElement.value.style.transform = 'translateX(-' + x + 'px)'
        sidebarElement.value.style.transition = 'none'
      }
    }
  }

  function onTouchendSidebar (event) {
    let x = event.changedTouches[0].clientX - sx

    if (Math.abs(x) > sidebarElement.value.offsetWidth / 3) {
      sl !== null && local.set('root.sidebarShow', sl)
    }

    sidebarElement.value.style.transform = null
    sidebarElement.value.style.transition = null
    midElement.value.removeEventListener('touchmove', onTouchmoveSidebar)
    midElement.value.removeEventListener('touchend', onTouchendSidebar)
  }

  midElement.value.addEventListener('touchmove', onTouchmoveSidebar)
  midElement.value.addEventListener('touchend', onTouchendSidebar)
}

function onMousedownSidebarSplitter (event) {
  if (store.get('isMobile')) {
    return
  }

  const x = event.clientX
  const w = convertRemToPixels(data.sidebarWidth)

  function onMousemoveSidebarSplitter (event) {
    sidebarElement.value.style.transition = 'none'
    data.sidebarWidth = convertPixelsToRem(
        Math.min(Math.max(w - (x - event.clientX), 64), window.innerWidth * .5)
    )
    local.set('sidebarWidth', data.sidebarWidth)
  }

  function onMouseupSidebarSplitter (event) {
    sidebarElement.value.style.transition = null
    event.currentTarget.removeEventListener('mousemove', onMousemoveSidebarSplitter)
    event.currentTarget.removeEventListener('mouseup', onMouseupSidebarSplitter)
  }

  event.currentTarget.addEventListener('mousemove', onMousemoveSidebarSplitter)
  event.currentTarget.addEventListener('mouseup', onMouseupSidebarSplitter)
}

function pushRouter (route, callback) {
  nextTick(() => router.to(route).then(callback))
}

function collapse (value) {
  local.set('root.sidebarShow', !value)
}

function calcIsMobile () {
  return 'ontouchstart' in window ||
      navigator.maxTouchPoints ||
      navigator['msMaxTouchPoints'] ||
      window.innerWidth < 1024
}

function calcBreakpoint () {
  let breakpoint = 'sm'

  for (const i in data.breakpoints) {
    if (window.innerWidth > data.breakpoints[i]) {
      breakpoint = i
    }
  }

  return breakpoint
}

function inputTreeSelect (event, instance) {
  const input = instance.vnode.el.querySelector('input')
  store.set({ event, context: instance })

  if (input.classList.contains('focus')) {
    input.classList.remove('focus')
    store.set({ treeSelect: false })
  } else {
    input.classList.add('focus')
    store.set({ treeSelect: true })
  }
}

function modalShow (event, instance) {
  const context = instance.ctx || instance

  if (context['url']) {
    modalElement.value.open({
      url: context['url'],
      owner: context
    })
  }
}

function datepickerShow () {
  datepickerElement.value.on(...arguments)
}

defineExpose({
  pushRouter,
  collapse,
  inputTreeSelect,
  'modal:component': modalShow,
  'datepicker:show': datepickerShow,
  data: {
    breakpoints: data.breakpoints
  }
})

// window['confirm'] = (message) => {
//   const promise = new Promise(async function(resolve, reject) {
//     const dialog = document.createElement('div')
//     dialog.className = 'fixed flex flex-wrap justify-center rounded z-50 bg-white dark:bg-gray-600 top-1/2 left-1/2 w-96 max-w-full h-auto max-h-full -translate-x-1/2 -translate-y-1/2 p-5 shadow-xl'
//     dialog.innerHTML = `<div class="grow w-full pb-3">${message}</div>`
//
//     const btnCancel  = document.createElement('button')
//     btnCancel.className = 'btn-sm mx-1 px-4 border-none'
//     btnCancel.innerHTML = 'Cancel'
//     btnCancel.onclick = () => resolve(false)
//
//     const btnOk = document.createElement('button')
//     btnOk.className = 'btn-sm btn-green mx-1 px-4 border-none'
//     btnOk.innerHTML = 'OK'
//     btnOk.onclick = () => resolve(true)
//
//     dialog.append(btnCancel, btnOk)
//
//     document.body.append(dialog)
//   })
//
//   return promise
// }
</script>

<template>
  <div v-if="data.loaded" ref="rootElement"
       class="app"
       :class="{
          'app-mobile': store.get('isMobile'),
          'app-sidebar-hidden': !local.get('root.sidebarShow', true)
       }">
    <template v-if="data.layout">
      <div
          v-if="data.layout['top.left'] || data.layout['top'] || data.layout['top.right']"
          class="dark app-position-horizontal grow-0 shrink-0 flex justify-between z-40 shadow bg-gray-750 text-white/80 border-b border-b-gray-900">
        <div class="grow-0 flex app-position-start" v-if="data.layout['top.left']">
          <component :is="DynamicComponent({}, null, data.layout['top.left'])" @action="action"/>
        </div>
        <div class="grow flex justify-between" v-if="data.layout['top']">
          <component :is="DynamicComponent({}, null, data.layout['top.top'])" @action="action"/>
        </div>
        <div class="grow-0 flex app-position-end" v-if="data.layout['top.right']">
          <component :is="DynamicComponent({}, null, data.layout['top.right'])" @action="action"/>
        </div>
      </div>
      <div ref="midElement" class="grow flex flex-row overflow-hidden relative" @touchstart="onTouchstartSidebar">
        <div
            v-if="data.layout['left.top'] || data.layout['left'] || data.layout['left.bottom']"
            class="app-left z-30 grow-0 shrink-0 flex flex-col justify-between bg-gray-750 text-white/80 w-12 border-r border-r-gray-800 app-position-vertical dark">
          <div class="grow-0 flex" v-if="data.layout['left.top']">
            <component :is="DynamicComponent({}, null, data.layout['left.top'])" @action="action"/>
          </div>
          <div class="grow flex items-center" v-if="data.layout['left']">
            <component :is="DynamicComponent({}, null, data.layout['left'])" @action="action"/>
          </div>
          <div class="grow-0 flex app-position-end" v-if="data.layout['left.bottom']">
            <component :is="DynamicComponent({}, null, data.layout['left.bottom'])" @action="action"/>
          </div>
        </div>
        <div v-if="data.layout['sidebar']" ref="sidebarElement"
             :style="{ width: data.sidebarWidth + `rem` }"
             class="relative z-20 grow-0 shrink-0 max-w-full lg:max-w-[75%] app-sidebar dark"
             :class="{
              'app-main__overlay': store.get('AppMainOverlay')
            }">
          <component :is="DynamicComponent({}, null, data.layout['sidebar'])" @action="action"/>
          <div class="app-resizer grow-0 shrink-0 flex" @mousedown="onMousedownSidebarSplitter">
            <div/>
          </div>
        </div>
        <div class="grow flex flex-col overflow-hidden z-10 app-main"
             :class="{
            'app-main__overlay': store.get('AppMainOverlay')
          }">
          <global-tabs :current-route="router.currentRoute.value" @action="action" ref="globalTabs"/>
        </div>
      </div>

      <modal ref="modalElement"/>
      <search/>
      <tooltip/>
      <datepicker ref="datepickerElement"/>
    </template>

    <router-view v-else/>
  </div>

  <div v-else class="flex flex-col h-full justify-center items-center">
    <logo class="w-24 h-24 animate-ping"/>
  </div>

  <notifications position="top right" class="app-notifications" :dangerouslySetInnerHtml="true"/>
</template>

<style>
.app {
  @apply flex flex-col h-full w-full
}
.app .app-resizer {
  @apply absolute right-0 top-0 bottom-0 z-10 lg:z-30 shrink-0 w-0 cursor-col-resize hidden lg:block
}
.app .app-resizer > div {
  @apply fixed z-50 w-full h-full left-0 top-0 hidden cursor-col-resize
}
.app .app-resizer:active > div {
  @apply block
}
.app .app-resizer::before, .app .app-resizer::after {
  @apply absolute h-full content-[""]
}
.app .app-resizer::before {
  @apply w-1.5 -ml-0.5
}
.app .app-resizer::after {
  @apply absolute h-full w-1 transition duration-100
}
.app .app-resizer:hover::after {
  @apply bg-blue-500/50
}
.app .app-sidebar {
  @apply shrink-0 absolute lg:relative z-20 flex grow-0 h-full border-r border-r-gray-800 bg-gray-800 text-gray-100 transition lg:transition-[width]
}
.app .app-left + .app-sidebar {
  @apply left-12 lg:left-0 max-w-[calc(100%_-_3rem)]
}
.app.app-mobile .app-sidebar, .app.app-mobile .app-left + .app-sidebar {
  @apply !w-full
}
.app.app-sidebar-hidden .app-sidebar {
  @apply -translate-x-full lg:!w-0 lg:translate-x-0 lg:border-0
}
.app.app-sidebar-hidden .app-resizer {
  @apply hidden
}
.app .app-sidebar + .app-main::after {
  @apply lg:hidden content-[""] z-10 fixed left-0 top-14 right-0 bottom-0
}
.app.app-sidebar-hidden .app-main::after {
  @apply hidden
}
.app-main__overlay::before {
  @apply content-[""] absolute z-30 left-0 top-0 right-0 bottom-0 bg-black/20
}
</style>
