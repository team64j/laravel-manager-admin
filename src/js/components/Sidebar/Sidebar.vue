<template>
  <div class="app-sidebar">
    <component :layout="layout" class="w-full h-full" @action="action"/>
  </div>
</template>

<script>
import Component from '../Layout/Component.vue'

export default {
  name: 'Sidebar',
  components: { Component },
  props: {
    layout: [Object, Array]
  },

  methods: {
    action () {
      if (typeof this[arguments[0]] === 'function') {
        this[arguments[0]](...Array.from(arguments).splice(1))
      } else {
        this.$emit('action', ...arguments)
      }
    }
  }
}
</script>

<style scoped>
.app-sidebar {
  @apply absolute md:relative z-20 translate-y-0 flex grow-0 w-96 h-full bg-slate-200 dark:bg-gray-800 dark:text-slate-200 transition-all md:transition-none
}
.app-sidebar > div {
  @apply w-full
}
.app-sidebar.app.app-sidebar__resize {
  @apply transition-none
}
.app-sidebar:not(.app-sidebar__hidden) {
  @apply translate-x-0 md:relative
}
.app-sidebar.app-sidebar__hidden {
  @apply -translate-x-full absolute md:relative md:translate-x-0 md:!w-0
}
</style>

<style>
.app .app-sidebar .app-tree {
  @apply bg-slate-50 dark:bg-gray-800
}
.app .app-sidebar .app-tabs {
  @apply p-0
}
.app .app-sidebar .app-tabs .app-tabs__rows {
  @apply h-[2.35rem] m-0
}
.app .app-sidebar .app-tabs .app-tabs__row {
  @apply py-0.5 mx-0.5 h-20
}
.app .app-sidebar .app-tabs .app-tabs__tab {
  @apply flex justify-center px-2 py-1 mx-0.5 h-8 w-10 hover:bg-slate-300/50 dark:hover:bg-gray-700
}
.app .app-sidebar .app-tabs .app-tabs__tab i {
  @apply w-4 text-slate-600 dark:text-slate-300
}
.app .app-sidebar .app-tabs .app-tabs__tab.app-tabs__tab-active {
  @apply text-white bg-blue-600
}
.app .app-sidebar .app-tabs .app-tabs__tab.app-tabs__tab-active i {
  @apply text-white
}
.app .app-sidebar .app-tabs .app-tabs__page {
  @apply p-0 bg-transparent border-0 dark:bg-transparent shadow-none rounded-none
}
</style>

