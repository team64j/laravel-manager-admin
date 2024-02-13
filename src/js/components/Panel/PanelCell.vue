<template>
  <template v-if="columns && columns.length">
    <td v-for="column in columns" :style="column.style">

      <div v-if="column.actions" class="whitespace-nowrap">
        <app-help-icon
            class="cursor-pointer"
            v-for="(a, k) in column.actions"
            :icon="[a.values ? a.values[item[k]]?.['icon'] : a['icon']]"
            :fit="a?.values?.[item[k]]?.['helpFit'] ?? a['helpFit']"
            :no-opacity="a?.values?.[item[k]]?.['noOpacity'] ?? a['noOpacity']"
            :title="a.values ? a.values[item[k]]?.['title'] : a['title']"
            :data="a?.values?.[item[k]]?.['help'] ?? a['help']"
            @click.prevent="action(k, item, a.values ? item[k] : a)"/>
      </div>

      <template v-else-if="column.icon">
        <div v-if="column.html" v-html="column.icon"/>
        <i v-else :class="column.icon"/>
      </template>

      <component v-else-if="column.values" :is="columnValues(column)"/>

      <panel-item-component
          v-else-if="item[column.name]?.component"
          :key="column.name"
          :model-value="getModelValue(item, column)"
          :props="item[column.name]"
          :category="category"
          :item="item"
          @action="action"
          @update:modelValue="updateModelValue"/>

      <panel-item-component
          v-else-if="column?.component"
          :key="column.name + item['id']"
          :model-value="getModelValue(item, column)"
          :props="column"
          :category="category"
          :item="item"
          @action="action"
          @update:modelValue="updateModelValue"/>

      <div v-else v-bind="column?.attrs">
        <component :is="value(item, column)"/>
        <app-help-icon v-if="item[column.name + `.help`]" :data="item[column.name + `.help`]"/>
      </div>

    </td>
  </template>

  <template v-else v-for="(value, key) in item" :key="key">
    <td v-if="key[0] !== '@'" v-html="value"/>
  </template>
</template>

<script>
import PanelItemComponent from './PanelItemComponent'
import { compile, h } from 'vue'
import AppHelpIcon from '@/components/Layout/HelpIcon.vue'

export default {
  name: 'PanelCell',
  components: { PanelItemComponent, AppHelpIcon },

  emits: ['action', 'update:modelValue'],

  props: {
    columns: {
      type: Array
    },
    category: {
      type: Object
    },
    item: {
      type: Object
    },
    modelValue: null
  },

  methods: {
    action () {
      if (typeof this[arguments[0]] === 'function') {
        this[arguments[0]](...Array.from(arguments).splice(1))
      } else {
        this.$emit('action', ...arguments)
      }
    },

    updateModelValue () {
      this.$emit('update:modelValue', ...arguments)
    },

    getModelValue (item, column) {
      if (column?.component) {
        return item[column.name]
      }

      const columnData = item[column.name]?.data
      const columnModel = item[column.name].model

      if (this.modelValue?.[columnModel] !== undefined) {
        return this.modelValue[columnModel]
      }

      return (columnModel && (columnData ?? this.modelValue)?.[columnModel]) ?? this.modelValue
    },

    value (item, column) {
      const key = column.key ?? column.name

      const value = (item[key + `.name`] ?? item[key] ??
          (/./.test(key) ? this.findValue(key.split('.'), item) : '')).toString()

      if (column.html) {
        return compile(value.replace(/<script([\S\s]*?)>([\S\s]*?)<\/script>/ig, '').
            replace(/<style([\S\s]*?)>([\S\s]*?)<\/style>/ig, ''))
      }

      return () => h('span', value)
    },

    findValue (keys, data) {
      let value = ''

      if (!data) {
        return value
      }

      keys.forEach((key, index) => {
        if (data[key] !== undefined) {
          if (keys[index + 1]) {
            keys.shift()
            value = this.findValue(keys, data[key])
          } else {
            value = data[key] ?? ''
          }
        }
      })

      return value
    },

    columnValues (column) {
      if (typeof Object.values(column.values)[0] === 'object') {
        if (this.item[column.name || column.key]) {
          return () => h({ template: this.item[column.name || column.key] })
        } else {
          for (const i in column.values) {
            for (const j in column.values[i]) {
              if (this.item[i].toString() === j.toString()) {
                return () => h({ template: column.values[i][j] })
              }
            }
          }
        }
      } else {
        return () => h({ template: column.values[this.item[column.name]] ?? column.values?.[this.item[column.key]] })
      }
    }
  }
}
</script>

<style scoped>
td {
  @apply px-3 py-1 first:pl-6 last:pr-6
}
</style>
