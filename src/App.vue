<script setup>
import { getCurrentInstance, h, nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import { convertPixelsToRem, convertRemToPixels } from './utils/convert'
import router from './router'
import store from './store'
import { Notifications } from '@kyvg/vue3-notification'
import GlobalTabs from './components/GlobalTabs/GlobalTabs.vue'
import Datepicker from './components/Datepicker/Datepicker.vue'
import Component from './components/Layout/Component.vue'
import Tooltip from './components/Tooltip/Tooltip.vue'
import Search from './components/Search/Search.vue'
import Modal from './components/Modal/Modal.vue'
import Logo from './components/Layout/Logo.vue'
import { RouterView } from 'vue-router'

defineOptions({
  name: 'App'
})

defineExpose({
  pushRouter,
  collapse,
  inputTreeSelect,
  'modal:component': modalShow,
  'datepicker:show': datepickerShow
})

const emit = defineEmits(['action'])

const instance = getCurrentInstance()

const rootElement = shallowRef()
const midElement = shallowRef()
const modalElement = shallowRef()
const searchElement = shallowRef()
const tooltipElement = shallowRef()
const sidebarElement = shallowRef()
const datepickerElement = shallowRef()

const layout = ref(null)
const loaded = ref(false)
const isMobile = ref(calcIsMobile())
const sidebarWidth = ref(store.getters.get('Storage.sidebarWidth', 26))

watch(
    () => store.state['Storage']['token'],
    bootstrap
)

watch(
    () => store.state['Storage']['root']['dark'],
    (value) => document.documentElement.classList.toggle('dark', !!value)
)

watch(
    () => store.state['Storage']['root']['sidebarShow'],
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

bootstrap()

window.addEventListener('resize', () => {
  const check = calcIsMobile()

  if (check !== isMobile.value) {
    isMobile.value = check
  }
})

document.documentElement.classList.toggle(
    'dark',
    store.getters.get('Storage.root.dark', false)
)

function action () {
  if (typeof instance.exposed[arguments[0]] === 'function') {
    instance.exposed[arguments[0]](...Array.from(arguments).splice(1))
  } else {
    emit('action', ...arguments)
  }
}

function bootstrap () {
  loaded.value = false

  if (!store.getters.get('Storage.token')) {
    login()
  }

  axios.post('/bootstrap').then(({ data: response }) => {
    if (response.data) {
      if (response.data.routes) {
        const routes = router.getRoutes()
        const component = () => import('./pages/AppPage.vue')
        for (const route of response.data.routes) {
          if (routes.some(i => (i.name || i.path) === (route.name || route.path))) {
            continue
          }
          router.addRoute({ ...route, component })
        }
      }

      if (response.data.assets) {
        assets(response.data.assets)
      }

      store.dispatch('set', {
        config: response.data.config || {},
        lang: response.data.lang || {}
      })

      if (response.data?.config?.['site_name']) {
        document.title = response.data.config['site_name']
      }

      Object.entries(import.meta.glob('./components/*/*.vue', { eager: true })).
          forEach(([, { default: module }]) => {
            const name = `App` + (module.name || module.__name)
            if (module?.['__isStatic'] && !instance.appContext.components[name]) {
              instance.appContext.app.component(name, module)
            }
          })

      if (!instance.appContext.components.RouterView) {
        instance.appContext.app.use(router)
      }

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
        instance.slots[slot] = () => {
          const i = response.layout.find(i => i.slot === slot)

          return [
            i && h(Component, {
              layout: i,
              currentRoute: router.currentRoute.value,
              onAction: action
            })
          ]
        }
      }

      instance.slots['global-tabs'] = () => [
        h(GlobalTabs, {
          currentRoute: router.currentRoute.value,
          onAction: action
        })
      ]

      loaded.value = true
      layout.value = true
    } else {
      login()
    }
  }).catch(login)
}

function login () {
  store.dispatch('set', { ['Storage.token']: null })

  if (!instance.appContext.components.RouterView) {
    instance.appContext.app.use(router)
  }

  loaded.value = true
  layout.value = null
  router.to('/auth/login')
}

function assets (assets) {
  assets.forEach(i => {
    switch (i.rel) {
      case 'plugin':
        import(/* @vite-ignore */i.src).then(j => {
          instance.appContext.app.use(j.default)
        })
        break

      case 'component':
        import(/* @vite-ignore */i.src).then(j => {
          instance.appContext.app.component(j.default.name, j.default)
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

function onTouchstartSidebar (event) {
  if (!isMobile.value) {
    return
  }

  let sx = event.touches[0].clientX,
      sy = event.touches[0].clientY,
      sl = null

  midElement.value.addEventListener('touchmove', onTouchmoveSidebar)
  midElement.value.addEventListener('touchend', onTouchendSidebar)

  function onTouchmoveSidebar (event) {
    sl = null

    if (Math.abs(event.touches[0].clientX - sx) < Math.abs(event.touches[0].clientY - sy)) {
      return
    }

    if (event.touches[0].clientX - sx < 0) {
      sl = false
      if (store.getters.get('Storage.root.sidebarShow')) {
        let x = event.touches[0].clientX - sx

        if (Math.abs(x) > sidebarElement.value.offsetWidth) {
          x = -sidebarElement.value.offsetWidth
        }

        sidebarElement.value.style.transform = 'translateX(' + x + 'px)'
        sidebarElement.value.style.transition = 'none'
      }
    } else if (sx < 40) {
      sl = true
      if (!store.getters.get('Storage.root.sidebarShow')) {
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
      sl !== null && store.dispatch('set', { ['Storage.root.sidebarShow']: sl })
    }

    midElement.value.removeEventListener('touchmove', onTouchmoveSidebar)
    midElement.value.removeEventListener('touchend', onTouchendSidebar)
    sidebarElement.value.style.transform = null
    sidebarElement.value.style.transition = null
  }
}

function splitterDown (event) {
  if (isMobile.value) {
    return
  }

  const x = event.clientX
  const w = convertRemToPixels(sidebarWidth.value)

  rootElement.value.classList.add('app-sidebar-resize')
  event.currentTarget.classList.add('active')
  event.currentTarget.addEventListener('mousemove', splitterMove)
  event.currentTarget.addEventListener('mouseup', splitterUp)

  function splitterMove (event) {
    sidebarWidth.value = convertPixelsToRem(
        Math.min(Math.max(w - (x - event.clientX), 64), window.innerWidth * .5)
    )
    store.dispatch('Storage/set', { sidebarWidth: sidebarWidth.value })
  }

  function splitterUp (event) {
    rootElement.value.classList.remove('app-sidebar-resize')
    event.currentTarget.classList.remove('active')
    event.currentTarget.removeEventListener('mousemove', splitterMove)
    event.currentTarget.removeEventListener('mouseup', splitterUp)
  }
}

function pushRouter (route, callback) {
  nextTick(() => router.to(route).then(callback))
}

function calcIsMobile () {
  return 'ontouchstart' in window || navigator.maxTouchPoints || navigator['msMaxTouchPoints'] ||
      window.innerWidth <
      1024
}

function inputTreeSelect (event, context) {
  store.dispatch('set', { event, context })

  const input = context.$el.querySelector('input')
  if (input.classList.contains('focus')) {
    input.classList.remove('focus')
    store.dispatch('set', { treeSelect: false })
  } else {
    input.classList.add('focus')
    store.dispatch('set', { treeSelect: true })
  }
}

function modalShow (event, instance) {
  if (instance.ctx['url']) {
    modalElement.value.open({
      url: instance.ctx['url'],
      owner: instance.ctx
    })
  }
}

function collapse (value) {
  store.dispatch('set', { ['Storage.root.sidebarShow']: !value })
}

function datepickerShow () {
  datepickerElement.value.on(...arguments)
}

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
  <div v-if="loaded" ref="rootElement"
       class="app"
       :class="{
          'app-mobile': isMobile,
          'app-sidebar-hidden': !store.getters.get('Storage.root.sidebarShow', true)
       }">
    <template v-if="layout">
      <div class="grow-0 shrink-0 flex justify-between z-40 shadow bg-gray-750 text-white/80 dark app-position-horizontal">
        <div class="grow-0 flex app-position-start">
          <slot name="top.left"/>
        </div>
        <div class="grow flex justify-center">
          <slot name="top"/>
        </div>
        <div class="grow-0 flex app-position-end">
          <slot name="top.right"/>
        </div>
      </div>
      <div ref="midElement" class="grow flex flex-row overflow-hidden relative" @touchstart="onTouchstartSidebar">
        <div class="z-30 grow-0 shrink-0 flex flex-col justify-between bg-gray-800 w-12 app-left app-position-vertical dark">
          <div class="grow-0 flex">
            <slot name="left.top"/>
          </div>
          <div class="grow flex items-center">
            <slot name="left"/>
          </div>
          <div class="grow-0 flex app-position-end">
            <slot name="left.bottom"/>
          </div>
        </div>
        <div ref="sidebarElement"
             :style="{ width: sidebarWidth + `rem` }"
             class="relative z-20 grow-0 shrink-0 max-w-full lg:max-w-[75%] app-sidebar dark">
          <slot name="sidebar"/>
          <div class="app-resizer grow-0 shrink-0 flex" @mousedown="splitterDown">
            <div/>
          </div>
        </div>
        <div class="grow flex flex-col overflow-hidden z-10 app-main">
          <slot name="global-tabs"/>
        </div>
      </div>

      <modal ref="modalElement"/>
      <search ref="searchElement"/>
      <tooltip ref="tooltipElement"/>
      <datepicker ref="datepickerElement"/>
    </template>

    <router-view v-else/>

    <notifications position="top right" class="app-notifications" :dangerouslySetInnerHtml="true"/>
  </div>
  <div v-else class="flex flex-col h-full justify-center items-center">
    <logo class="w-24 h-24 animate-ping"/>
  </div>
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
.app .app-resizer.active > div {
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
  @apply shrink-0 absolute lg:relative z-20 flex grow-0 h-full border-r border-r-gray-800 bg-gray-750 text-gray-200 transition lg:transition-[width]
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
.app.app-sidebar-resize .app-sidebar {
  @apply transition-none
}
.app .app-main::after {
  @apply lg:hidden content-[""] z-10 fixed left-0 top-14 right-0 bottom-0
}
.app.app-sidebar-hidden .app-main::after {
  @apply hidden
}
</style>
