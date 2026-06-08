<script setup>
import { DynamicComponent } from '@/utils/dynamic-component'
import { h } from 'vue'
import { getValue } from '@/composables'

const props = defineProps({
  item: Object,
  index: Number,
  columns: [Object, Array],
  route: [String, Object],
  modelValue: [Object, Array]
})

const emit = defineEmits(['onClickRow'])

function values (column, item) {
  if (typeof Object.values(column.values)[0] === 'object') {
    if (item[column.name || column.key]) {
      return h({ template: item[column.name || column.key] })
    } else {
      for (const i in column.values) {
        for (const j in column.values[i]) {
          if (item[i]?.toString() === j.toString()) {
            if (typeof column.values[i][j] === 'object') {
              return null
            } else {
              return h({ template: column.values[i][j] })
            }
          }
        }
      }
    }
  }

  return h({ template: column.values[item[column.name]] ?? column.values?.[item[column.key]] })
}
</script>

<template>
  <tr
      class="even:bg-gray-400/5"
      :class="{
        'cursor-pointer': props.route || props.item['@route'],
        'pointer-events-none' : props.item['@disabled'],
        '!bg-blue-600/20': props.item['@active'] && !props.item['@deleted'],
        'hover:bg-blue-600/20': !props.item['@deleted'],
        'bg-rose-600/20 even:bg-rose-600/10 hover:bg-rose-600/30 hover:even:bg-rose-600/20' : props.item['@deleted'],
        'bg-rose-600/20 even:bg-rose-600/30' : props.item['@active'] && props.item['@deleted'],
      }"
      @mousedown="() => emit('onClickRow', props.item)">
    <td v-for="ceil in props.columns" class="p-2 first:pl-6 last:pr-6" :style="ceil.style">
      <div v-if="props.item[ceil.key]?.component || ceil.component" @mousedown.stop>
        <component :is="() => DynamicComponent(props.item, props.modelValue, ceil)"/>
      </div>

      <component v-else-if="ceil.values" :is="() => values(ceil, item)"/>

      <i v-else-if="ceil.icon" :class="ceil.icon"/>

      <i v-else-if="props.item[ceil.key + `.help`]"
         :data-tooltip="props.item[ceil.key + `.help`]"
         @mousedown.prevent.stop/>

      <template v-else>
        {{ getValue(ceil.key, props.item) }}
      </template>
    </td>
  </tr>
</template>