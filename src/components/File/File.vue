<script setup>
import { computed, getCurrentInstance } from 'vue'
import { props } from '@/composables'

const currentInstance = getCurrentInstance()

defineOptions({
  name: 'File',
  __isStatic: true
})

const $props = defineProps({
  ...props,
  type: {
    type: String,
    default: 'file',
    validator: (type) => ['file', 'image'].includes(type)
  }
})

const $emit = defineEmits(['action', 'update:modelValue'])

const model = computed({
  get () {
    return $props.modelValue
  },
  set (value) {
    $emit('update:modelValue', value, currentInstance)
  }
})

function onClick (event) {
  if ($props.emitClick) {
    return $emit('action', $props.emitClick, event, currentInstance)
  }
}

defineExpose({
  model
})
</script>

<template>
  <div v-if="$props.label" class="w-full" :class="$props.class">
    <div class="mb-1">
      <label :for="$props.id" class="font-bold cursor-pointer">
        {{ $props.label }}
        <span v-if="$props.required" class="text-rose-500">*</span>
        <i v-if="$props.help" class="ml-2 font-normal" :data-tooltip="$props.help"/>
      </label>
      <span v-if="$props.requiredText" class="text-rose-500 ml-3 text-sm font-normal">
        {{ $props.requiredText }}
      </span>
      <slot name="label"/>
    </div>
    <div class="flex relative">
      <input v-model="model"
             :id="$props.id"
             :class="$props.inputClass"
             :readonly="$props.readonly"
             type="text"
             class="pr-8">
      <i class="far absolute top-0 right-0 py-2.5 px-3 cursor-pointer text-gray-400 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-600"
         :class="[ $props.type === 'image' ? 'fa-file-image' : 'fa-file' ]"
         @click="onClick"/>
    </div>
    <div v-if="$props.description" v-html="$props.description" class="opacity-75 text-sm"/>
    <div v-if="$props.error" class="absolute text-xs text-rose-600" :class="$props.errorClass">
      {{ $props.error.toString() }}
    </div>
    <slot name="item"/>
  </div>
  <div v-else>
    <div class="flex relative">
      <input v-model="model"
             :id="$props.id"
             :class="$props.inputClass"
             :readonly="$props.readonly"
             type="text"
             class="pr-8">
      <i class="far absolute top-0 right-0 py-2.5 px-3 cursor-pointer text-gray-400 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-600"
         :class="[ $props.type === 'image' ? 'fa-file-image' : 'fa-file' ]"
         @click="onClick"/>
    </div>
    <div v-if="$props.description" v-html="$props.description" class="opacity-75 text-sm"/>
    <div v-if="$props.error" class="absolute text-xs text-rose-600" :class="$props.errorClass">
      {{ $props.error.toString() }}
    </div>
  </div>
</template>
