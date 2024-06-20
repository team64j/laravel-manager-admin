<script>
import('./Main.css')

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
  <div class="app-main">

    <div v-if="$slots['actions']" class="app-main__actions">
      <slot name="actions"/>
    </div>

    <div v-if="$slots['title']" class="app-main__title">
      <slot name="title"/>
    </div>

    <div v-if="$slots['tabs']" class="app-main__tabs">
      <slot name="tabs"/>
    </div>

    <div v-if="$slots['breadcrumbs']" class="app-main__breadcrumbs">
      <slot name="breadcrumbs"/>
    </div>

  </div>
</template>
