<script>
import { defineComponent } from 'vue'

export default defineComponent({
  __isStatic: true,
  name: 'Media',

  props: {
    data: Object
  }
})
</script>

<template>
  <div>
    <div v-if="~data['type'].indexOf('image/')" class="p-4 border">
      <img :src="data['url']" alt="" class="w-auto h-auto max-w-full max-h-full">
    </div>
  </div>
</template>

<style scoped>

</style>
