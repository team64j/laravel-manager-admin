<script setup>
import { computed, getCurrentInstance, nextTick, ref, shallowRef } from 'vue'
import { props } from '@/composables'
import RadioComponent from '@/components/Radio/Radio.vue'
import CheckboxComponent from '@/components/Checkbox/Checkbox.vue'
import Button from '@/components/Button/Button.vue'
import router from '@/router'

defineOptions({
  name: 'Select',
  __isStatic: true,
})

const currentInstance = getCurrentInstance()

const $emit = defineEmits(['action', 'update:modelValue', 'update:props'])

const $props = defineProps({
  ...props,
  multiple: Boolean,
  load: Boolean,
  url: String,
})

const refOptions = ref()

const loading = shallowRef(false)

const options = computed(() => $props.data || [])

const model = computed({
  get () {
    const value = $props.value ?? $props.modelValue ?? ''
    return $props.multiple && !Array.isArray(value) ? [value] : value
  },
  set (value) {
    $emit('update:modelValue', value, currentInstance)
  },
})

let newValue = null
let oldValue = null

const inputValue = computed(() => {
  const values = []

  options?.value.forEach(i => {
    if (i['data']) {
      values.push(...i['data'])
    } else {
      values.push(i)
    }
  })

  if (newValue !== null) {
    return newValue
  }

  const value = !Array.isArray(model.value) || model.value !== null ? ($props.multiple
      ? model.value
      : model.value.toString()) : model.value

  return values.filter(
      i => Array.isArray(value) ? value.includes(i.key) : value === (i.key !== null ? i.key.toString() : i.key)).
      map(i => i.value).
      join(', ')
})

function get (callback) {
  if ($props.url) {
    loading.value = true
    $emit('update:props', { data: [] })

    const route = router.parse($props.url)
    const query = {
      selected: Array.isArray(model.value) ? model.value : [model.value],
      ...(route['query'] || {}),
    }

    axios({
      method: route?.['meta']?.['method']?.toLowerCase() ?? 'get',
      url: route.path,
      params: query,
      data: query,
    }).then(r => {
      loading.value = false
      $emit('update:props', { data: r.data.data })

      nextTick(() => {
        const checked = currentInstance.vnode.el.querySelector('input:checked')

        if (checked && options) {
          refOptions.value.scrollTop = checked.parentElement.offsetTop
        }
      })

      if (callback) {
        callback()
      }
    })
  }
}

function onMousedown (event) {
  if (event.currentTarget.classList.contains('app-select__focus')) {
    event.currentTarget.blur()
    event.stopPropagation()
    event.preventDefault()
    return false
  }
}

function onFocus (event) {
  if (!event.currentTarget.classList.contains('app-select__focus')) {
    event.currentTarget.classList.add('app-select__focus')
    get()
  }
}

function onBlur (event) {
  event.currentTarget.classList.remove('app-select__focus')
}

function onClickClear () {
  newValue = null
  model.value = oldValue
  $emit('update:props', { error: '', modelValue: oldValue })
}

function onInput (event) {
  newValue = event.target.value

  $emit('update:modelValue', newValue, currentInstance)

  $emit('update:props', { error: newValue === '' ? undefined : '', modelValue: newValue })
}

function onUpdateModelValue (value) {
  $props.emitInput && $emit('action', $props.emitInput, value, currentInstance)

  if (value === $props.itemNew) {
    oldValue = model.value
    $emit('update:props', { error: undefined, modelValue: value })
  } else {
    $emit('update:props', { error: '', modelValue: value })
  }
}

if ($props.load && $props.url) {
  get()
}
</script>

<template>
  <div class="w-full" :class="$props.class">
    <div v-if="$props.label" class="mb-1">
      <label :for="$props.id" class="font-bold cursor-pointer">
        {{ $props.label }}
        <span v-if="$props.required" class="text-rose-500">*</span>
        <i v-if="$props.help" class="ml-2 font-normal" :data-tooltip="$props.help"/>
        <i v-if="$props.error" :data-tooltip="$props.error.toString()" data-type="error" class="ml-2 font-normal"/>
      </label>
      <slot name="label"/>
    </div>
    <div class="relative">
      <div v-if="$props.itemNew === model">
        <input type="text" :id="`input-`+$props.id" :class="{ '!border-rose-500': $props.error }" autofocus @change="onInput"/>
        <i class="fa fa-circle-xmark absolute top-3 right-3 cursor-pointer" @click="onClickClear"/>
      </div>
      <Button v-show="$props.itemNew !== model"
              :id="$props.id"
              class="app-appearance-select flex cursor-pointer select-none font-normal items-center"
              :class="[$props.inputClass, $props.error ? '!border-rose-500 focus:ring-rose-500' : '']"
              :value="inputValue || $props.placeholder"
              :loading="loading"
              :disabled="$props.disabled"
              :readonly="$props.readonly"
              @focus="onFocus"
              @blur="onBlur"
              @mousedown="onMousedown"/>

      <div v-if="options?.length"
           ref="refOptions"
           class="hidden absolute z-20 left-0 top-full mt-1 p-2 w-full rounded bg-white dark:bg-gray-800 shadow-lg max-h-48 overflow-auto cursor-default"
           @mousedown.prevent="">

        <template v-for="o in options">
          <div v-if="o.name" class="px-3 pt-1 pb-0.5 font-bold">{{ o.name }}</div>
          <checkbox-component
              v-if="$props.multiple"
              v-model="model"
              :data="o['data'] ?? [o]"
              false-value=""
              class="pl-0.5 pt-[1px] last:pb-[1px] font-normal"
              label-class="w-full py-0.5"
              input-class="!ring-0"
              :as-button="true"
              @update:modelValue="onUpdateModelValue"/>
          <radio-component
              v-else
              v-model="model"
              :data="o['data'] ?? [o]"
              false-value=""
              class="pl-0.5 pt-[1px] last:pb-[1px] font-normal"
              label-class="w-full py-0"
              input-class="!ring-0"
              :as-button="true"
              @update:modelValue="onUpdateModelValue"/>
        </template>
      </div>
    </div>
    <div v-if="$props.description" v-html="$props.description" class="opacity-75 text-sm"/>
  </div>
</template>

<style scoped>
.app-appearance-select:focus + div {
  @apply block
}
</style>
