<script setup>
import { computed, defineOptions, defineProps, ref, watch } from 'vue'
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
  smallTabs: Boolean,
  currentRoute: Object
})

const emit = defineEmits(['action', 'update:props'])

const refRows = ref()

const keyStorage = `tabs_` + props.id.toLowerCase()

store.dispatch('set', { [keyStorage]: store.getters.get(`Session.${keyStorage}`, 0) })

const index = computed({
  set (value) {
    store.dispatch('set', { [keyStorage]: value })
  },
  get () {
    return store.getters.get(keyStorage, 0)
  }
})

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

if (props.history) {
  if (typeof props.history === 'string') {
    store.dispatch('set', { [keyStorage]: store.getters.get(`Session.${keyStorage}`, 0) })
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

const classes = computed(() => [
  props.vertical ? 'app-tabs__rows__vertical' : '',
  props.smallTabs ? 'app-tabs__rows-small' : 'app-tabs__rows-large'
])
</script>

<template>
  <div v-if="data.length > 1" class="app-tabs__rows" :class="classes">
    <div class="app-tabs__row" ref="refRows" @mousedown="drag">
      <button v-for="(i, k) in data"
              :class="['app-tabs__tab', k === index ? 'app-tabs__tab-active' : '']"
              :data-tooltip="i.title"
              @click="select(i, k)">
        <i v-if="i.icon" :class="['app-tabs__tab-icon', i.icon]"/>
        <span v-if="i.name">{{ i.name }}</span>
      </button>
    </div>
  </div>
</template>
