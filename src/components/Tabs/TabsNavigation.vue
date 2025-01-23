<script setup>
import { computed, getCurrentInstance, watch } from 'vue'
import store from '../../store'
import router from '../../router'
import { uniqId } from '../../utils'

defineOptions({
  __isStatic: true,
  name: 'TabsNavigation'
})

const currentInstance = getCurrentInstance()

const props = defineProps({
  id: {
    type: String,
    default: uniqId()
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
  hiddenTabs: Boolean,
  currentRoute: Object
})

const emit = defineEmits(['action', 'update:props'])
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

function init () {
  let right = 0,
      width = 0

  currentInstance.proxy.$el.styles = getComputedStyle(currentInstance.proxy.$el)

  currentInstance.proxy.$el.querySelectorAll('button').forEach((t, i) => {
    t.styles = getComputedStyle(t)

    if (i <= index.value) {
      width += t.offsetWidth + parseFloat(t.styles.marginLeft) + parseFloat(t.styles.marginRight)

      if (i < index.value) {
        right += t.offsetWidth + parseFloat(t.styles.marginLeft)
      }
    }
  })

  if (currentInstance.proxy.$el.scrollLeft > right) {
    currentInstance.proxy.$el.scrollLeft = right
  }

  if (currentInstance.proxy.$el.offsetWidth < width) {
    currentInstance.proxy.$el.scrollLeft = width - currentInstance.proxy.$el.offsetWidth +
        (parseFloat(currentInstance.proxy.$el.styles.paddingLeft) + parseFloat(currentInstance.proxy.$el.styles.paddingRight))
  }
}

function select (tab, key) {
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

  store.dispatch('set', { [`Session.${keyStorage}`]: key })
  store.dispatch('set', { [keyStorage]: key })

  // :TODO Сделать более универсальное решение для отправки события родительскому компоненту
  if (props.hiddenTabs) {
    const active = !tab.active
    props.data.forEach(i => i.active = false)
    tab.active = active
    emit('action', 'collapse', !tab.active)
  } else {
    props.data.forEach((i, k) => i.active = i.render = k === key)
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
    index.value = props.data.findIndex(i => router.parse(i?.route)?.['path'] === props.currentRoute.path)

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
</script>

<template>
  <div v-if="data.length > 1" class="app-tabs-navigation" :class="{
          'app-tabs-navigation__vertical': props.vertical,
          'app-tabs-navigation__small': props.smallTabs
       }">
    <button v-for="(i, k) in data"
            :class="{ 'app-tabs-navigation__active': k === index }"
            :data-tooltip="i.title"
            @click="select(i, k)">
      <i v-if="i.icon" :class="['app-tabs__tab-icon', i.icon, i.name ? 'mr-3' : '']"/>
      <span v-if="i.name">{{ i.name }}</span>
    </button>
  </div>
</template>

<style scoped>
.app-tabs-navigation {
  @apply flex flex-nowrap grow-0 shrink-0 overflow-hidden overflow-x-auto mb-1 -mx-0.5
}
.app-tabs-navigation button {
  @apply flex items-center justify-center m-0.5 h-10 relative shrink-0 cursor-pointer whitespace-nowrap rounded select-none border-0 ring-0 text-center font-medium bg-transparent hover:bg-slate-200/50 dark:hover:bg-gray-600/40 dark:hover:text-white transition
}
.app-tabs-navigation.app-tabs-navigation__small button {
  @apply p-3
}
.app-tabs-navigation button.app-tabs-navigation__active {
  @apply text-white bg-blue-600 dark:text-white dark:bg-blue-600
}
.app-tabs-navigation.app-tabs-navigation__vertical, .app-position-vertical .app-tabs-navigation {
  @apply flex-col overflow-x-hidden overflow-y-auto m-0 p-0
}
</style>
