<script>
export default {
  name: 'Main',
  __isStatic: true,
  props: ['data', 'meta', 'layout', 'errors', 'loaderDelay', 'class', 'url'],
  methods: {
    action () {
      this.$emit('action', ...arguments)
    }
  }
}
</script>

<template>
  <div class="app-main flex flex-col overflow-hidden">

    <div v-if="$slots['actions']" class="grow-0">
      <slot name="actions"/>
    </div>

    <div v-if="$slots['title']" class="grow-0">
      <slot name="title"/>
    </div>

    <div v-if="$slots['tabs']" class="grow flex overflow-hidden">
      <slot name="tabs"/>
    </div>

    <div v-if="$slots['breadcrumbs']" class="grow-0 border-t dark:border-t-gray-900">
      <slot name="breadcrumbs"/>
    </div>

  </div>
</template>
