<script setup>
defineOptions({
  name: 'Template',
  __isStatic: true
})

const props = defineProps(['modelValue', 'class'])
</script>
<template>
  <slot name="default"/>
</template>
