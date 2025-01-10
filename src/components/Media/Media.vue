<script setup>
defineOptions({
  name: 'Media',
  __isStatic: true
})

const props = defineProps({
  data: Object,
  modelValue: [String, Object]
})
</script>

<template>
  <div class="border">
    <img v-if="~props.data['type'].indexOf('image/')" :src="props.data['url']" alt=""
         class="w-auto h-auto max-w-full max-h-full">
  </div>
</template>
