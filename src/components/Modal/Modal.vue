<script setup>
import Component from '../Layout/Component.vue'
import router from '../../router'
import { getCurrentInstance, reactive, ref } from 'vue'

defineOptions({
  name: 'Modal',
  __isStatic: true
})

const instance = getCurrentInstance()

const $emit = defineEmits(['action'])

const $data = reactive({
  show: false,
  title: '',
  icon: '',
  owner: null,
  componentLoaded: false,
  componentProps: {},
  currentRoute: null
})

const modal = ref(null)

function action () {
  if (typeof instance.exposed[arguments[0]] === 'function') {
    instance.exposed[arguments[0]](...Array.from(arguments).splice(1))
  } else {
    $emit('action', ...arguments)
  }
}

function open () {
  $data.show = true
}

function close () {
  $data.show = false
  $data.owner = null
  $data.componentLoaded = false
}

function setTitle (value) {
  $data.title = value

  return this
}

function setOwner (value) {
  $data.owner = value

  return this
}

function setUrl (route) {
  if (typeof route === 'string') {
    route = router.parse(route)
  }

  $data.currentRoute = route

  if (!$data.componentLoaded) {
    axios.get(route.fullPath).then(({ data }) => {
      $data.componentLoaded = true
      $data.componentProps = data
      $data.icon = data.meta['icon']
      $data.title = data.meta['title']
    })
  }

  return this
}

function pushRouter (route) {
  setUrl(router.parse(route))
}

function onMousedown (event) {
  document.addEventListener('mousemove', onMousemove)
  document.addEventListener('mouseup', onMouseup)
  $data.x = event.clientX
  $data.y = event.clientY
  $data.l = modal.value.offsetLeft
  $data.t = modal.value.offsetTop
  modal.value.classList.add('opacity-50')
}

function onMousemove (event) {
  let x = $data.l + (event.clientX - $data.x)
  let y = $data.t + (event.clientY - $data.y)

  modal.value.style.left = x + 'px'
  modal.value.style.top = y + 'px'
}

function onMouseup () {
  document.removeEventListener('mousemove', onMousemove)
  document.removeEventListener('mouseup', onMouseup)
  modal.value.classList.remove('opacity-50')
}

function modalSelect (data) {
  if ($data.owner) {
    $data.owner.model = data.value
    close()
  }
}

defineExpose({
  open,
  close,
  setUrl,
  setOwner,
  setTitle,
  pushRouter,
  'modal:select': modalSelect
})
</script>

<template>
  <transition name="fade">
    <teleport to="body" v-if="$data.show">
      <div class="app-modal">
        <div class="app-modal__overlay" @click="$data.show=!$data.show"/>
        <div class="app-modal__wrap" ref="modal">
          <div class="app-modal__header">
            <div v-if="$data.icon" class="pl-4 flex items-center">
              <i :class="$data.icon"/>
            </div>
            <div class="grow px-4 py-1" v-html="$data.title" @mousedown="onMousedown"/>
            <button type="button" class="btn-red items-center" @click="close">
              <i class="fa fa-close"/>
            </button>
          </div>
          <div class="app-modal__main">
            <Component v-if="$data.componentLoaded"
                       v-bind="$data.componentProps"
                       :currentRoute="$data.currentRoute"
                       @action="action"/>
          </div>
          <div class="app-modal__footer"/>
        </div>
      </div>
    </teleport>
  </transition>
</template>

<style>
.app-modal {
  @apply fixed z-50 top-0 left-0 w-full h-full bg-black/5 p-5 flex items-center justify-center
}
.app-modal__overlay {
  @apply absolute left-0 top-0 right-0 bottom-0
}
.app-modal__wrap {
  @apply absolute flex flex-col rounded bg-white dark:bg-gray-700 shadow-lg w-4/5 h-4/5 min-w-60 min-h-60 max-w-[98%] max-h-[98%] resize overflow-hidden transition-opacity
}
.app-modal__header {
  @apply flex bg-white/5 cursor-grab active:cursor-grabbing
}
.app-modal__main {
  @apply grow flex overflow-auto
}
.app-modal__footer {
  @apply flex
}
</style>
