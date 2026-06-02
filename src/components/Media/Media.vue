<script setup>
defineOptions({
  name: 'Media',
  __isStatic: true
})

const $props = defineProps({
  label: String,
  data: [Array, Object],
  help: String
})
</script>

<template>
  <div class="app-media">
    <div v-if="$props.label" class="block font-bold mb-1">
      {{ $props.label }}
      <i v-if="$props.help" class="ml-2 font-normal" :data-tooltip="$props.help"/>
    </div>
    <img v-if="~$props.data['type'].indexOf('image/')" :src="$props.data['url']" alt=""
         class="w-auto h-auto max-w-full max-h-full">
  </div>
</template>
