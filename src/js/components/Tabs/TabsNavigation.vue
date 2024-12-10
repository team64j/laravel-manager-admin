<script setup>
import { computed, defineOptions, defineProps, nextTick, ref, watch } from 'vue'
import store from '../../store'
import router from '../../router'

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
  hideable: Boolean,
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

    if (i <= index.value) {
      width += t.offsetWidth + parseFloat(t.styles.marginLeft) + parseFloat(t.styles.marginRight)

      if (i < index.value) {
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

  if (props.hideable) {
    emit('action', 'collapse', tab.active)
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

<style>
.app-tabs__rows {
  @apply overflow-hidden relative h-11 w-full grow-0 shrink-0
}
.app-main .app-tabs__rows, .app-page__default .app-tabs__rows {
  @apply px-2
}
.app-tabs__row {
  @apply relative overflow-hidden overflow-x-auto h-20 px-0 -mx-0.5 flex flex-nowrap
}
.app-tabs__rows.app-tabs__rows__vertical {
  @apply grow-0 h-auto w-auto mb-0 px-0 overflow-visible
}
.app-tabs__rows.app-tabs__rows__vertical::after {
  @apply left-auto top-0
}
.app-tabs__rows.app-tabs__rows__vertical .app-tabs__row {
  @apply sticky top-0 flex-col h-auto py-0 m-0
}
.app-tabs__vertical.app-tabs__with-navigation > .app-tabs__rows .app-tabs__row {
  @apply mx-0
}
.app-tabs__rows .app-tabs__tab {
  @apply flex items-center justify-center mx-0.5 px-4 h-10 relative shrink-0 cursor-pointer whitespace-nowrap rounded select-none border-0 ring-0 text-center font-medium bg-transparent hover:bg-slate-200/50 dark:hover:bg-gray-600/40 dark:hover:text-white transition
}
.app-tabs__rows.app-tabs__dragging * {
  @apply cursor-w-resize
}
.app-tabs__rows.app-tabs__dragging .app-tabs__tab {
  @apply pointer-events-none
}
.app-tabs__rows .app-tabs__tab.app-tabs__tab-active {
  @apply border-inherit text-white bg-blue-600 dark:text-white dark:bg-blue-600 dark:hover:bg-blue-600
}
.app-tabs__rows .app-tabs__tab .app-tabs__tab-icon + span {
  @apply ml-2
}
.app-tabs__rows.app-tabs__rows-small .app-tabs__tab {
  @apply my-[2px] mx-[2px] h-8 w-10
}
.app-tabs__rows.app-tabs__rows-small.app-tabs__rows__vertical .app-tabs__tab {
  @apply h-10
}
.app-tabs__rows.app-tabs__rows-small .app-tabs__tab:not(.app-tabs__tab-active):hover {
  @apply hover:bg-gray-100/50 dark:hover:bg-gray-600/40
}
.app-tabs__rows .app-tabs__prev, .app-tabs__rows .app-tabs__next {
  @apply absolute h-10 w-5 top-0 pt-1 flex items-center justify-center cursor-pointer select-none hover:text-blue-500
}
.app-tabs__rows .app-tabs__prev {
  @apply left-0
}
.app-tabs__rows .app-tabs__next {
  @apply right-0
}
.app-tabs__rows .app-tabs__prev.app-tabs__disabled, .app-tabs__rows .app-tabs__next.app-tabs__disabled {
  @apply opacity-20 pointer-events-none
}
.app-tabs__rows.app-tabs__rows__vertical .app-tabs__prev::before, .app-tabs__rows.app-tabs__rows__vertical .app-tabs__next::before {
  @apply rotate-90
}
.app-tabs__rows.app-tabs__rows__vertical .app-tabs__prev {
  @apply h-auto w-full py-1
}
.app-tabs__rows.app-tabs__rows__vertical .app-tabs__next {
  @apply h-auto w-full py-1 top-auto bottom-0
}
.app-tabs__rows.app-tabs__rows__vertical ~ .app-tabs__page {
  @apply !pl-5 pr-0 bg-transparent
}
.app-tabs__vertical .app-tabs__prev, .app-tabs__vertical .app-tabs__next {
  @apply hidden
}
.app-tabs__rows.app-tabs__rows-small {
  @apply p-0 px-0.5 h-[2.4rem] bg-slate-100 dark:bg-gray-800
}
.app-tabs__rows.app-tabs__rows-small .app-tabs__row {
  @apply mx-0
}
</style>
