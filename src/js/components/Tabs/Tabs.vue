<script setup>
import TabsNavigation from './TabsNavigation.vue'
import { computed, defineOptions, defineProps } from 'vue'
import store from '../../store'

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
  hideable: Boolean,
  currentRoute: Object
})

const slots = defineSlots()

const emit = defineEmits(['action', 'update:props'])

const keyStorage = `tabs_` + props.id.toLowerCase()

const index = computed(() => store.getters.get(keyStorage, 0))

const classes = computed(() => {
  return {
    'app-tabs__with-navigation': props.navigation,
    'app-tabs__without-rows': props.data.length === 1,
    'app-tabs-small': props.smallTabs,
    '!flex-row': props.vertical
  }
})

const action = (...args) => {
  emit('action', ...args)
}
</script>

<template>
  <div :id="id + 'Tabs'" :class="classes"
       class="app-tabs flex flex-col grow content-start overflow-hidden">
    <TabsNavigation v-if="navigation" v-bind="props" @action="action"/>

    <template v-for="(i, k) in data">
      <div v-if="history || (i['needUpdate'] && k === index) || !i['needUpdate']"
           v-show="k === index"
           :id="id + `Tab-` + i.id"
           :class="i.class"
           class="app-tabs__page relative flex flex-wrap items-start content-start rounded overflow-auto grow bg-white dark:bg-gray-700">
        <slot v-if="slots[i.id]" :name="i.id"/>
        <div v-else class="grow flex items-center justify-center w-full h-full">
          <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
        </div>
      </div>
    </template>
  </div>
</template>

<style>
.app-tabs__vertical {
  @apply flex-row p-0 h-auto self-stretch overflow-visible
}
.app-tabs__vertical > .app-tabs__page {
  @apply flex-col h-full !p-0 shadow-none rounded-none overflow-auto flex-nowrap
}
.app-tabs.app-tabs-small .app-tabs__page {
  @apply m-0 p-0 bg-inherit
}
.app-tabs.app-tabs-small.app-tabs__vertical .app-tabs__rows ~ .app-tabs__page {
  @apply !p-0
}
</style>
