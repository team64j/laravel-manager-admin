<script setup>
import { computed, getCurrentInstance } from 'vue'
import { props as _props } from '@/composables'

defineOptions({
  name: 'Checkbox',
  __isStatic: true
})

const currentInstance = getCurrentInstance()

const emit = defineEmits(['action', 'update:modelValue'])

const props = defineProps({
  ..._props,
  modelValue: { default: true },
  value: { default: true },
  asButton: Boolean
})

const model = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value, currentInstance)
  }
})

const _labelClass = computed(() => {
  const c = []

  if (props.disabled) {
    c.push('cursor-no-drop')
  } else {
    c.push('cursor-pointer')
  }

  if (props.asButton) {
    c.push('label-as-button')
  }

  return c
})

defineExpose({
  model
})
</script>

<template>
  <div v-if="label" class="w-full" :class="props.class">
    <template v-if="data">
      <div class="block font-bold mb-1">
        {{ label }}
        <span v-if="required" class="text-rose-500">*</span>
        <i v-if="help" class="ml-2 font-normal" :data-tooltip="help"/>
      </div>
      <div v-for="(i, k) in data">
        <label :key="k" class="inline-flex items-center"
               :class="[labelClass, _labelClass]">
          <input v-model="model"
                 :id="id+`_`+i.key"
                 :class="inputClass"
                 :value="i.key"
                 :true-value="i.key"
                 :false-value="falseValue"
                 type="checkbox"
                 class="mr-2">
          <span class="truncate">{{ i.value }}</span>
        </label>
      </div>
    </template>
    <template v-else>
      <label class="inline-flex items-center"
             :class="[labelClass, _labelClass]">
        <input v-model="model"
               :id="id"
               :value="value"
               :true-value="trueValue"
               :false-value="falseValue"
               :disabled="disabled"
               :class="inputClass"
               type="checkbox"
               class="mr-2">
        {{ label }}
        <span v-if="required" class="text-rose-500">*</span>
        <i v-if="help" class="ml-2 font-normal" :data-tooltip="help"/>
      </label>
      <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
      <div v-if="error" class="absolute text-xs text-rose-600" :class="errorClass">{{ error.toString() }}</div>
    </template>
  </div>
  <template v-else>
    <template v-if="data" :class="props.class">
      <label v-for="(i, k) in data" :key="k" class="inline-flex items-center"
             :class="[labelClass, _labelClass]">
        <input v-model="model"
               :id="id+`_`+i.key"
               :class="inputClass"
               :value="i.key"
               :true-value="i.key"
               :false-value="falseValue"
               type="checkbox"
               class="mr-2">
        <i class="fa fa-fw fa-check mr-1"/>
        <span class="truncate">{{ i.value }}</span>
      </label>
    </template>
    <div v-else>
      <input v-model="model"
             :id="id"
             :class="inputClass"
             :value="value"
             :true-value="trueValue"
             :false-value="falseValue"
             :disabled="disabled"
             type="checkbox">
      <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
      <div v-if="error" class="absolute text-xs text-rose-600" :class="errorClass">{{ error.toString() }}</div>
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
  @apply bg-gray-200 dark:bg-gray-600
}
.label-as-button input ~ i {
  @apply invisible
}
.label-as-button input ~ span {
  @apply px-1 py-0.5 min-w-8 opacity-100 rounded
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
