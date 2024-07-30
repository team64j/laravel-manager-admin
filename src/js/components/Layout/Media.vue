<script>
import { defineComponent } from 'vue'

export default defineComponent({
  __isStatic: true,
  name: 'Media',

  props: {
    data: Object,
    modelValue: [String, Object]
  }
})
</script>

<template>
  <div class="border">
    <img v-if="~data['type'].indexOf('image/')" :src="data['url']" alt="" class="w-auto h-auto max-w-full max-h-full">
  </div>
</template>

<style scoped>

</style>
