<template>
  <div v-if="label" class="w-full mb-3" :class="$props.class">
    <div v-if="!data">
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
    </div>
    <template v-else>
      <label for="" class="block font-bold mb-1">
        {{ label }}
        <span v-if="required" class="text-rose-500">*</span>
        <i v-if="help" class="ml-2 font-normal" :data-tooltip="help"/>
      </label>
      <div v-for="(i, k) in data">
        <label :key="k" class="inline-flex items-center cursor-pointer">
          <input v-model="model"
                 :id="id+`_`+i.key"
                 :value="i.key"
                 :true-value="i.key"
                 :false-value="falseValue"
                 type="radio"
                 class="mr-2">
          <span>{{ i.value }}</span>
        </label>
      </div>
    </template>
  </div>
  <template v-else>
    <input v-model="model"
           :id="id"
           :value="value"
           :true-value="trueValue"
           :false-value="falseValue"
           :disabled="disabled"
           type="radio">
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <div v-if="error" class="absolute text-xs text-rose-600" :class="errorClass">{{ errorMessage }}</div>
  </template>
</template>

<script>
import Field from './Field.vue'

export default {
  __isStatic: true,
  name: 'Radio',
  extends: Field,

  props: {
    modelValue: { default: true },
    value: { default: true }
  }
}
</script>
