<script setup>
import { DynamicComponent } from '@/utils/dynamic-component'

const $props = defineProps({
  item: Object,
  index: Number,
  columns: [Object, Array],
  route: [String, Object],
  modelValue: [Object, Array]
})

const $emit = defineEmits(['onClickRow'])
</script>

<template>
  <tr
      class="even:bg-gray-400/5"
      :class="{
        'cursor-pointer': $props.route || $props.item['@route'],
        'pointer-events-none' : $props.item['@disabled'],
        '!bg-blue-600/20': $props.item['@active'] && !$props.item['@deleted'],
        'hover:bg-blue-600/20': !$props.item['@deleted'],
        'bg-rose-600/20 even:bg-rose-600/10 hover:bg-rose-600/30 hover:even:bg-rose-600/20' : $props.item['@deleted'],
        'bg-rose-600/20 even:bg-rose-600/30' : $props.item['@active'] && $props.item['@deleted'],
      }"
      @mousedown="() => $emit('onClickRow', $props.item)">
    <td v-for="ceil in $props.columns" class="p-2 first:pl-6 last:pr-6">
      <component v-if="$props.item[ceil.key]?.component"
                 :is="() => DynamicComponent($props.item[ceil.key], $props.modelValue)"/>
      <div v-else-if="ceil.values && ceil.values[$props.item[ceil.key]]" v-html="ceil.values[$props.item[ceil.key]]"/>
      <template v-else>
        {{ $props.item[ceil.key] }}
      </template>
    </td>
  </tr>
</template>