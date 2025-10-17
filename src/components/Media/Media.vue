<script setup>
defineOptions({
  name: 'Media',
  __isStatic: true
})

const props = defineProps({
  label: String,
  data: Array, Object,
  help: String
})
</script>

<template>
  <div class="border">
    <div v-if="label" class="block font-bold mb-1">
      {{ label }}
      <i v-if="help" class="ml-2 font-normal" :data-tooltip="help"/>
    </div>
    <img v-if="~data['type'].indexOf('image/')" :src="data['url']" alt=""
         class="w-auto h-auto max-w-full max-h-full">
  </div>
</template>
