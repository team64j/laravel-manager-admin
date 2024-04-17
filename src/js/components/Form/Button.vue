<script>
import Field from './Field.vue'
import LoaderIcon from '../Layout/LoaderIcon.vue'

export default {
  components: { LoaderIcon },
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
      <LoaderIcon/>
    </span>
  </button>
</template>

<style scoped>

</style>
