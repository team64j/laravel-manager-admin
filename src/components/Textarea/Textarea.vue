<script setup>
import { computed, getCurrentInstance } from 'vue'
import { props as _props } from '@/composables'

const currentInstance = getCurrentInstance()

defineOptions({
  name: 'Textarea',
  __isStatic: true
})

const props = defineProps({
  ..._props,
  modelValue: {
    type: [null, Object, String, Number, Boolean],
    default: ''
  },
  rows: {
    type: Number,
    default: 2
  },
  resize: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['action', 'update:modelValue'])

const model = computed({
  get () {
    return props.value ?? props.modelValue ?? ''
  },
  set (value) {
    emit('update:modelValue', value, currentInstance)
  }
})

const height = computed(() => {
  const fs = parseFloat(window.getComputedStyle(document.documentElement, null).getPropertyValue('font-size'))

  return ((fs * 0.375) * 2) + (props.rows * 1.5 * fs) + 2 + 'px'
})

defineExpose({
  model
})
</script>

<template>
  <div v-if="label" class="w-full flex flex-col" :class="$props.class">
    <div class="mb-1">
      <label :for="id" class="font-bold cursor-pointer">
        {{ label }}
        <span v-if="required" class="text-rose-500">*</span>
        <i v-if="help" class="ml-2 font-normal" :data-tooltip="help"/>
      </label>
      <slot name="label"/>
    </div>
    <textarea v-model="model" :id="id" :class="[resize ? 'resize-y' : 'resize-none']" class="min-h-10 grow" :rows="rows"
              :style="{ height }"/>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <div v-if="error" class="absolute text-xs text-rose-600" :class="errorClass">{{ error.toString() }}</div>
  </div>
  <template v-else>
    <textarea v-model="model" :id="id" :class="[resize ? 'resize-y' : 'resize-none']" class="min-h-10 grow" :rows="rows"
              :style="{ height }"/>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <div v-if="error" class="absolute text-xs text-rose-600" :class="errorClass">{{ error.toString() }}</div>
  </template>
</template>
