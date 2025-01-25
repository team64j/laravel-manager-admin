<script setup>
import { computed, getCurrentInstance, reactive, ref } from 'vue'
import { props as _props } from '../../composables'
import RadioComponent from '../Radio/Radio.vue'
import CheckboxComponent from '../Checkbox/Checkbox.vue'

defineOptions({
  name: 'Select',
  __isStatic: true
})

const currentInstance = getCurrentInstance()

const emit = defineEmits(['action', 'update:modelValue', 'update:props'])

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

const input = ref()

const model = computed({
  get () {
    const value = props.value ?? props.modelValue ?? ''
    return props.multiple && !Array.isArray(value) ? [value] : value
  },
  set (value) {
    emit('update:modelValue', value, currentInstance)
  }
})

let newValue = null

const inputValue = computed(() => {
  const values = []

  data.options?.forEach(i => {
    if (i['data']) {
      values.push(...i['data'])
    } else {
      values.push(i)
    }
  })

  if (newValue !== null) {
    return newValue
  }

  const value = !Array.isArray(model.value) || model.value !== null ? model.value.toString() : model.value

  return values.filter(
      i => Array.isArray(value) ? value.includes(i.key) : value === (i.key !== null ? i.key.toString() : i.key)).
      map(i => i.value).
      join(', ')
})

function get (callback) {
  if (props.url) {
    data.loading = true
    data.options = []

    axios.get(props.url, {
      params: {
        selected: Array.isArray(model.value) ? model.value : [model.value]
      }
    }).then(r => {
      data.loading = false
      data.options = r.data.data

      if (callback) {
        callback()
      }
    })
  }
}

function onMousedown (event) {
  if (event.target.classList.contains('app-select__focus')) {
    event.target.blur()
    event.stopPropagation()
    event.preventDefault()
    return false
  }

  get(() => {})
}

function onFocus (event) {
  event.target.classList.add('app-select__focus')
}

function onBlur (event) {
  event.target.classList.remove('app-select__focus')
}

function onClickClear () {
  newValue = null
  model.value = input.value.dataset.oldValue
  emit('update:props', { error: '' })
}

function onInput (event) {
  newValue = event.target.value

  emit('update:modelValue', newValue, currentInstance)

  if (props.error !== undefined) {
    if (newValue === '') {
      emit('update:props', { error: undefined })
    } else {
      emit('update:props', { error: '' })
    }
  }
}

function onUpdateModelValue (value) {
  props.emitInput && emit('action', props.emitInput, value, currentInstance)

  if (value === props.itemNew) {
    input.value.dataset.oldValue = model.value
    emit('update:props', { error: undefined })
  } else {
    emit('update:props', { error: '' })
  }
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
        <i v-if="error" :data-tooltip="error.toString()" data-type="error" class="ml-2 font-normal"/>
      </label>
      <slot name="label"/>
    </div>
    <div class="relative">
      <div v-if="itemNew === model">
        <input type="text" :id="`input-`+id" :class="{ '!border-rose-500': error }" autofocus @input="onInput"/>
        <i class="fa fa-circle-xmark absolute top-3 right-3 cursor-pointer" @click="onClickClear"/>
      </div>
      <button v-show="itemNew !== model"
              :id="id"
              ref="input"
              class="app-appearance-select flex cursor-pointer select-none font-normal items-center"
              @focus="onFocus"
              @blur="onBlur"
              @mousedown="onMousedown">
        <i v-if="data.loading"
           class="pointer-events-none inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
        <span v-else class="pointer-events-none truncate">
          {{ inputValue || placeholder }}
        </span>
      </button>

      <div v-if="data.options?.length"
           class="absolute z-20 left-0 top-full right-0 mt-1 p-2 rounded bg-white dark:bg-gray-800 shadow-lg max-h-48 overflow-auto cursor-default opacity-0 invisible"
           @mousedown.prevent="">

        <template v-for="o in data.options">
          <div v-if="o.name" class="px-3 pt-1 pb-0.5 font-bold">{{ o.name }}</div>
          <checkbox-component
              v-if="multiple"
              v-model="model"
              :data="o['data'] ?? [o]"
              false-value=""
              class="pl-0.5 pt-[1px] last:pb-[1px]"
              label-class="w-full h-8 pl-2"
              :as-button="true"
              @update:modelValue="onUpdateModelValue"/>
          <radio-component
              v-else
              v-model="model"
              :data="o['data'] ?? [o]"
              false-value=""
              class="pl-0.5 pt-[1px] last:pb-[1px]"
              label-class="w-full h-8 pl-2"
              :as-button="true"
              @update:modelValue="onUpdateModelValue"/>
        </template>
      </div>
    </div>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
  </div>
</template>

<style scoped>
.app-appearance-select:focus + div {
  @apply opacity-100 visible
}
</style>
