<script setup>
import { nextTick, ref, shallowRef } from 'vue'

defineOptions({
  name: 'Tooltip'
})

const rootElement = shallowRef()
const isShow = ref(false)
const style = ref(null)

let element, html, type, timer = 0

function create (event) {
  element = event.target.closest('[data-tooltip]')

  if (!event.target || !rootElement.value || event.target === rootElement.value || !event.target.getAttribute ||
      !element || event.target.getAttribute('data-tooltip') === '...') {
    return
  }

  event.preventDefault()

  html = element.getAttribute('data-tooltip')
  type = element.getAttribute('data-type')

  style.value = { top: `0px`, left: `0px` }

  nextTick(() => {
    const position = element.getBoundingClientRect()
    const { offsetWidth, offsetHeight } = rootElement.value
    let top = position.top + position.height
    let left = event.clientX

    if (left + offsetWidth + 16 > window.innerWidth) {
      left -= (left + offsetWidth) - window.innerWidth + 16
    } else if (left < 10) {
      left = 10
    }

    if (top + offsetHeight + 16 > window.innerHeight) {
      top -= (top + offsetHeight) - window.innerHeight + 16
    }

    style.value = { top: `${top}px`, left: `${left}px` }
  }).then(() => timer = setTimeout(() => isShow.value = true, 300))
}

function destroy (event) {
  if (!element || event.relatedTarget === rootElement.value) {
    return
  }

  clearTimeout(timer)

  element = null
  timer = null
  isShow.value = false
}

document.addEventListener('mouseover', create)
document.addEventListener('mousedown', destroy)
document.addEventListener('mouseout', destroy)
document.addEventListener('keydown', destroy)
document.addEventListener('click', destroy)
</script>

<template>
  <teleport to="body">
    <div ref="rootElement"
         class="app-tooltip"
         :class="{
            '!bg-rose-600': type === 'error',
            '!visible !opacity-100': isShow,
            '!duration-0': !isShow
          }"
         :style="style"
         @click.stop=""
         @mousedown.stop=""
         @mouseover.stop="">
      <div class="pointer-events-none" v-html="html"/>
    </div>
  </teleport>
</template>

<style scoped>
.app-tooltip {
  @apply fixed z-[999] opacity-0 invisible -translate-x-1 -translate-y-1 m-3 py-2.5 px-4 max-w-80 rounded bg-gray-50/90 text-gray-800 dark:bg-gray-600/90 dark:text-gray-50 text-sm shadow transition-all
}
</style>

<style>
.app-tooltip .badge {
  @apply float-right ml-2 px-1.5 bg-blue-500 text-white rounded
}
i[data-tooltip] > *:not(.pointer-events-auto) {
  @apply pointer-events-none
}
i[data-tooltip]:not([class*="fa-"]) {
  @apply cursor-help text-gray-200 dark:text-gray-300 leading-[0]
}
i[data-tooltip]:not([class*="fa-"])::before {
  content: "\f059";
  font-family: "Font Awesome 6 Free", serif;
  font-style: normal;
}
i[data-tooltip][data-type="error"] {
  @apply text-rose-500 dark:text-rose-500
}
</style>
