<script setup>
import { props as _props } from '@/composables'

defineOptions({
  name: 'Button',
  __isStatic: true
})

const props = defineProps({
  ..._props,
  type: {
    default: 'button'
  }
})
</script>

<template>
  <button :id="id" :type="type" :class="[props.class, props.inputClass]" :disabled="disabled" class="relative overflow-hidden">
    <span v-if="loading" @click.stop.prevent=""
          class="absolute left-0 top-0 !flex items-center justify-center h-full w-full bg-inherit">
      <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
    </span>

    <slot name="icon"/>

    <i v-if="icon" :class="icon" class="fa fa-fw"/>

    <span v-if="value" v-html="value" class="truncate block"/>

    <slot name="default"/>
  </button>
</template>
