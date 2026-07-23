<script setup>
import { computed, getCurrentInstance, nextTick, ref, shallowRef } from 'vue'
import { props } from '@/composables'
import router from '@/router'
import Radio from '@/components/Radio/Radio.vue'
import Checkbox from '@/components/Checkbox/Checkbox.vue'

defineOptions({
  name: 'Select',
  __isStatic: true
})

const currentInstance = getCurrentInstance()

const $emit = defineEmits(['action', 'update:modelValue', 'update:props'])

const $props = defineProps({
  ...props,
  multiple: Boolean,
  load: Boolean,
  url: String
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
  }
})

let newValue = ref(null)
let oldValue = ref(null)

const inputValue = computed(() => {
  const values = []

  options?.value.forEach(i => {
    if (i['data']) {
      values.push(...i['data'])
    } else {
      values.push(i)
    }
  })

  if (newValue.value !== null) {
    return newValue.value
  }

  const value = !Array.isArray(model.value) || model.value !== null ? ($props.multiple
      ? model.value
      : model.value.toString()) : model.value

  return values.filter(
      i => Array.isArray(value) ? value.includes(i.key) : value === (i.key !== null ? i.key.toString() : i.key)).
      map(i => i.value).
      join(', ')
})

function get () {
  if ($props.url) {
    loading.value = true
    $emit('update:props', { data: [] })

    const route = router.parse($props.url)
    const query = {
      selected: Array.isArray(model.value) ? model.value : [model.value],
      ...(route['query'] || {})
    }

    axios({
      method: route?.['meta']?.['method']?.toLowerCase() ?? 'get',
      url: route.path,
      params: query,
      data: query
    }).then(({ data }) => {
      loading.value = false
      $emit('update:props', { data: data.data })

      nextTick(() => {
        const checked = currentInstance.vnode.el.querySelector('input:checked')

        if (checked && options) {
          refOptions.value.scrollTop = checked.parentElement.offsetTop
        }
      })
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
  newValue.value = null
  model.value = oldValue.value

  $emit('update:props', { error: '', modelValue: oldValue.value })
}

function onInput (event) {
  newValue.value = event.target.value

  $props.data.push({ key: newValue.value, value: newValue.value, '@custom': true })

  $emit('update:modelValue', newValue.value, currentInstance)
  $emit('update:props', { error: newValue.value === '' ? undefined : '', modelValue: newValue.value })
}

function onUpdateModelValue (value) {
  newValue.value = null

  $props.emitInput && $emit('action', $props.emitInput, value, currentInstance)

  if (!$props.itemNew) {
    oldValue.value = model.value
  }

  $emit('update:props', { error: value === '' ? undefined : '', modelValue: value })
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
      <input type="text"
             :id="$props.id"
             class="app-appearance-select flex font-normal items-center placeholder:text-inherit"
             :class="{
                [$props.inputClass]: true,
                 'cursor-pointer': !$props.itemNew,
                 'cursor-text !pr-16': $props.itemNew,
                 '!border-rose-500 focus:ring-rose-500': $props.error
               }"
             :placeholder="inputValue"
             :value="newValue"
             :disabled="$props.disabled"
             :readonly="!$props.itemNew"
             @focus="onFocus"
             @blur="onBlur"
             @mousedown="onMousedown"
             @change="onInput"/>

      <i v-if="newValue !== null"
         class="fa fa-circle-xmark absolute top-3 right-8 cursor-pointer opacity-70 hover:opacity-100 transition"
         @click="onClickClear"/>

      <span v-if="loading" @click.stop.prevent=""
            class="absolute left-3 top-0 !flex items-center h-full w-full bg-inherit">
        <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
      </span>

      <div v-if="options?.length"
           ref="refOptions"
           class="hidden absolute z-20 left-0 top-full mt-1 p-2 w-full rounded bg-white dark:bg-gray-800 shadow-lg max-h-48 overflow-auto cursor-default"
           @mousedown.prevent="">

        <template v-for="o in options">
          <div v-if="o.name" class="px-3 pt-1 pb-0.5 font-bold">{{ o.name }}</div>
          <Checkbox
              v-if="$props.multiple"
              v-model="model"
              :data="o['data'] ?? [o]"
              false-value=""
              class="pl-0.5 pt-[1px] last:pb-[1px] font-normal"
              label-class="w-full py-0.5"
              input-class="!ring-0"
              :as-button="true"
              @update:modelValue="onUpdateModelValue"/>
          <Radio
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
.app-select__focus ~ div {
  @apply block
}
</style>
