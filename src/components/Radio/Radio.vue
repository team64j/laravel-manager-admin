<script setup>
import { computed, getCurrentInstance } from 'vue'
import { props } from '@/composables'

const currentInstance = getCurrentInstance()

defineOptions({
  name: 'Radio',
  __isStatic: true
})

const $props = defineProps({
  ...props,
  modelValue: { default: true },
  value: { default: true },
  asButton: Boolean
})

const $emit = defineEmits(['action', 'update:modelValue'])

const labelClass = computed(() => {
  const c = []

  if ($props.disabled) {
    c.push('cursor-no-drop')
  } else {
    c.push('cursor-pointer')
  }

  if ($props.asButton) {
    c.push('label-as-button')
  }

  return c
})

const model = computed({
  get () {
    return $props.modelValue
  },
  set (value) {
    $emit('update:modelValue', value, currentInstance)
  }
})

defineExpose({
  model
})
</script>

<template>
  <div v-if="$props.label" class="w-full" :class="$props.class">
    <template v-if="!$props.data">
      <label class="inline-flex items-center "
             :class="[$props.labelClass, labelClass]">
        <input v-model="model"
               :id="$props.id"
               :value="$props.value"
               :true-value="$props.trueValue"
               :false-value="$props.falseValue"
               :disabled="$props.disabled"
               type="radio"
               class="mr-2">
        {{ $props.label }}
        <span v-if="$props.required" class="text-rose-500">*</span>
        <i v-if="$props.help" class="ml-2 font-normal" :data-tooltip="$props.help"/>
      </label>
      <div v-if="$props.description" v-html="$props.description" class="opacity-75 text-sm"/>
      <div v-if="$props.error" class="absolute text-xs text-rose-600" :class="$props.errorClass">
        {{ $props.error.toString() }}
      </div>
    </template>
    <template v-else>
      <div class="block font-bold mb-1">
        {{ $props.label }}
        <span v-if="$props.required" class="text-rose-500">*</span>
        <i v-if="$props.help" class="ml-2 font-normal" :data-tooltip="$props.help"/>
      </div>
      <div v-for="(i, k) in $props.data">
        <label :key="k" class="inline-flex items-center"
               :class="[$props.labelClass, labelClass]">
          <input v-model="model"
                 :id="$props.id+`_`+i.key"
                 :class="$props.inputClass"
                 :value="i.key"
                 :true-value="i.key"
                 :false-value="$props.falseValue"
                 type="radio"
                 class="mr-2">
          <span class="truncate">{{ i.value }}</span>
        </label>
      </div>
    </template>
  </div>
  <template v-else>
    <template v-if="!$props.data">
      <label class="inline-flex items-center"
             :class="[$props.labelClass, labelClass]">
        <input v-model="model"
               :id="$props.id"
               :class="$props.inputClass"
               :value="value"
               :true-value="$props.trueValue"
               :false-value="$props.falseValue"
               :disabled="$props.disabled"
               type="radio">
        <span v-if="$props.description" v-html="$props.description" class="opacity-75 text-sm"/>
        <span v-if="$props.error" class="absolute text-xs text-rose-600" :class="$props.errorClass">
          {{ $props.error.toString() }}
        </span>
      </label>
    </template>
    <div v-for="(i, k) in $props.data" v-else :class="$props.class">
      <label :key="k" class="inline-flex items-center"
             :class="[$props.labelClass, labelClass]">
        <input v-model="model"
               :id="$props.id+`_`+i.key"
               :class="$props.inputClass"
               :value="i.key"
               :true-value="i.key"
               :false-value="$props.falseValue"
               type="radio"
               class="mr-2">
        <i class="fa fa-fw fa-check mr-1"/>
        <span class="truncate">{{ i.value }}</span>
      </label>
    </div>
  </template>
</template>

<style scoped>
.label-as-button {
  @apply relative pl-2 pr-4
}
.label-as-button input {
  @apply absolute z-[-1] left-0 top-0 w-full h-full m-0 p-0 rounded bg-none border-none
}
.label-as-button input:hover:not(:checked) {
  @apply bg-gray-50 dark:bg-gray-600
}
.label-as-button input ~ i {
  @apply invisible
}
.label-as-button input ~ span {
  @apply px-1 py-0.5 min-w-8 min-h-7 opacity-100 rounded
}
.label-as-button input:disabled ~ span {
  @apply opacity-50
}
.label-as-button input:checked ~ span {
  @apply bg-blue-600
}
.label-as-button input:checked ~ span, .label-as-button input:checked ~ i {
  @apply text-white visible
}
</style>
