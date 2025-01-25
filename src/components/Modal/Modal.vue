<script setup>
import { getCurrentInstance, reactive, shallowRef } from 'vue'
import GlobalComponent from '../GlobalComponent/GlobalComponent.vue'
import router from '../../router'
import { action } from '../../composables'
import Button from '../Button/Button.vue'

defineOptions({
  name: 'Modal',
  __isStatic: true
})

const currentInstance = getCurrentInstance()

const emit = defineEmits(['action'])

const data = reactive({
  show: false,
  title: '',
  icon: '',
  owner: null,
  componentLoaded: false,
  componentProps: {},
  currentRoute: null
})

const modalElement = shallowRef()

function _action () {
  return action.call(currentInstance.exposed, ...arguments)
}

function open (opt) {
  Object.assign(data, { ...opt })

  if (opt.url) {
    setUrl(opt.url)
  }

  data.show = true
}

function close () {
  data.show = false
  data.owner = null
  data.componentLoaded = false
}

function setTitle (value) {
  data.title = value

  return this
}

function setOwner (value) {
  data.owner = value

  return this
}

function setUrl (route) {
  if (typeof route === 'string') {
    route = router.parse(route)
  }

  data.currentRoute = route

  if (!data.componentLoaded) {
    axios.get(route.fullPath).then(r => {
      data.componentLoaded = true
      data.componentProps = r.data
      data.icon = r.data['meta']['icon']
      data.title = r.data['meta']['title']
    })
  }

  return this
}

function pushRouter (route) {
  setUrl(router.parse(route))

  return this
}

function onMousedown (event) {
  data.x = event.clientX
  data.y = event.clientY
  data.l = modalElement.value.offsetLeft
  data.t = modalElement.value.offsetTop
  modalElement.value.classList.add('opacity-50')
  document.addEventListener('mousemove', onMousemove)
  document.addEventListener('mouseup', onMouseup)
}

function onMousemove (event) {
  let x = data.l + (event.clientX - data.x)
  let y = data.t + (event.clientY - data.y)

  modalElement.value.style.left = x + 'px'
  modalElement.value.style.top = y + 'px'
}

function onMouseup () {
  modalElement.value.classList.remove('opacity-50')
  document.removeEventListener('mousemove', onMousemove)
  document.removeEventListener('mouseup', onMouseup)
}

function modalSelect (value) {
  if (data.owner) {
    if (data.owner._.exposed.model) {
      data.owner._.exposed.model.value = value.value
    } else {
      data.owner.model = value.value
    }
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
    <teleport to="body" v-if="data.show">
      <div class="app-modal">
        <div class="app-modal__overlay" @click="data.show=!data.show"/>
        <div class="app-modal__wrap" ref="modalElement">
          <div class="app-modal__header">
            <div v-if="data.icon" class="pl-4 flex items-center">
              <i :class="data.icon"/>
            </div>
            <div class="grow px-4 py-1" v-html="data.title" @mousedown="onMousedown"/>
            <Button type="button" class="btn-red items-center" @click="close">
              <i class="fa fa-close"/>
            </Button>
          </div>
          <div class="app-modal__main">
            <global-component v-if="data.componentLoaded"
                       v-bind="data.componentProps"
                       :currentRoute="data.currentRoute"
                       @action="_action"/>
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
