<script>
import KeepAliveComponent from './KeepAlive'
import router from '../../router'
import Frame from '../Layout/Frame.vue'

import('./GlobalTabs.css')

export default {
  name: 'GlobalTabs',
  __isStatic: true,
  components: { KeepAliveComponent, Frame },
  emits: ['action'],
  watch: {
    $route (route) {
      this.addTab(route)
    }
  },
  data () {
    return {
      tabs: [],
      keys: []
    }
  },
  computed: {
    pages () {
      return this.tabs.filter(i => !i.meta['isIframe']).map(i => router.key(i))
    },
    frames () {
      return this.tabs.filter(i => i.meta['isIframe'])
    }
  },
  created () {
    this.init()
  },
  methods: {
    action () {
      if (typeof this[arguments[0]] === 'function') {
        this[arguments[0]](...Array.from(arguments).splice(1))
      } else {
        this.$emit('action', ...arguments)
      }
    },
    init () {
      router.getRoutes().filter(i => i?.meta?.fixed).map(i => this.addTab(router.parse(i)))
    },
    addTab (data) {
      if (!data) {
        return
      }

      data = router.parse(data)

      let is = false

      for (const i of this.tabs) {
        i.active = router.key(i, data)

        if (i.active) {
          is = true
          data.meta = i.meta

          if (i.path !== data.path) {
            // reload tab
          }

          Object.assign(i, data)
        }
      }

      if (!is && !data.meta['hidden']) {
        data.active = true
        this.tabs.push(data)
      }

      this.keys = this.tabs.map(i => router.key(i))
    },
    setTab (data) {
      this.$store.dispatch('set', { tabsLoading: data.loading })

      if (data.key) {
        const index = this.keys.indexOf(data.key)
        index > -1 && window._.mergeWith(this.tabs[index], data)
      } else {
        this.tabs.map(i => i.active && window._.mergeWith(i, data))
      }
    },
    closeTab (callback) {
      let route = typeof callback === 'object' ? callback : router.currentRoute.value
      const index = this.keys.indexOf(router.key(route))
      const tab = this.tabs[index]

      if (tab?.changed && !confirm(this.$store.getters.get('lang.warning_not_saved'))) {
        return
      }

      if (tab?.meta['fixed']) {
        return
      }

      index > -1 && this.tabs.splice(index, 1) && this.keys.splice(index, 1)

      if (tab.active && index > 0 && this.tabs[index - 1]) {
        router.to(this.tabs[index - 1])
      }

      if (typeof callback === 'function') {
        callback()
      }

      return index
    },
    toTab (data) {
      const tab = this.find(router.currentRoute.value)
      if (tab?.changed && !confirm(this.$store.getters.get('lang.warning_not_saved'))) {
        return
      }
      this.closeTab(router.currentRoute.value)
      router.to(data)
    },
    clickTab (tab) {
      router.to(tab)
    },
    dblClickTab (data) {
      router.key(router.currentRoute.value, data) &&
      router.replace(router.parse({ path: '/redirect' + data.path, query: data.query })).then(() => {
        const index = this.keys.indexOf(router.key(data))
        index > -1 && this.keys.splice(index, 1)
      })
    },
    find (data) {
      return this.tabs.filter(i => router.key(i, data))[0] || null
    }
  }
}
</script>

<template>
  <div class="app-global-tabs group">

    <div class="grow-0">
      <div class="relative h-[2.4rem] bg-slate-100 dark:bg-gray-800 overflow-hidden">
        <div class="relative flex flex-nowrap mx-0.5 min-h-[2.35rem] overflow-auto" ref="panel">
          <a v-for="(tab, i) in this.tabs"
             :key="i"
             :data-to="tab.path"
             :class="{ 'app-global-tabs__tab-active': tab.active }"
             @mousedown="clickTab(tab)"
             @dblclick="dblClickTab(tab)"
             class="app-global-tabs__tab">

            <span v-if="tab.loading || tab.meta.icon" class="app-global-tabs__tab-icon">
              <i v-if="tab.loading"
                 class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-4 w-4 animate-spin"/>
              <i v-else-if="tab.meta.icon" :class="tab.meta.icon"/>
            </span>

            <span v-if="tab.meta.title" class="app-global-tabs__tab-title" :data-tooltip="tab.meta.title">
              <span class="block truncate w-28">{{ tab.meta.title }}</span>
            </span>

            <span v-if="!tab.meta.fixed" class="app-global-tabs__tab-close" @mousedown.stop="closeTab(tab)">✕</span>

            <span v-if="tab.changed" class="app-global-tabs__tab-changed"/>
          </a>
        </div>
        <div class="fixed left-0 right-0 top-0 bottom-0 hidden cursor-grabbing group-[.drag]:block"/>
      </div>
    </div>

    <div class="grow flex overflow-hidden">

      <router-view v-slot="slot">
        <keep-alive-component :include="keys">
          <component v-if="!slot.route?.meta?.['isIframe']"
                     :is="slot.Component"
                     :key="$router.key(slot.route)"
                     @action="action"/>
        </keep-alive-component>
      </router-view>

      <div class="grow overflow-hidden app-global-tabs__frames">
        <template v-for="{ path } in frames" :key="path">
          <Frame v-if="keys.includes(path)" v-show="$route.path === path" @action="action"/>
        </template>
      </div>

    </div>

  </div>
</template>
