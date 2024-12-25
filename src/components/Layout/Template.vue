<script setup>
defineOptions({
  name: 'Template',
  __isStatic: true,
  render () {}
})

const $props = defineProps(['class'])
</script>

<template>
  <div :class="$props.class">
    <slot name="default"/>
  </div>
</template>
