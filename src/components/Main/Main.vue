<script setup>
import { getCurrentInstance, ref } from 'vue'

defineOptions({
  name: 'Main',
  __isStatic: true,
})

const currentInstance = getCurrentInstance()

const props = defineProps(['data', 'meta', 'layout', 'errors', 'loaderDelay', 'class', 'url'])

const $emit = defineEmits(['action'])

const resizer = ref(null)

function onMousedownResizer (event) {
  resizer.value.addEventListener('mousemove', onMousemoveResizer)
  resizer.value.addEventListener('mouseup', onMouseupResizer)
  resizer.value.x = event.clientX - resizer.value.parentElement.offsetWidth
}

function onMousemoveResizer (event) {
  let w = Math.max(Math.min(event.clientX - resizer.value.x, currentInstance.vnode.el.offsetWidth / 2), 50)
  resizer.value.parentElement.style.width = w + 'px'
}

function onMouseupResizer () {
  resizer.value.removeEventListener('mousemove', onMousemoveResizer)
  resizer.value.removeEventListener('mouseup', onMouseupResizer)
}
</script>

<template>
  <div class="app-main">

    <div v-if="$slots['actions']" class="app-main__actions">
      <slot name="actions"/>
    </div>

    <div v-if="$slots['title']" class="app-main__title">
      <slot name="title"/>
    </div>

    <div class="flex grow overflow-auto">
      <div v-if="$slots['sidebar']" class="app-main__sidebar">
        <div class="app-main__resizer" ref="resizer" @mousedown="onMousedownResizer"/>
        <slot name="sidebar"/>
      </div>

      <div v-if="$slots['main']" class="app-main__main">
        <slot name="main"/>
      </div>
    </div>

    <div v-if="$slots['crumbs']" class="app-main__crumbs">
      <slot name="crumbs"/>
    </div>

  </div>
</template>

<style scoped>
.app-main {
  @apply grow flex flex-col overflow-hidden
}
.app-main__actions, .app-main__title {
  @apply grow-0
}
.app-main__sidebar {
  @apply grow-0 shrink-0 w-80 relative
}
.app-main__main {
  @apply flex grow overflow-hidden
}
.app-main__crumbs {
  @apply grow-0 bg-gray-100 dark:bg-gray-800
}
.app-main__resizer {
  @apply absolute top-0 right-0 bottom-0 w-[2px] cursor-col-resize bg-gray-50 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-500 transition
}
.app-main__resizer:active {
  @apply bg-blue-500 transition-none
}
.app-main__resizer::after {
  @apply block w-2 -mx-0.5 h-full content-[""]
}
.app-main__resizer:active::before {
  @apply fixed z-10 left-0 top-0 right-0 bottom-0 cursor-col-resize content-[""]
}
</style>
