<script setup>
import { defineOptions, defineProps, ref } from 'vue'
import store from '../../store'
import router from '../../router'

import('./TabsNavigation.css')

defineOptions({
  __isStatic: true,
  name: 'TabsNavigation'
})

const props = defineProps({
  id: {
    type: String,
    default: 'v-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
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

const emit = defineEmits(['action', 'update:props'])

const refRows = ref()

const keyStorage = `tabs_` + props.id.toLowerCase()

store.dispatch('set', { [keyStorage]: store.getters.get(`Session.${keyStorage}`, 0) })

const index = store.getters.get(keyStorage, 0)

let positionX = 0
let scrollLeft = 0
let dragging = ref(false)

const drag = event => {
  if (event.button !== 0) {
    return
  }

  dragging.value = false
  positionX = event.clientX
  scrollLeft = refRows.value.scrollLeft
  refRows.value.addEventListener('mousemove', move)
  document.addEventListener('mouseup', end)
}

const move = event => {
  const l = positionX - event.clientX
  if (Math.abs(l)) {
    dragging.value = true
    refRows.value.scrollLeft = scrollLeft + l
  }
}

const end = (event) => {
  refRows.value.removeEventListener('mousemove', move)
  document.removeEventListener('mouseup', end)
  setTimeout(() => dragging.value = false, 10)
  event.preventDefault()
  event.stopPropagation()
}

const init = () => {
  let right = 0,
      width = 0

  refRows.value.querySelectorAll('.app-tabs__tab').forEach((t, i) => {
    t.styles = getComputedStyle(t)

    if (i <= index) {
      width += t.offsetWidth + parseFloat(t.styles.marginLeft) + parseFloat(t.styles.marginRight)

      if (i < index) {
        right += t.offsetWidth + parseFloat(t.styles.marginLeft)
      }
    }
  })

  if (refRows.value.scrollLeft > right) {
    refRows.value.scrollLeft = right
  }

  if (refRows.value.offsetWidth < width) {
    refRows.value.scrollLeft = width - refRows.value.offsetWidth
  }
}

const select = (tab, key) => {
  if (dragging.value) {
    return
  }

  props.data.forEach((i, k) => i.active = i.render = k === key)

  store.dispatch('set', { [`Session.${keyStorage}`]: key })
  store.dispatch('set', { [keyStorage]: key })

  if (props.history) {
    if (typeof props.history === 'string') {
      emit('action', 'pushRouter', {
        params: {
          [props.history]: tab.id
        },
        meta: {
          group: true
        }
      })
    } else {
      emit('action', 'pushRouter', {
        ...router.parse(tab.route),
        meta: {
          group: true
        }
      })
    }
  }

  init()
}
</script>

<template>
  <div v-if="data.length > 1" class="app-tabs__rows">
    <div class="app-tabs__row" ref="refRows" @mousedown="drag">
      <button v-for="(i, k) in data"
              :class="['app-tabs__tab', k === store.getters.get(keyStorage, 0) ? 'app-tabs__tab-active' : '']"
              :data-tooltip="i.title"
              @click="select(i, k)">
        <i v-if="i.icon" :class="['app-tabs__tab-icon', i.icon]"/>
        <span v-if="i.name">{{ i.name }}</span>
      </button>
    </div>
  </div>
</template>
