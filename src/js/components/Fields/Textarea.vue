<template>
  <div v-if="label" class="w-full mb-3" :class="$props.class">
    <div class="mb-1">
      <label :for="ID" class="font-bold cursor-pointer">
        {{ label }}
        <span v-if="required" class="text-rose-500">*</span>
        <i v-if="help" class="app-help" :data-tooltip="help"/>
      </label>
      <slot name="label"/>
    </div>
    <textarea v-model="model" :id="ID" class="resize-none" :rows="rows" :style="{ height }"/>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <div v-if="error" class="absolute text-xs text-rose-600" :class="errorClass">{{ errorMessage }}</div>
  </div>
  <template v-else>
    <textarea v-model="model" :id="ID" class="resize-none" :rows="rows" :style="{ height }"/>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <div v-if="error" class="absolute text-xs text-rose-600" :class="errorClass">{{ errorMessage }}</div>
  </template>
</template>

<script>
import Field from './Field.vue'

export default {
  __isStatic: true,
  name: 'FieldsTextarea',
  extends: Field,

  props: {
    modelValue: {
      type: [null, Object, String, Number, Boolean],
      default: ''
    },
    rows: {
      type: Number,
      default: 2
    }
  },

  computed: {
    height () {
      const fs = parseFloat(window.getComputedStyle(document.documentElement, null).getPropertyValue('font-size'))

      return ((fs * 0.375) * 2) + (this.rows * 1.5 * fs) + 2 + 'px'
    }
  }
}
</script>
