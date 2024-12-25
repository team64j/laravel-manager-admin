<script>
import Field from './Field.vue'

export default {
  __isStatic: true,
  name: 'Radio',
  extends: Field,
  props: {
    modelValue: { default: true },
    value: { default: true },
    asButton: Boolean
  },
  computed: {
    _labelClass () {
      const c = []

      if (this.asButton) {
        c.push('label-as-button')
      }

      return c
    }
  }
}
</script>

<template>
  <div v-if="label" class="w-full" :class="$props.class">
    <template v-if="!data">
      <label class="inline-flex items-center " :class="[ disabled ? 'cursor-no-drop' : 'cursor-pointer' ]">
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
      <div v-if="error" class="absolute text-xs text-rose-600" :class="errorClass">{{ errorMessage }}</div>
    </template>
    <template v-else>
      <div class="block font-bold mb-1">
        {{ label }}
        <span v-if="required" class="text-rose-500">*</span>
        <i v-if="help" class="ml-2 font-normal" :data-tooltip="help"/>
      </div>
      <div v-for="(i, k) in data">
        <label :key="k" class="inline-flex items-center cursor-pointer" :class="[labelClass, _labelClass]">
          <input v-model="model"
                 :id="ID+`_`+i.key"
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
      <input v-model="model"
             :id="ID"
             :class="inputClass"
             :value="value"
             :true-value="trueValue"
             :false-value="falseValue"
             :disabled="disabled"
             type="radio">
      <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
      <div v-if="error" class="absolute text-xs text-rose-600" :class="errorClass">{{ errorMessage }}</div>
    </template>
    <div v-for="(i, k) in data" v-else :class="$props.class">
      <label :key="k" class="inline-flex items-center cursor-pointer" :class="[labelClass, _labelClass]">
        <input v-model="model"
               :id="ID+`_`+i.key"
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
</template>

<style scoped>
.label-as-button {
  @apply relative
}
.label-as-button input {
  @apply absolute z-[-1] left-0 top-0 w-full h-full m-0 p-0 rounded bg-none border-none
}
.label-as-button input:hover:not(:checked) {
  @apply bg-slate-200 dark:bg-gray-600
}
.label-as-button input:checked ~ span {
  @apply text-white
}
</style>
