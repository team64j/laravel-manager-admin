<script setup>
import { onActivated, ref, watchPostEffect } from 'vue'
import { uniqId } from '@/utils'
import Button from '@/components/Button/Button.vue'
import { useTabs } from './use-tabs'

defineOptions({
  __isStatic: true,
  name: 'TabsNavigation'
})

const props = defineProps({
  id: {
    type: String,
    default () {
      return uniqId()
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
  smallTabs: Boolean,
  hiddenTabs: Boolean,
  currentRoute: Object
})

const emit = defineEmits(['action', 'update:props'])

const { tabs, activeId, selectTab } = useTabs(props, emit)
const navigationElement = ref()

watchPostEffect(() => {
  activeId.value
  tabs.value.length
  init()
})
onActivated(init)

function init () {
  const el = navigationElement.value
  const button = el?.querySelector('.app-tabs-navigation__active')
  if (!button) return

  const viewport = el.getBoundingClientRect()
  const target = button.getBoundingClientRect()
  const left = viewport.left + el.clientLeft
  const top = viewport.top + el.clientTop

  if (target.left < left) el.scrollLeft += target.left - left
  else if (target.right > left + el.clientWidth) el.scrollLeft += target.right - left - el.clientWidth

  if (target.top < top) el.scrollTop += target.top - top
  else if (target.bottom > top + el.clientHeight) el.scrollTop += target.bottom - top - el.clientHeight
}

function select (tab) {
  if (props.hiddenTabs) {
    emit('action', 'collapse', tab.id === activeId.value)
  }

  selectTab(tab.id)
}
</script>

<template>
  <div v-if="tabs.length > 1" ref="navigationElement" class="app-tabs-navigation" :class="{
          'app-tabs-navigation__vertical': props.vertical,
          'app-tabs-navigation__small': props.smallTabs
       }">
    <Button v-for="i in tabs"
            :key="i.id"
            :class="{ 'app-tabs-navigation__active': i.id === activeId }"
            :data-tooltip="i.title"
            @mousedown="select(i)">
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
