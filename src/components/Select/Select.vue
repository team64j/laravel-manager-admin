<script setup>
import { computed, getCurrentInstance, reactive } from 'vue'
import { props as _props } from '../../composables'
import RadioComponent from '../Radio/Radio.vue'
import CheckboxComponent from '../Checkbox/Checkbox.vue'

defineOptions({
  name: 'Select',
  __isStatic: true
})

const currentInstance = getCurrentInstance()

const emit = defineEmits(['action', 'update:modelValue'])

const props = defineProps({
  ..._props,
  multiple: Boolean,
  load: Boolean,
  url: String
})

const data = reactive({
  loading: false,
  options: props.data || []
})

const model = computed({
  get () {
    const value = props.value ?? props.modelValue ?? ''
    return props.multiple && !Array.isArray(value) ? [value] : value
  },
  set (value) {
    emit('update:modelValue', value, currentInstance)
  }
})

const inputValue = computed(() => props.data.filter(
    i => i['selected'] || i['key'] !== null && props.modelValue !== null ? i['key'].toString() ===
        props.modelValue.toString() : i['key'] === props.modelValue).map(i => i['value']).join(', '))

function get (callback) {
  data.loading = true

  if (props.multiple) {
    model.value = Array.isArray(model.value) ? model.value : [model.value]
  }

  props.url && axios.get(props.url, {
    params: {
      selected: model.value
    }
  }).then(r => {
    data.loading = false
    data.options = r.data.data

    if (callback) {
      callback()
    }
  })
}

function onMousedown (event) {
  if (!props.url || event.target.classList.contains('opened')) {
    event.target.classList.toggle('opened')
    return
  }

  event.target.dataset.value = event.target.value || model.value

  data.loading = true
  data.options = null

  axios.get(props.url, {
    params: {
      selected: event.target.value
    }
  }).then(r => {
    data.loading = false
    data.options = r.data.data
    event.target.classList.add('opened')
  })
}

if (props.load && props.url) {
  get()
}
</script>

<template>
  <div class="w-full" :class="$props.class">
    <div v-if="label" class="mb-1">
      <label :for="id" class="font-bold cursor-pointer">
        {{ label }}
        <span v-if="required" class="text-rose-500">*</span>
        <i v-if="help" class="ml-2 font-normal" :data-tooltip="help"/>
      </label>
      <slot name="label"/>
    </div>
    <div class="relative">
      <!--      <div v-if="data.loading" class="absolute z-10 left-2 top-2">
              <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
            </div>-->

      <template v-if="multiple">
        <input type="text"
               :value="inputValue"
               :id="id"
               ref="input"
               readonly
               class="block relative w-full px-3 py-1 rounded app-appearance-select cursor-pointer"
               :placeholder="placeholder"
               @mousedown="onMousedown"
               @focus="onFocus"
               @blur="onBlur"/>
        <div
            class="absolute z-20 left-0 top-full w-full hidden border border-blue-500 mt-0 bg-white dark:bg-gray-800 shadow-md max-h-48 overflow-auto cursor-default"
            @click="onClickMultipleList"
            @mousedown.prevent="onClickMultipleList">

          <template v-for="o in data.options">
            <template v-if="o?.data">
              <div class="px-3 pt-1 pb-0.5 font-bold">{{ o.name }}</div>
              <checkbox-component
                  v-model="model"
                  :data="o.data"
                  @update:modelValue="onUpdateModelValue"
                  false-value=""
                  class="pl-0.5 pt-[1px] last:pb-[1px]"
                  label-class="w-full pl-5"
                  :as-button="true"/>
            </template>

            <checkbox-component
                v-else
                v-model="model"
                :data="[o]"
                @update:modelValue="onUpdateModelValue"
                false-value=""
                class="pl-0.5 pt-[1px] last:pb-[1px]"
                label-class="w-full pl-2"
                :as-button="true"/>
          </template>
        </div>
      </template>

      <template v-else>
        <!--        <input type="text"
                       :value="inputValue"
                       :id="id"
                       ref="input"
                       readonly
                       class="app-appearance-select cursor-pointer select-none"
                       :placeholder="placeholder"/>-->

        <button :id="id" class="app-appearance-select cursor-pointer select-none" @mousedown="onMousedown">
          <i v-if="data.loading"
             class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
          <span v-else>{{ inputValue || placeholder }}</span>
        </button>

        <div
            class="absolute z-20 left-0 top-full w-full border border-blue-500 mt-0 bg-white dark:bg-gray-800 shadow-md max-h-48 overflow-auto cursor-default opacity-0 invisible"
            @mousedown.prevent="">

          <template v-for="o in data.options">
            <template v-if="o?.data">
              <div class="px-3 pt-1 pb-0.5 font-bold">{{ o.name }}</div>
              <radio-component
                  v-model="model"
                  :data="o['data']"
                  false-value=""
                  class="pl-0.5 pt-[1px] last:pb-[1px]"
                  label-class="w-full pl-5"
                  :as-button="true"/>
            </template>

            <radio-component
                v-else
                v-model="model"
                :data="[o]"
                false-value=""
                class="pl-0.5 pt-[1px] last:pb-[1px]"
                label-class="w-full pl-2"
                :as-button="true"/>
          </template>
        </div>
      </template>
    </div>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <div v-if="error" class="text-xs text-rose-600" :class="errorClass">{{ errorMessage }}</div>
  </div>
</template>

<style scoped>
.app-appearance-select:focus + div {
  @apply opacity-100 visible
}
</style>
