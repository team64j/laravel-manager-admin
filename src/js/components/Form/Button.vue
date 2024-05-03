<script>
import Field from './Field.vue'

export default {
  __isStatic: true,
  name: 'Button',
  extends: Field,
  props: {
    icon: String,
    type: {
      default: 'button'
    },
    loader: Boolean
  }
}
</script>

<template>
  <button :type="type" class="btn-sm relative" :class="$props.class">
    <slot name="icon"/>
    <i v-if="icon" class="fa fa-fw" :class="icon"/>
    <span v-if="value" v-html="value"/>
    <slot/>
    <span v-if="loader"
       class="absolute !flex items-center justify-center left-0 top-0 h-full w-full bg-inherit"
       @click.prevent.stop="() => false">
      <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
    </span>
  </button>
</template>

<style scoped>

</style>
