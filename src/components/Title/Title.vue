<script setup>
import { computed, shallowRef } from 'vue'
import router from '@/router'
import Alert from '@/components/Alert/Alert.vue'

defineOptions({
  name: 'Title',
  __isStatic: true
})

const props = defineProps({
  id: [String, Number],
  modelValue: String,
  title: String,
  icon: String,
  help: String
})

const show = shallowRef(false)

const route = router.currentRoute.value
const id = props.id || route.params['id'] && parseInt(route.params['id'].toString()) || undefined
const icon = props.icon || route.meta['icon']

const title = computed(() => props.modelValue ?? props.title ?? route?.['meta']?.['title'])
</script>

<template>
  <div class="app-title w-full p-4">
    <h1 class="h4 m-0 whitespace-nowrap flex items-center">
      <i v-if="icon" :class="icon" class="mr-2 mt-1 w-6 text-center text-gray-600 dark:text-gray-200 shrink-0"/>
      <span class="text-2xl h-8 font-bold truncate">{{ title }}</span>
      <span v-if="id" class="ml-2">({{ id }})</span>
      <i v-if="help" class="far fa-question-circle ml-2 cursor-pointer text-gray-300 hover:opacity-80"
         @click="() => show = !show"/>
    </h1>
    <transition v-if="help" mode="in-out">
      <Alert v-if="show" type="info" v-html="help" class="mt-3"/>
    </transition>
  </div>
</template>
