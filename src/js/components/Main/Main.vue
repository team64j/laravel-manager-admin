<script>
import('./Main.css')

export default {
  name: 'Main',
  __isStatic: true,
  props: ['data', 'meta', 'layout', 'errors', 'loaderDelay', 'class', 'url'],
  emits: ['action'],
  methods: {
    action () {
      this.$emit('action', ...arguments)
    },
    onMousedownResizer (event) {
      this.$refs.resizer.addEventListener('mousemove', this.onMousemoveResizer)
      this.$refs.resizer.addEventListener('mouseup', this.onMouseupResizer)
      this.$refs.resizer.x = event.clientX - this.$refs.resizer.parentElement.offsetWidth
    },
    onMousemoveResizer (event) {
      let w = Math.max(Math.min(event.clientX - this.$refs.resizer.x, this.$el.offsetWidth / 2), 50)
      this.$refs.resizer.parentElement.style.width = w + 'px'
    },
    onMouseupResizer () {
      this.$refs.resizer.removeEventListener('mousemove', this.onMousemoveResizer)
      this.$refs.resizer.removeEventListener('mouseup', this.onMouseupResizer)
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

    <div class="flex grow overflow-auto">
      <div v-if="$slots['sidebar']" class="app-main__sidebar">
        <div class="app-main__resizer" ref="resizer" @mousedown="onMousedownResizer"/>
        <slot name="sidebar"/>
      </div>

      <div v-if="$slots['main']" class="app-main__main">
        <slot name="main"/>
      </div>
    </div>

    <div v-if="$slots['crumbs']" class="app-main__crumbs">
      <slot name="crumbs"/>
    </div>

  </div>
</template>
