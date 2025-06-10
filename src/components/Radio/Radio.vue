<script setup>
import { computed, getCurrentInstance } from 'vue'
import { props as _props } from '@/composables'

const currentInstance = getCurrentInstance()

defineOptions({
  name: 'Radio',
  __isStatic: true
})

const props = defineProps({
  ..._props,
  modelValue: { default: true },
  value: { default: true },
  asButton: Boolean
})

const emit = defineEmits(['action', 'update:modelValue'])

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

const model = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value, currentInstance)
  }
})

defineExpose({
  model
})
</script>

<template>
  <div v-if="label" class="w-full" :class="$props.class">
    <template v-if="!data">
      <label class="inline-flex items-center "
             :class="[labelClass, _labelClass]">
        <input v-model="model"
               :id="id"
               :value="value"
               :true-value="trueValue"
               :false-value="falseValue"
               :disabled="disabled"
               type="radio"
               class="mr-2">
        {{ label }}
        <span v-if="required" class="text-rose-500">*</span>
        <i v-if="help" class="ml-2 font-normal" :data-tooltip="help"/>
      </label>
      <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
      <div v-if="error" class="absolute text-xs text-rose-600" :class="errorClass">{{ error.toString() }}</div>
    </template>
    <template v-else>
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
                 type="radio"
                 class="mr-2">
          <span class="truncate">{{ i.value }}</span>
        </label>
      </div>
    </template>
  </div>
  <template v-else>
    <template v-if="!data">
      <label class="inline-flex items-center"
             :class="[labelClass, _labelClass]">
        <input v-model="model"
               :id="id"
               :class="inputClass"
               :value="value"
               :true-value="trueValue"
               :false-value="falseValue"
               :disabled="disabled"
               type="radio">
        <span v-if="description" v-html="description" class="opacity-75 text-sm"/>
        <span v-if="error" class="absolute text-xs text-rose-600" :class="errorClass">{{ error.toString() }}</span>
      </label>
    </template>
    <div v-for="(i, k) in data" v-else :class="$props.class">
      <label :key="k" class="inline-flex items-center"
             :class="[labelClass, _labelClass]">
        <input v-model="model"
               :id="id+`_`+i.key"
               :class="inputClass"
               :value="i.key"
               :true-value="i.key"
               :false-value="falseValue"
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
