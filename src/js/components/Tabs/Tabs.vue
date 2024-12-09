<script setup>
import TabsNavigation from './TabsNavigation.vue'

import('./Tabs.css')
import { computed, defineOptions, defineProps, ref, watch } from 'vue'
import store from '../../store'
import router from '../../router'

defineOptions({
  __isStatic: true,
  name: 'Tabs'
})

const props = defineProps({
  id: {
    type: String,
    default () {
      return 'v-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
    }
  },
  data: {
    type: [null, Array],
    default: []
  },
  uid: String,
  history: [Boolean, String],
  loadOnce: Boolean,
  watch: Boolean,
  vertical: {
    type: Boolean,
    default: false
  },
  navigation: {
    type: Boolean,
    default: true
  },
  smallTabs: Boolean,
  currentRoute: Object
})
const slots = defineSlots()
const emit = defineEmits(['action', 'update:props'])

const refRows = ref()

const keyStorage = `tabs_` + props.id.toLowerCase()
const index = ref(props.data.findIndex(i => i.id === store.getters.get(`Session.${keyStorage}`, null)))

let positionX = 0
let scrollLeft = 0
let dragging = ref(false)

const classes = computed(() => [
  props.vertical ? 'app-tabs__vertical' : '',
  props.smallTabs ? 'app-tabs-small' : 'app-tabs-large',
  props.navigation ? 'app-tabs__with-navigation' : '',
  props.data.length === 1 ? 'app-tabs__without-rows' : '',
  dragging.value ? 'app-tabs__dragging' : ''
])

if (props.history) {
  if (typeof props.history === 'string') {
    index.value = props.data.findIndex(i => i.id === props.currentRoute.params[props.history])
    props.data.forEach(i => i.active = i.render = i.id === index.value)

    watch(
        () => props.currentRoute.params[props.history],
        a => {
          if (!a) {
            return
          }

          const key = props.data.findIndex(i => i.id === a)

          if (key >= 0 && index.value !== key) {
            index.value = key
          }
        }
    )
  } else {
    index.value = props.data.findIndex(i => router.parse(i?.route)['path'] === props.currentRoute.path)

    watch(
        () => props.currentRoute.path,
        a => index.value = props.data.findIndex(i => router.parse(i?.route)['path'] === a)
    )
  }
} else if (!props.data.some((i, k) => k === index.value) && props.data[0]) {
  index.value = 0
  props.data[0].active = props.data[0].render = true
} else {
  props.data.forEach((i, k) => i.active = i.render = k === index.value)
}

// const init = () => {
//   let right = 0,
//       width = 0
//
//   refRows.value.querySelectorAll('.app-tabs__tab').forEach((t, i) => {
//     t.styles = getComputedStyle(t)
//
//     if (i <= index.value) {
//       width += t.offsetWidth + parseFloat(t.styles.marginLeft) + parseFloat(t.styles.marginRight)
//
//       if (i < index.value) {
//         right += t.offsetWidth + parseFloat(t.styles.marginLeft)
//       }
//     }
//   })
//
//   if (refRows.value.scrollLeft > right) {
//     refRows.value.scrollLeft = right
//   }
//
//   if (refRows.value.offsetWidth < width) {
//     refRows.value.scrollLeft = width - refRows.value.offsetWidth
//   }
// }
//
// const select = (tab, key) => {
//   if (dragging.value) {
//     return
//   }
//
//   props.data.forEach((i, k) => i.active = i.render = k === key)
//
//   index.value = key
//
//   store.dispatch('set', { [`Session.${keyStorage}`]: tab.id })
//
//   if (props.history) {
//     if (typeof props.history === 'string') {
//       emit('action', 'pushRouter', {
//         params: {
//           [props.history]: tab.id
//         },
//         meta: {
//           group: true
//         }
//       })
//     } else {
//       emit('action', 'pushRouter', {
//         ...router.parse(tab.route),
//         meta: {
//           group: true
//         }
//       })
//     }
//   }
//
//   init()
// }
//
// const drag = event => {
//   if (event.button !== 0) {
//     return
//   }
//
//   dragging.value = false
//   positionX = event.clientX
//   scrollLeft = refRows.value.scrollLeft
//   refRows.value.addEventListener('mousemove', move)
//   document.addEventListener('mouseup', end)
// }
//
// const move = event => {
//   const l = positionX - event.clientX
//   if (Math.abs(l)) {
//     dragging.value = true
//     refRows.value.scrollLeft = scrollLeft + l
//   }
// }
//
// const end = (event) => {
//   refRows.value.removeEventListener('mousemove', move)
//   document.removeEventListener('mouseup', end)
//   setTimeout(() => dragging.value = false, 10)
//   event.preventDefault()
//   event.stopPropagation()
// }
</script>

<template>
  <div :id="id + 'Tabs'" :class="['app-tabs', classes]">
    <TabsNavigation v-if="navigation" :data="data"/>

<!--    <div v-if="data.length > 1" class="app-tabs__rows">-->
<!--      <div class="app-tabs__row" ref="refRows" @mousedown="drag">-->
<!--        <button v-for="(i, k) in data"-->
<!--                :class="['app-tabs__tab', k === index ? 'app-tabs__tab-active' : '']"-->
<!--                :data-tooltip="i.title"-->
<!--                @click="select(i, k)">-->
<!--          <i v-if="i.icon" :class="['app-tabs__tab-icon', i.icon]"/>-->
<!--          <span v-if="i.name">{{ i.name }}</span>-->
<!--        </button>-->
<!--      </div>-->
<!--    </div>-->

    <template v-for="(i, k) in data">
      <div v-if="history || (i['needUpdate'] && k === index) || !i['needUpdate']"
           v-show="k === index"
           :id="id + `Tab-` + i.id"
           :class="['app-tabs__page', i.class]">
        <slot v-if="slots[i.id]" :name="i.id"/>
        <div v-else class="grow flex items-center justify-center w-full h-full">
          <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
        </div>
      </div>
    </template>
  </div>
</template>
