<script setup>
defineOptions({
  name: 'Alert',
  __isStatic: true,
  render () {}
})

const props = defineProps(['type'])
</script>

<template>
  <div :class="`app-alert__${props.type}`" class="p-4 mt-4 mx-4 rounded">
    <slot name="default"/>
  </div>
</template>
