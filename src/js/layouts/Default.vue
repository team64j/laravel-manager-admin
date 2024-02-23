<script>
import GlobalMenu from '../components/GlobalMenu/GlobalMenu.vue'
import GlobalTabs from '../components/GlobalTabs/GlobalTabs.vue'
import Sidebar from '../components/Sidebar/Sidebar.vue'
import Tooltip from '../components/Tooltip/Tooltip.vue'
import Search from '../components/Search/Search.vue'

export default {
  name: 'DefaultLayout',
  components: { Tooltip, GlobalMenu, GlobalTabs, Sidebar, Search },
  props: ['menu', 'sidebar'],
  data () {
    return {
      sidebarWidth: this.$store.getters.get('Storage.sidebarWidth', 325)
    }
  },
  watch: {
    '$store.state.Storage.root.dark' (value) {
      document.documentElement.classList.toggle('dark', value)
    },
    '$store.state.Storage.root.sidebarShow' (value) {
      this.$refs.sidebar && this.$refs.sidebar.$el.classList.toggle('app-sidebar__hidden', !value)
    }
  },
  mounted () {
    document.documentElement.classList.toggle(
        'dark',
        this.$store.getters.get('Storage.root.dark', false)
    )

    this.$refs.sidebar?.$el.classList.toggle(
        'app-sidebar__hidden',
        !this.$store.getters.get('Storage.root.sidebarShow', true)
    )

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
          this.$router.push(to)
        }
      }
    })
  },
  methods: {
    action () {
      if (typeof this[arguments[0]] === 'function') {
        this[arguments[0]](...Array.from(arguments).splice(1))
      } else {
        this.$emit('action', ...arguments)
      }
    },
    splitterDown (event) {
      this.x = event.clientX
      this.w = this.sidebarWidth
      event.currentTarget.classList.add('active')
      event.currentTarget.addEventListener('mousemove', this.splitterMove)
      event.currentTarget.addEventListener('mouseup', this.splitterUp)
    },
    splitterMove (event) {
      this.sidebarWidth = Math.min(Math.max(this.w - (this.x - event.clientX), 64), window.innerWidth * .64)
      this.$store.dispatch('Storage/set', { sidebarWidth: this.sidebarWidth })
    },
    splitterUp (event) {
      event.currentTarget.classList.remove('active')
      event.currentTarget.removeEventListener('mousemove', this.splitterMove)
      event.currentTarget.removeEventListener('mouseup', this.splitterUp)
    },
    pushRouter (route, callback) {
      if (typeof route === 'string') {
        route = this.$router.resolve(route)
      }

      this.$router.push(route).then(callback)
    },
    inputTreeSelect (event, context) {
      this.$store.dispatch('set', { event, context })

      const input = context.$el.querySelector('input')
      if (input.classList.contains('focus')) {
        input.classList.remove('focus')
        this.$store.dispatch('set', { treeSelect: false })
      } else {
        input.classList.add('focus')
        this.$store.dispatch('set', { treeSelect: true })
      }
    }
  }
}
</script>

<template>
  <div class="app flex flex-col h-full w-full">
    <search ref="search"/>
    <global-menu :data="menu" @action="action"/>
    <div class="app-main">
      <template v-if="sidebar?.slots">
        <sidebar ref="sidebar" class="w-80 shrink-0 shadow-2xl md:shadow overflow-hidden"
                 :style="{ width: `${sidebarWidth}px` }"
                 :layout="sidebar"
                 @action="action"/>
        <div class="relative z-10 md:z-20 group shrink-0 w-0 cursor-col-resize" @mousedown="splitterDown">
          <div class="absolute h-full w-1.5 -ml-0.5"/>
          <div class="absolute h-full w-0.5 group-hover:bg-blue-500 transition"/>
          <div class="fixed z-50 w-full h-full left-0 top-0 hidden cursor-col-resize group-active:block"/>
        </div>
      </template>
      <global-tabs class="grow flex flex-col overflow-hidden" @action="action"/>
    </div>
    <tooltip/>
  </div>
</template>

<style scoped>
.app-main {
  @apply grow flex flex-row overflow-hidden
}
</style>
