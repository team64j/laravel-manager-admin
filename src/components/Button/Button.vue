<script setup>
import { props as _props } from '../../composables'

defineOptions({
  name: 'Button',
  __isStatic: true
})

const props = defineProps({
  ..._props,
  icon: String,
  type: {
    default: 'button'
  },
  loader: Boolean
})
</script>

<template>
  <button :type="type" :class="props.class" class="btn-sm relative">
    <slot name="icon"/>

    <i v-if="icon" :class="icon" class="fa fa-fw"/>

    <span v-if="value" v-html="value"/>

    <slot name="default"/>

    <span v-if="loader" @click.stop.prevent=""
          class="absolute !flex items-center justify-center left-0 top-0 h-full w-full bg-inherit">
      <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
    </span>
  </button>
</template>
