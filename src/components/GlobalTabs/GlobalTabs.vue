<script>
import KeepAliveComponent from './KeepAlive'
import router from '../../router'
import Frame from '../Layout/Frame.vue'
import { mergeWith } from 'lodash'

export default {
  name: 'GlobalTabs',
  __isStatic: true,
  components: { KeepAliveComponent, Frame },
  emits: ['action'],
  watch: {
    '$route' (route) {
      this.addTab(route)
    }
  },
  props: {
    currentRoute: Object
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
    },
    router () {
      return router
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

      this.tabs.forEach(i => {
        i.active = router.key(i, data)

        if (i.active) {
          is = true
          data.meta = i.meta
          Object.assign(i, data)
        }
      })

      if (!is && !data.meta['hidden']) {
        data.active = true
        this.tabs.push(data)
      }

      this.keys = this.tabs.map(i => router.key(i))

      let right = 0,
          width = 0,
          index = this.tabs.findIndex(i => i.active)

      if (this.$refs.panel) {
        this.$nextTick(() => {
          this.$refs.panel.querySelectorAll('button').forEach((i, k) => {
            i.styles = getComputedStyle(i)

            if (k <= index) {
              width += i.offsetWidth + parseFloat(i.styles.marginLeft) + parseFloat(i.styles.marginRight)

              if (k < index) {
                right += i.offsetWidth + parseFloat(i.styles.marginLeft)
              }
            }
          })

          if (this.$refs.panel.scrollLeft > right) {
            this.$refs.panel.scrollLeft = right
          }

          if (this.$refs.panel.offsetWidth < width) {
            this.$refs.panel.scrollLeft = width - this.$refs.panel.offsetWidth
          }
        })
      }
    },
    setTab (data) {
      this.$store.dispatch('set', { tabsLoading: data.loading })

      if (data.key) {
        const index = this.keys.indexOf(data.key)
        index > -1 && mergeWith(this.tabs[index], data)
      } else {
        this.tabs.map(i => i.active && mergeWith(i, data))
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
  <div class="grow flex flex-col overflow-hidden">

    <div class="grow-0 dark">
      <div ref="panel" class="relative flex flex-nowrap bg-slate-100 dark:bg-gray-800 overflow-hidden !overflow-x-auto">
        <button v-for="(tab, i) in this.tabs"
                :key="i"
                :data-to="tab.path"
                :class="{ '!bg-blue-600 dark:!bg-blue-600': tab.active }"
                @mousedown="clickTab(tab)"
                @dblclick="dblClickTab(tab)"
                class="relative shrink-0 inline-flex items-center justify-center my-0.5 ml-0.5 last:mr-0.5 min-w-10 border-none !ring-0 btn-sm text-base text-left">

            <span v-if="tab.loading || tab.meta.icon" :class="{ 'mr-2': tab.meta.title }"
                  class="w-5 inline-flex items-center justify-center">
              <i v-if="tab.loading"
                 class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-4 w-4 animate-spin"/>
              <i v-else-if="tab.meta.icon" :class="tab.meta.icon"/>
            </span>

          <span v-if="tab.meta.title" class="grow w-28 truncate" :data-tooltip="tab.meta.title">
            {{ tab.meta.title }}
          </span>

          <span v-if="!tab.meta.fixed"
                class="inline-flex items-center ml-0 -mr-3 px-3 py-0 pointer-events-auto opacity-70 hover:opacity-100"
                @mousedown.stop="closeTab(tab)">✕</span>

          <span v-if="tab.changed" class="absolute top-1 left-1 h-2 w-2 bg-amber-400 rounded-full"/>
        </button>
      </div>
    </div>

    <div class="grow flex overflow-hidden">

      <router-view v-slot="slot">
        <keep-alive-component :include="keys">
          <component v-if="!slot.route?.meta?.['isIframe']"
                     :is="slot.Component"
                     :key="router.key(slot.route)"
                     :currentRoute="currentRoute"
                     @action="action"/>
        </keep-alive-component>
      </router-view>

      <div class="grow overflow-hidden">
        <template v-for="{ path } in frames" :key="path">
          <Frame v-if="keys.includes(path)" v-show="currentRoute['path'] === path" @action="action"/>
        </template>
      </div>

    </div>

  </div>
</template>
