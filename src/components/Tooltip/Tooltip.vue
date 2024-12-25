<script setup>
import { getCurrentInstance, nextTick, reactive } from 'vue'

defineOptions({
  name: 'Tooltip'
})

const instance = getCurrentInstance()

const $data = reactive({
  top: 0,
  left: 0,
  html: null,
  type: null,
  isShow: false,
  position: {}
})

let element = null
let timer = 0

function create (event) {
  const el = event.target.closest('[data-tooltip]')

  if (!event.target || event.target === instance.vnode.el || !event.target.getAttribute ||
      !event.target.closest('[data-tooltip]') || event.target.getAttribute('data-tooltip') === '...') {
    return
  }

  event.preventDefault()

  element = true
  const position = el.getBoundingClientRect()
  $data.html = el.getAttribute('data-tooltip')
      // .replace(/<br ?\/?>/g, '\n').replace(/&/g, "&amp;")
      // .replace(/</g, "&lt;")
      // .replace(/>/g, "&gt;")
      // .replace(/"/g, "&quot;")
      // .replace(/'/g, "&#039;")
      .replace(/\r\n|\r|\n/g, '<br>')
  $data.type = el.getAttribute('data-type')

  nextTick(() => {
    $data.top = position.top + position.height
    $data.left = event.clientX

    if ($data.left + instance.vnode.el.offsetWidth + 16 > window.innerWidth) {
      $data.left -= ($data.left + instance.vnode.el.offsetWidth) - window.innerWidth + 16
    } else if ($data.left < 10) {
      $data.left = 10
    }

    if ($data.top + instance.vnode.el.offsetHeight + 16 > window.innerHeight) {
      $data.top -= ($data.top + instance.vnode.el.offsetHeight) - window.innerHeight + 16
    }
  }).then(() => timer = setTimeout(() => $data.isShow = true, 300))
}

function destroy (event) {
  if (!element || event.relatedTarget === instance.vnode.el) {
    return
  }

  clearTimeout(timer)

  element = null
  timer = null
  $data.isShow = false
}

document.addEventListener('mouseover', create)
document.addEventListener('mousedown', destroy)
document.addEventListener('mouseout', destroy)
document.addEventListener('keydown', destroy)
document.addEventListener('click', destroy)
</script>

<template>
  <div class="app-tooltip" :class="{
    'opacity-100 visible': $data.isShow,
    'opacity-0 invisible': !$data.isShow,
    '!bg-rose-600': $data.type === 'error'
  }" :style="{
          top: $data.top + 'px',
          left: $data.left + 'px'
        }" @mousedown.stop="" @click.stop="" @mouseover.stop="">
    <div class="pointer-events-none" v-html="$data.html"/>
  </div>
</template>

<style scoped>
.app-tooltip {
  @apply fixed z-[999] -translate-x-1 -translate-y-1 m-3 py-2.5 px-4 max-w-80 rounded bg-slate-50/90 text-gray-800 dark:bg-gray-600/90 dark:text-gray-50 text-sm shadow transition-all
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
  @apply cursor-help text-gray-200 dark:text-gray-300
}
i[data-tooltip][data-type="error"] {
  @apply text-rose-500 dark:text-rose-500
}
i[data-tooltip]:not([class*="fa-"])::before {
  content: "\f059";
  font-family: "Font Awesome 6 Free", serif;
  font-style: normal;
}
</style>
