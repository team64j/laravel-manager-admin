<script>
import KeepAliveComponent from './KeepAlive'
import router from '../../router'

import('./GlobalTabs.css')

export default {
  name: 'GlobalTabs',
  components: { KeepAliveComponent },

  watch: {
    $route (route) {
      this.addTab(route)
    }
  },

  data () {
    return {
      closing: false
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

    getComponent (component) {
      return component
    },

    init () {
      this.$store.dispatch('GlobalTabs/init')
    },

    addTab (data) {
      this.$store.dispatch('GlobalTabs/add', data)
    },

    setTab (data) {
      this.$store.dispatch('GlobalTabs/set', data)
    },

    closeTab (callback) {
      const route = typeof callback === 'object' ? callback : router.currentRoute.value
      const tab = this.$store.getters['GlobalTabs/find'](route)
      if (tab?.changed && !confirm(this.$store.getters.get('lang.warning_not_saved'))) {
        return
      }

      this.closing = true
      this.$store.dispatch('GlobalTabs/del', route).then(() => {
        setTimeout(() => this.closing = false, 100)

        if (typeof callback === 'function') {
          callback()
        }
      })
    },

    toTab (data) {
      const tab = this.$store.getters['GlobalTabs/find'](router.currentRoute.value)
      if (tab?.changed && !confirm(this.$store.getters.get('lang.warning_not_saved'))) {
        return
      }
      this.$store.dispatch('GlobalTabs/to', data)
    },

    clickTab (tab) {
      if (this.closing) {
        return
      }

      if (router.currentRoute.value.fullPath !== tab.fullPath) {
        this.$emit('action', 'pushRouter', tab)
      }
    },

    dblClickTab (tab) {
      if (this.closing) {
        return
      }
      this.$store.dispatch('GlobalTabs/reload', tab)
    },

    dragTabs (event) {
      this.scrollLeft = this.$refs.panel.scrollLeft
      this.x = event.clientX
      this.$el.addEventListener('mousemove', this.moveTabs)
      this.$el.addEventListener('mouseup', this.endMoveTabs)
    },

    moveTabs (event) {
      const left = this.x - event.clientX + this.scrollLeft

      if (Math.abs(left) < 5) {
        return
      }

      !this.$el.classList.contains('drag') && this.$el.classList.add('drag')
      this.$refs.panel.scrollLeft = left
    },

    endMoveTabs () {
      this.$el.removeEventListener('mousemove', this.moveTabs)
      this.$el.removeEventListener('mouseup', this.endMoveTabs)
      this.$el.classList.remove('drag')
    }
  }
}
</script>

<template>
  <div class="app-global-tabs group">

    <div class="grow-0">
      <div class="relative h-[2.35rem] bg-slate-200 dark:bg-gray-800 overflow-hidden">
        <div class="relative flex flex-nowrap pt-0.5 h-14 overflow-auto" ref="panel">
          <a v-for="(tab, i) in this.$store.getters['GlobalTabs/tabs']()"
             :key="i"
             :data-to="tab.path"
             :class="{ 'app-global-tabs__tab-active': tab.active }"
             @click="clickTab(tab)"
             @dblclick="dblClickTab(tab)"
             @mousedown="dragTabs"
             class="app-global-tabs__tab"
             :data-tooltip="tab.meta.title">

            <span v-if="tab.loading || tab.meta.icon" class="app-global-tabs__tab-icon">
              <i v-if="tab.loading"
                 class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white mt-1.5 h-5 w-5 animate-spin"/>
              <i v-else-if="tab.meta.icon" :class="tab.meta.icon"/>
            </span>

            <span v-if="tab.meta.title" class="app-global-tabs__tab-title">
              {{ tab.meta.title }}
            </span>

            <span v-if="!tab.meta.fixed" class="app-global-tabs__tab-close" @mousedown.stop="closeTab(tab)">✕</span>

            <span v-if="tab.changed" class="app-global-tabs__tab-changed"/>
          </a>
        </div>
        <div class="fixed left-0 right-0 top-0 bottom-0 hidden cursor-grabbing group-[.drag]:block"/>
      </div>
    </div>

    <div class="grow flex overflow-hidden">

      <router-view v-slot="{ Component }">
        <keep-alive-component :include="this.$store.getters['GlobalTabs/keys']()">
          <component
              v-if="!$route?.meta?.['isIframe']"
              :key="this.$store.getters['GlobalTabs/key']($route)"
              :is="Component"
              @action="action"/>
        </keep-alive-component>
      </router-view>

      <div
          class="grow overflow-hidden"
          v-for="{ path, matched: [{ components: { default: component }}] } in this.$store.getters['GlobalTabs/frames']()"
          v-show="$route.path === path">
        <component
            :key="path"
            :is="getComponent(component)"
            @action="action"/>
      </div>

    </div>

  </div>
</template>
