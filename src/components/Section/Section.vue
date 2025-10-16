<script setup>
import { reactive } from 'vue'

defineOptions({
  name: 'Section',
  __isStatic: true
})

const props = defineProps({
  label: String,
  icon: String,
  expanded: {
    type: Boolean,
    default: null
  }
})

const data = reactive({
  propExpanded: props.expanded ?? null
})

function click () {
  if (data.propExpanded !== null) {
    data.propExpanded = !data.propExpanded
  }
}
</script>

<template>
  <div class="app-section flex flex-row flex-wrap grow-0 m-4 w-full rounded content-baseline overflow-hidden">
    <div v-if="label" class="app-section__header relative flex flex-wrap items-center w-full px-3 py-2 transition"
         :class="{ 'cursor-pointer hover:text-blue-500 bg-gray-50 dark:bg-gray-600 py-2 px-4 rounded': data.propExpanded !== null}"
         @click="click">
      <div class="grow">
        <i v-if="icon" :class="icon" class="mr-2"/>
        <strong>{{ label }}</strong>
      </div>
      <div v-if="data.propExpanded !== null" class="grow-0">
        <i class="fa fa-angle-down transition" :class="{ 'rotate-180' : !data.propExpanded }"/>
      </div>
    </div>
    <div v-show="data.propExpanded ?? true" class="app-section__content flex flex-wrap w-full">
      <div class="w-full" :class="{ 'border-t': !data.propExpanded }"/>
      <slot name="default"/>
    </div>
  </div>
</template>

<style>
.app-tabs__page .app-section {
  @apply m-0
}
.app-section + .app-section {
  @apply mt-4
}
.app-section__content > p {
  @apply w-full p-3
}
.app-section__content > p + p {
  @apply pt-0
}
</style>
