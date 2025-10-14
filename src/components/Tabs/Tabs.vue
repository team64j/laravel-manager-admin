<script setup>
import { computed, getCurrentInstance } from 'vue'
import { uniqId } from '@/utils'
import { action } from '@/composables'
import store from '@/store'
import TabsNavigation from './TabsNavigation.vue'

defineOptions({
  __isStatic: true,
  name: 'Tabs'
})

const currentInstance = getCurrentInstance()

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
  navigation: {
    type: Boolean,
    default: true
  },
  smallTabs: Boolean,
  hiddenTabs: Boolean,
  currentRoute: Object
})

const slots = defineSlots()

const emit = defineEmits(['action', 'update:props'])

const keyStorage = `tabs_${props.id.toLowerCase()}`

const index = computed(() => store.getters.get(keyStorage, 0))

function _action () {
  return action.call(currentInstance, ...arguments)
}
</script>

<template>
  <div :id="id + 'Tabs'" :class="{
        'app-tabs__with-navigation': navigation,
        'app-tabs__without-rows': data.length === 1,
        'app-tabs__small': smallTabs,
        'app-tabs__vertical': vertical
      }"
       class="app-tabs flex flex-col grow content-start overflow-hidden">
    <TabsNavigation v-if="navigation" v-bind="props" @action="_action"/>

    <template v-for="(i, k) in data">
      <div v-if="history || (i['needUpdate'] && k === index) || !i['needUpdate']"
           v-show="k === index"
           :id="id + `Tab-` + i.id"
           :class="i.class"
           class="app-tabs__page relative h-full p-5 flex flex-wrap items-start content-start rounded overflow-auto grow bg-white dark:bg-gray-700">
        <slot v-if="slots[i.id]" :name="i.id"/>
        <div v-else class="grow flex items-center justify-center w-full h-full">
          <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
        </div>
      </div>
    </template>
  </div>
</template>

<style>
.app-page__default > .app-tabs {
  @apply px-4 pb-4
}
.app-sidebar > .app-tabs > .app-tabs__page {
  @apply rounded-none p-0
}
.app-tabs__vertical {
  @apply !flex-row h-auto self-stretch
}
.app-tabs__vertical > .app-tabs-navigation ~ .app-tabs__page {
  @apply flex-col h-full ml-5 flex-nowrap !rounded-none
}
.app-tabs > .app-tabs__page > .app-tabs {
  @apply p-5
}
</style>
