<template>
  <div class="app-template" :class="$props.class">
    <slot name="default"/>
  </div>
</template>

<script>
export default {
  __isStatic: true,
  name: 'LayoutTemplate',

  props: {
    class: [Array, Object, String]
  }
}
</script>
