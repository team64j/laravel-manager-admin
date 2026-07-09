<script setup>
import { computed, getCurrentInstance, nextTick, onMounted, reactive, shallowRef, watch } from 'vue'
import { action } from '@/composables'
import { mergeDeep } from '@/utils'
import router from '@/router'
import store from '@/services/store'
import session from '@/services/session'
import KeepAliveComponent from '@/components/GlobalTabs/KeepAlive.vue'
import Frame from '@/components/Frame/Frame.vue'
import Button from '@/components/Button/Button.vue'

const currentInstance = getCurrentInstance()

defineOptions({
  name: 'GlobalTabs',
  __isStatic: true
})

const $props = defineProps({
  currentRoute: {
    type: Object,
    default: router.currentRoute.value
  }
})

const $emit = defineEmits(['action'])

const $data = reactive({
  tabs: session.get('global_tabs') ?? [],
  keys: []
})

const frames = computed(() => $data.tabs.filter(i => i.meta['isIframe']))

const keepAlive = shallowRef()

function init () {
  router.getRoutes().filter(i => i?.meta?.fixed).map(i => addTab(router.parse(i)))
}

function addTab (data) {
  if (!data) {
    return
  }

  data = router.parse(data)

  let is = false

  $data.tabs.forEach(i => {
    i.active = router.key(i, data)

    if (i.active) {
      is = true
      data.meta = i.meta
      Object.assign(i, data)
    }
  })

  if (!is && !data.meta['hidden']) {
    data.active = true
    $data.tabs.push(data)
  }

  $data.keys = $data.tabs.map(i => router.key(i))

  let right = 0,
      width = 0,
      index = $data.tabs.findIndex(i => i.active)

  if (currentInstance.refs.panel) {
    nextTick(() => {
      if (!currentInstance.refs.panel) {
        return
      }

      currentInstance.refs.panel.querySelectorAll('button').forEach((i, k) => {
        i.styles = getComputedStyle(i)

        if (k <= index) {
          width += i.offsetWidth + parseFloat(i.styles.marginLeft) + parseFloat(i.styles.marginRight)

          if (k < index) {
            right += i.offsetWidth + parseFloat(i.styles.marginLeft)
          }
        }
      })

      if (currentInstance.refs.panel.scrollLeft > right) {
        currentInstance.refs.panel.scrollLeft = right
      }

      if (currentInstance.refs.panel.offsetWidth < width) {
        currentInstance.refs.panel.scrollLeft = width - currentInstance.refs.panel.offsetWidth
      }
    })
  }
}

function setTab (data) {
  store.set({ tabsLoading: data.loading })

  if (data.key) {
    const index = $data.keys.findIndex(i => i === data.key)
    index > -1 && mergeDeep($data.tabs[index], data)
  } else {
    $data.tabs.map(i => i.active && mergeDeep(i, data))
  }
}

function closeTab (callback) {
  let route = typeof callback === 'object' ? callback : router.currentRoute.value
  const index = $data.keys.findIndex(i => i === router.key(route))
  const tab = $data.tabs[index]

  if (tab?.['changed'] && !confirm(store.get('lexicon.messages.warning.notSaved'))) {
    return
  }

  if (tab?.meta['fixed']) {
    return
  }

  index > -1 && $data.tabs.splice(index, 1) && $data.keys.splice(index, 1)

  if (tab.active && index > 0 && $data.tabs[index - 1]) {
    router.to($data.tabs[index - 1])
  }

  if (typeof callback === 'function') {
    callback()
  }

  return index
}

function toTab (data) {
  const tab = find(router.currentRoute.value)
  if (tab?.['changed'] && !confirm(store.get('lexicon.messages.warning.notSaved'))) {
    return
  }
  this.closeTab(router.currentRoute.value)
  router.to(data)
}

function replaceTab (data) {
  for (const i in $data.tabs) {
    if (router.key($data.tabs[i], router.currentRoute.value)) {
      Object.assign($data.tabs[i], data)
      $data.keys[i] = router.key(data)
      router.to(data)
      break
    }
  }
}

function clickTab (tab) {
  router.to(tab)
}

function dblClickTab (data) {
  router.key(router.currentRoute.value, data) &&
  router.replace(router.parse({ path: '/redirect' + data.path, query: data.query })).then(() => {
    const index = $data.keys.indexOf(router.key(data))
    index > -1 && $data.keys.splice(index, 1)
  })
}

function find (data) {
  return $data.tabs.filter(i => router.key(i, data))[0] || null
}

onMounted(() => {
  watch(
      () => router.currentRoute.value,
      addTab
  )

  watch(
      () => $data.tabs,
      (data) => {
        session.set('global_tabs', data.map(i => ({
          path: i.path,
          query: i.query,
          meta: i?.meta,
          params: i?.params,
          name: i?.name,
          matched: [{ path: i?.matched?.[0].path }]
        })))
      },
      { deep: true }
  )

  init()
})

defineExpose({
  toTab,
  addTab,
  setTab,
  closeTab,
  replaceTab,
  keepAlive
})
</script>

<template>
  <div class="grow flex flex-col overflow-hidden">

    <div class="grow-0 dark">
      <div ref="panel" class="relative flex flex-nowrap bg-gray-100 dark:bg-gray-800 overflow-hidden !overflow-x-auto">
        <Button v-for="(tab, i) in $data.tabs"
                :key="i"
                :data-to="tab.path"
                :class="{ '!bg-blue-600 !text-slate-50': tab.active }"
                :icon="[tab.loading ? 'inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin' : tab.meta.icon]"
                @mousedown="clickTab(tab)"
                @dblclick="dblClickTab(tab)"
                class="shrink-0 my-0.5 ml-0.5 last:mr-0.5 min-w-10 border-none !ring-0 btn-sm text-base text-left leading-5">
          <template v-if="!tab.meta.fixed">
            <span class="grow w-28 pl-1 truncate" :data-tooltip="tab.meta.title">
              {{ tab.meta.title || `...` }}
            </span>
            <span class="inline-flex items-center ml-0 -mr-3 px-3 py-0 pointer-events-auto opacity-70 hover:opacity-100"
                  @mousedown.stop="closeTab(tab)">✕</span>
          </template>
          <span v-if="tab.changed" class="absolute top-1 left-1 h-2 w-2 bg-amber-400 rounded-full"/>
        </Button>
      </div>
    </div>

    <div class="grow flex overflow-hidden">

      <router-view v-slot="slot">
        <keep-alive-component :include="$data.keys" ref="keepAlive">
          <component v-if="!slot.route?.meta?.['isIframe']"
                     :is="slot.Component"
                     :key="router.key(slot.route)"
                     :currentRoute="currentRoute"
                     @action="(...args) => action.call(currentInstance, ...args)"/>
        </keep-alive-component>
      </router-view>

      <div class="grow overflow-hidden">
        <template v-for="{ path } in frames" :key="path">
          <Frame v-if="$data.keys.includes(path)" v-show="currentRoute['path'] === path"
                 @action="(...args) => action.call(currentInstance, ...args)"/>
        </template>
      </div>

    </div>

  </div>
</template>
