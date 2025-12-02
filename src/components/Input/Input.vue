<script setup>
import { props } from '@/composables'
import { computed, getCurrentInstance, reactive, ref } from 'vue'

defineOptions({
  name: 'Input',
  __isStatic: true
})

const currentInstance = getCurrentInstance()

const $emit = defineEmits(['action', 'update:modelValue', 'update:props'])

const $props = defineProps({
  ...props,
  type: {
    type: String,
    default: 'text',
    validator: (type) => ['text', 'number', 'password', 'email', 'tel', 'date', 'datetime-local', 'button'].includes(
        type)
  }
})

const $data = reactive({
  loading: false
})

const model = computed({
  get () {
    return $props.value ?? $props.modelValue ?? ''
  },
  set (value) {
    $emit('update:modelValue', value, currentInstance)
  }
})

const input = ref()

function onMousedown (event) {
  $props.emitClick && $emit('action', $props.emitClick, event, currentInstance)
}

function onClear () {
  model.value = ''
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
  model,
  input,
  data: $data
})
</script>

<template>
  <div v-if="$props.label" class="w-full" :class="$props.class">
    <div class="mb-1">
      <label :for="$props.id" class="font-bold cursor-pointer" :class="$props.labelClass">
        {{ $props.label }}
        <span v-if="$props.required" class="text-rose-500">*</span>
        <i v-if="$props.error" :data-tooltip="$props.error.toString()" data-type="error" class="ml-2 font-normal"/>
        <i v-else-if="$props.help" :data-tooltip="$props.help" class="ml-2 font-normal"/>
      </label>
      <span v-if="$props.requiredText" class="text-rose-500 ml-3 text-sm font-normal">{{ $props.requiredText }}</span>
      <slot name="label"/>
    </div>
    <div class="relative" :class="{ 'app-input__number': $props.type === 'number' }">
      <div v-if="$data.loading" class="absolute left-0 top-1 my-1 mx-2 flex items-center justify-center"
           :class="[$props.type === 'button' ? 'right-0 bottom-0' : '']">
        <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
      </div>
      <input v-model="model"
             ref="input"
             :id="$props.id"
             :type="$props.type"
             :placeholder="$props.placeholder"
             :class="[$props.inputClass, $props.error ? '!border-rose-500 focus:ring-rose-500' : '', $data.loading ? '!text-transparent' : '']"
             :readonly="$props.readonly"
             :required="$props.required"
             :disabled="$props.disabled"
             @mousedown="onMousedown">
      <template v-if="$props.type === 'number'">
        <i class="fa fa-angle-up app-input__plus" @click="onClickPlus"/>
        <i class="fa fa-angle-down app-input__minus" @click="onClickMinus"/>
      </template>
      <i v-if="$props.clear && model"
         class="app-input__clear fa fa-circle-xmark absolute block right-2 my-auto cursor-pointer text-gray-300 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-600 transition"
         @click="onClear" :data-model="model"/>
    </div>
    <div v-if="$props.description" v-html="$props.description" class="opacity-75 text-sm"/>
    <slot name="item"/>
  </div>
  <div v-else class="w-full relative flex items-center"
       :class="[$props.class, $props.type === 'number' ? 'app-input__number' : '']">
    <div v-if="$data.loading" class="absolute left-0 top-1 my-1 mx-2 flex items-center justify-center"
         :class="[$props.type === 'button' ? 'right-0 bottom-0' : '']">
      <i class="inline-block rounded-full border-2 border-gray-200 border-r-gray-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
    </div>
    <input v-model="model"
           ref="input"
           :id="$props.id"
           :type="$props.type"
           :placeholder="$props.placeholder"
           :class="[$props.inputClass, $props.error ? '!border-rose-500' : '', $data.loading ? '!text-transparent' : '']"
           :readonly="$props.readonly"
           :required="$props.required"
           :disabled="$props.disabled"
           @mousedown="onMousedown">
    <template v-if="$props.type === 'number'">
      <i class="fa fa-angle-up app-input__plus" @click="onClickPlus"/>
      <i class="fa fa-angle-down app-input__minus" @click="onClickMinus"/>
    </template>
    <i v-if="$props.clear && model"
       class="app-input__clear fa fa-circle-xmark absolute block right-2 my-auto cursor-pointer text-gray-300 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-600 transition"
       @click="onClear" :data-model="model"/>
    <div v-if="$props.description" v-html="$props.description" class="opacity-75 text-sm"/>
  </div>
</template>

<style scoped>
input ~ .app-input__clear {
  @apply z-[11]
}
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
.app-input__number input:focus ~ .app-input__plus, .app-input__number input:focus ~ .app-input__minus {
  @apply z-10
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
