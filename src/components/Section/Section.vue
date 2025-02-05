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
  <div class="app-section flex flex-row flex-wrap grow-0 w-full p-4 rounded content-baseline">
    <div v-if="label" class="app-section__header relative flex flex-wrap items-center w-full transition"
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
      <div class="mt-2 pb-2 w-full" :class="{ 'border-t': !data.propExpanded }"/>
      <slot name="default"/>
    </div>
  </div>
</template>

<style>
.app-section + .app-section {
  @apply pt-0
}
</style>
