<script setup>
import { computed, getCurrentInstance, reactive } from 'vue'
import { props as _props } from '../../composables'

const currentInstance = getCurrentInstance()

defineOptions({
  name: 'Datetime',
  __isStatic: true,
})

const props = defineProps({
  ..._props,
  data: {
    type: Object,
    default: {}
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

const data = reactive({
  loading: false
})

function onClear () {
  model.value = ''
}

function onShow () {
  emit('action', 'datepicker:show', currentInstance)
}

defineExpose({
  model,
  ...data,
})
</script>

<template>
  <div v-if="label" class="w-full" :class="props.class">
    <div class="mb-1">
      <label :for="id" class="font-bold cursor-pointer">
        {{ label }}
        <span v-if="required" class="text-rose-500">*</span>
        <i v-if="error" :data-tooltip="error.toString()" data-type="error" class="ml-2 font-normal"/>
        <i v-else-if="help" :data-tooltip="help" class="ml-2 font-normal"/>
      </label>
      <span v-if="requiredText" class="text-rose-500 ml-3 text-sm font-normal">{{ requiredText }}</span>
      <slot name="label"/>
    </div>
    <div class="relative">
      <div v-if="data.loading" class="absolute left-0 top-1 my-1 mx-2 flex items-center justify-center">
        <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
      </div>
      <input v-model="model"
             :id="id"
             type="text"
             ref="input"
             :placeholder="placeholder"
             :class="[inputClass, error ? '!border-rose-500 focus:ring-rose-500' : '', data.loading ? '!text-transparent' : '']"
             :readonly="readonly"
             :required="required"
             :disabled="disabled"
             @focus.stop.prevent="onShow"
             @blur="onClose">
      <i v-if="clear"
         class="fa fa-calendar-xmark absolute block right-0 top-0 m-2.5 cursor-pointer text-gray-300 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-600 transition"
         @click="onClear"/>
    </div>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <slot name="item"/>
  </div>
  <div v-else class="relative" :class="props.class">
    <div v-if="data.loading" class="absolute left-0 top-1 my-1 mx-2 flex items-center justify-center">
      <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
    </div>
    <input v-model="model"
           :id="id"
           type="text"
           ref="input"
           :placeholder="placeholder"
           :class="[inputClass, error ? '!border-rose-500' : '', data.loading ? '!text-transparent' : '']"
           :readonly="readonly"
           :required="required"
           :disabled="disabled"
           @focus="onShow"
           @blur="onClose">
    <i v-if="clear"
       class="fa fa-calendar-xmark absolute block right-0 top-0 m-2.5 cursor-pointer text-gray-300 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-600 transition"
       @click="onClear"/>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
  </div>
</template>
