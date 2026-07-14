<script setup>
import { computed, getCurrentInstance, onMounted } from 'vue'
import { uniqId } from '@/utils'
import router from '@/router'
import Button from '@/components/Button/Button.vue'
import session from '@/services/session'

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

const index = computed(() => session.get(keyStorage, 0))

onMounted(init)

function init () {
  let right = 0,
      width = 0

  const el = currentInstance.vnode.el

  if (el.nodeType !== 1) {
    return
  }

  el.styles = getComputedStyle(el)

  el.querySelectorAll('button').forEach((t, i) => {
    t.styles = getComputedStyle(t)

    if (i <= index.value) {
      width += t.offsetWidth + parseFloat(t.styles.marginLeft) + parseFloat(t.styles.marginRight)

      if (i < index.value) {
        right += t.offsetWidth + parseFloat(t.styles.marginLeft)
      }
    }
  })

  if (el.scrollLeft > right) {
    el.scrollLeft = right
  }

  if (el.offsetWidth < width) {
    el.scrollLeft = width - el.offsetWidth +
        (parseFloat(el.styles.paddingLeft) +
            parseFloat(el.styles.paddingRight))
  }
}

function select (tab, key) {
  if (props.hiddenTabs) {
    emit('action', 'collapse', key === index.value)
  }

  session.set(keyStorage, key)

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
  } else {
    init()
  }
}
</script>

<template>
  <div v-if="data.length > 1" class="app-tabs-navigation" :class="{
          'app-tabs-navigation__vertical': props.vertical,
          'app-tabs-navigation__small': props.smallTabs
       }">
    <Button v-for="(i, k) in data"
            :class="{ 'app-tabs-navigation__active': k === index }"
            :data-tooltip="i.title"
            @click="select(i, k)">
      <i v-if="i.icon" :class="['app-tabs__tab-icon', i.icon, i.name ? 'mr-3' : '']"/>
      <span v-if="i.name">{{ i.name }}</span>
    </Button>
  </div>
</template>

<style scoped>
.app-tabs-navigation {
  @apply flex flex-nowrap grow-0 shrink-0 overflow-hidden overflow-x-auto mb-1 -mx-0.5
}
.app-tabs-navigation button {
  @apply flex items-center justify-center m-0.5 h-10 relative shrink-0 cursor-pointer whitespace-nowrap rounded select-none border-0 ring-0 text-center font-medium bg-transparent hover:bg-gray-50/50 dark:hover:bg-gray-600/40 dark:hover:text-white transition
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
