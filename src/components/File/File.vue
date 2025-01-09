<script setup>
import { computed, getCurrentInstance } from 'vue'
import { props as _props } from '../../composables'

const currentInstance = getCurrentInstance()

defineOptions({
  name: 'File',
  __isStatic: true
})

const props = defineProps({
  ..._props,
  type: {
    type: String,
    default: 'file',
    validator: (type) => ['file', 'image'].includes(type)
  }
})

const emit = defineEmits(['action', 'update:modelValue'])

const model = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value, currentInstance)
  }
})

function onMousedown (event) {
  emit('action', 'mousedown:input', event, currentInstance)
}

function onClick (event) {
  if (props.emitClick) {
    return emit('action', props.emitClick, event, currentInstance)
  }
}

defineExpose({
  model
})
</script>

<template>
  <div v-if="label" class="w-full" :class="props.class">
    <div class="mb-1">
      <label :for="id" class="font-bold cursor-pointer">
        {{ label }}
        <span v-if="required" class="text-rose-500">*</span>
        <i v-if="help" class="ml-2 font-normal" :data-tooltip="help"/>
      </label>
      <span v-if="requiredText" class="text-rose-500 ml-3 text-sm font-normal">{{ requiredText }}</span>
      <slot name="label"/>
    </div>
    <div class="flex relative">
      <input v-model="model"
             :id="id"
             :class="inputClass"
             :readonly="readonly"
             type="text"
             class="pr-8"
             @mousedown="onMousedown">
      <i class="far absolute top-0 right-0 py-2.5 px-3 cursor-pointer text-gray-400 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-600"
         :class="[ type === 'image' ? 'fa-file-image' : 'fa-file' ]"
         @click="onClick"/>
    </div>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <div v-if="error" class="absolute text-xs text-rose-600" :class="errorClass">{{ errorMessage }}</div>
    <slot name="item"/>
  </div>
  <div v-else>
    <div class="flex relative">
      <input v-model="model"
             :id="id"
             :class="inputClass"
             :readonly="readonly"
             type="text"
             class="pr-8"
             @mousedown="onMousedown">
      <i class="far absolute top-0 right-0 py-2.5 px-3 cursor-pointer text-gray-400 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-600"
         :class="[ type === 'image' ? 'fa-file-image' : 'fa-file' ]"
         @click="onClick"/>
    </div>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <div v-if="error" class="absolute text-xs text-rose-600" :class="errorClass">{{ errorMessage }}</div>
  </div>
</template>
