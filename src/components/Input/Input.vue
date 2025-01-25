<script setup>
import { props as _props } from '../../composables'
import { computed, getCurrentInstance, reactive, ref } from 'vue'

defineOptions({
  name: 'Input',
  __isStatic: true
})

const currentInstance = getCurrentInstance()

const emit = defineEmits(['action', 'update:modelValue'])

const props = defineProps({
  ..._props,
  type: {
    type: String,
    default: 'text',
    validator: (type) => ['text', 'number', 'password', 'email', 'tel', 'date', 'datetime-local', 'button'].includes(
        type)
  }
})

const data = reactive({
  loading: false
})

const model = computed({
  get () {
    return props.value ?? props.modelValue ?? ''
  },
  set (value) {
    emit('update:modelValue', value, currentInstance)
  }
})

const input = ref()

function onMousedown (event) {
  props.emitClick && emit('action', props.emitClick, event, currentInstance)
}

function onClear (event) {
  emit('action', 'clear:input', event, currentInstance)
  emit('update:modelValue', '', currentInstance)
  input.value.focus()
}

function onClickPlus () {
  currentInstance.vnode.el.querySelector('input').focus()
  model.value++
}

function onClickMinus () {
  currentInstance.vnode.el.querySelector('input').focus()
  model.value--
}

defineExpose({
  model
})
</script>

<template>
  <div v-if="label" class="w-full" :class="$props.class">
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
    <div class="relative" :class="{ 'app-input__number': type === 'number' }">
      <div v-if="data.loading" class="absolute left-0 top-1 my-1 mx-2 flex items-center justify-center"
           :class="[type === 'button' ? 'right-0 bottom-0' : '']">
        <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
      </div>
      <input v-model="model"
             ref="input"
             :id="id"
             :type="type"
             :placeholder="placeholder"
             :class="[inputClass, error ? '!border-rose-500 focus:ring-rose-500' : '', data.loading ? '!text-transparent' : '']"
             :readonly="readonly"
             :required="required"
             :disabled="disabled"
             @mousedown="onMousedown">
      <template v-if="type === 'number'">
        <i class="fa fa-angle-up app-input__plus" @click="onClickPlus"/>
        <i class="fa fa-angle-down app-input__minus" @click="onClickMinus"/>
      </template>
      <i v-if="clear"
         class="fa fa-circle-xmark absolute block right-0 top-0 my-4 mx-3 cursor-pointer text-gray-300 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-600 transition"
         @click="onClear"/>
    </div>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <slot name="item"/>
  </div>
  <div v-else class="relative flex items-center" :class="[$props.class, type === 'number' ? 'app-input__number' : '']">
    <div v-if="data.loading" class="absolute left-0 top-1 my-1 mx-2 flex items-center justify-center"
         :class="[type === 'button' ? 'right-0 bottom-0' : '']">
      <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
    </div>
    <input v-model="model"
           ref="input"
           :id="id"
           :type="type"
           :placeholder="placeholder"
           :class="[inputClass, error ? '!border-rose-500' : '', data.loading ? '!text-transparent' : '']"
           :readonly="readonly"
           :required="required"
           :disabled="disabled"
           @mousedown="onMousedown">
    <template v-if="type === 'number'">
      <i class="fa fa-angle-up app-input__plus" @click="onClickPlus"/>
      <i class="fa fa-angle-down app-input__minus" @click="onClickMinus"/>
    </template>
    <i v-if="clear && model"
       class="fa fa-circle-xmark absolute block right-0 top-0 mt-3 mr-2 cursor-pointer text-gray-300 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-600 transition"
       @click="onClear"/>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
  </div>
</template>

<style scoped>
.app-input__number input::-webkit-outer-spin-button,
.app-input__number input::-webkit-inner-spin-button {
  @apply appearance-none m-0
}
.app-input__number {
  @apply relative
}
.app-input__number .app-input__plus, .app-input__number .app-input__minus {
  @apply absolute hidden cursor-default md:flex justify-center items-center right-0 w-8 h-1/2 text-gray-300 hover:text-blue-500
}
.app-input__number .app-input__plus {
  @apply top-0 pt-2
}
.app-input__number .app-input__minus {
  @apply bottom-0 pb-1.5
}
.app-input__number input[type="number"] {
  @apply pr-8
}
</style>
