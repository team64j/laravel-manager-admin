<script setup>
import { computed, getCurrentInstance, reactive } from 'vue'
import { props as _props } from '../../composables'
import CheckboxComponent from '../Checkbox/Checkbox.vue'
import RadioComponent from '../Radio/Radio.vue'

defineOptions({
  //name: 'Select',
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
  options: props.data || [],
  lastModelValue: props.modelValue
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

const firstValue = computed(() => {
  const values = []

  data.options?.forEach(i => {
    if (i.data) {
      values.push(...i.data)
    } else {
      values.push(i)
    }
  })

  const value = props.multiple ?
      values.filter(i => (Array.isArray(props.modelValue) ?
              props.modelValue :
              [props.modelValue]
      ).includes(i.key)).map(i => i.value) :
      values.filter(i => props.modelValue === i.key && props.itemNew !== i.key).map(i => i.value)

  if (value.toString() !== props.itemNew) {
    data.lastModelValue = model.value
  }

  return value
})

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

function onUpdateModelValue (value) {
  props.emitInput && emit('action', props.emitInput, value, currentInstance)
}

function onFocus () {}

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

function onBlur (event) {
  event.target.classList.remove('opened')
}

function onChange (event) {
  const target = event.target

  if (target.value === props.itemNew && target.options) {
    let value = target.dataset.value

    for (let i of target.options) {
      if (i.value === value) {
        value = props.itemNew
        break
      }
    }

    target.nextElementSibling.value = value
    emit('update:modelValue', value, currentInstance)

    target.parentElement.classList.add('app-select__editable')
    target.nextElementSibling.focus()
  } else {
    target.dataset.value = target.value
  }

  props.emitInput && emit('action', props.emitInput, target.value, currentInstance)
}

function onInput (event) {
  emit('update:modelValue', event.target.value, currentInstance)
}

function onClickClear () {
  model.value = data.lastModelValue
}

function onClickMultipleList () {
  currentInstance.refs.input.focus()
  currentInstance.refs.input.classList.add('opened')
}

if (props.load && props.url) {
  get()
}
</script>

<template>
  <div v-if="label" class="w-full" :class="$props.class">
    <div class="mb-1">
      <label :for="id" class="font-bold cursor-pointer">
        {{ label }}
        <span v-if="required" class="text-rose-500">*</span>
        <i v-if="help" class="ml-2 font-normal" :data-tooltip="help"/>
      </label>
      <slot name="label"/>
    </div>
    <div class="relative">
      <div v-if="data.loading" class="absolute z-10 left-2 top-2">
        <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
      </div>

      <template v-if="multiple">
        <input type="text"
               :value="firstValue"
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
        <div v-show="itemNew === model">
          <input type="text" :id="`input-`+id" autofocus @input="onInput"/>
          <i class="fa fa-circle-xmark absolute top-3 right-3" @click="onClickClear"/>
        </div>

        <input v-show="itemNew !== model"
               type="text"
               :value="firstValue"
               :id="id"
               ref="input"
               readonly
               class="app-appearance-select cursor-pointer"
               :placeholder="placeholder"
               @mousedown="onMousedown"
               @focus="onFocus"
               @blur="onBlur"/>

        <div
            class="absolute z-20 left-0 top-full w-full hidden border border-blue-500 mt-0 bg-white dark:bg-gray-800 shadow-md max-h-48 overflow-auto cursor-default"
            @mousedown.prevent="">

          <template v-for="o in data.options">
            <template v-if="o?.data">
              <div class="px-3 pt-1 pb-0.5 font-bold">{{ o.name }}</div>
              <radio-component
                  v-model="model"
                  :data="o.data"
                  @update:modelValue="onUpdateModelValue"
                  false-value=""
                  class="pl-0.5 pt-[1px] last:pb-[1px]"
                  label-class="w-full pl-5"
                  :as-button="true"/>
            </template>

            <radio-component
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
    </div>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <div v-if="error" class="text-xs text-rose-600" :class="errorClass">{{ error.toString() }}</div>
  </div>
  <div v-else class="relative">
    <div v-if="data.loading" class="absolute z-10 left-2 top-2">
      <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
    </div>
    <select v-model="model"
            :id="id"
            :multiple="multiple"
            @mousedown="onMousedown"
            @focus="onFocus"
            @change="onChange"
            @blur="onBlur">
      <template v-for="i in data.options">
        <optgroup v-if="i.data" :label="i.name">
          <option v-for="j in i.data" :value="j.key" :selected="j.selected" :disabled="j.disabled">
            {{ j.value }}
          </option>
        </optgroup>
        <option v-else :value="i.key" :selected="i.selected" :disabled="i.disabled">
          {{ i.value }}
        </option>
      </template>
    </select>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <div v-if="error" class="text-xs text-rose-600" :class="errorClass">{{ error.toString() }}</div>
  </div>
</template>

<style scoped>
select + input {
  @apply hidden absolute left-0 top-0 pr-8
}
select + input + i {
  @apply hidden
}
select optgroup {
  @apply font-bold bg-slate-100 dark:bg-gray-700
}
select option {
  @apply bg-white dark:bg-gray-800
}
input.active + div, input.opened + div {
  @apply block
}
.app-select__editable select + input {
  @apply block
}
.app-select__editable select {
  @apply opacity-0
}
.app-select__editable select + input + i {
  @apply absolute block right-0 top-0 my-2.5 mx-3 cursor-pointer text-gray-300 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-600 transition
}
</style>
