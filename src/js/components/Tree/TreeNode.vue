<script setup>
import { computed, inject, reactive } from 'vue'
import AppLoaderIcon from '../Layout/LoaderIcon.vue'
import router from '../../router'

const $props = defineProps({
  id: [String, Number],
  level: Number,
  node: [null, Object]
})

const $emit = defineEmits(['action'])

const $data = reactive({
  config: inject('config')
})

const title = computed(() => {
  if ($data.config['aliases']?.['title']) {
    const aliases = typeof $data.config['aliases']['title'] === 'object' ? $data.config['aliases']['title'] : [$data.config['aliases']['title']]

    for (const i of aliases) {
      if ($props.node[i] !== undefined) {
        return $props.node[i]
      }
    }
  }

  return $props.node['title'] ?? $props.node[$data.config['settings']['keyTitle']] ?? $props.node['id']
})

const icon = computed(() => {
  if ($props.node['icon']) {
    return $props.node['icon']
  }

  if ($data.config['icons'][$props.node['id']]) {
    return $data.config['icons'][$props.node['id']]
  }

  if ($data.config['icons'][$props.node['type']]) {
    return $data.config['icons'][$props.node['type']]
  }

  if ($data.config['icons']['default'] && !($props.node['category'] || $props.node['data'] !== undefined)) {
    return $data.config['icons']['default']
  }
})

const className = computed(() => {
  const c = []

  if ($props.node['selected']) {
    c.push('app-tree__node-selected')
  }

  if ($props.node['deleted']) {
    c.push('app-tree__node-deleted')
  }

  if ($props.node['muted']) {
    c.push('app-tree__node-muted')
  }

  if ($data.config['aliases']) {
    for (const a in $data.config['aliases']) {
      const aliases = typeof $data.config['aliases'][a] === 'object'
          ? $data.config['aliases'][a]
          : [$data.config['aliases'][a]]
      let key, value

      for (const i of aliases) {
        [key, value] = i.split(':')

        if (value !== undefined) {
          if (/^-?[\d.]+(?:e-?\d+)?$/.test(value)) {
            value = parseInt(value)
          }
        }

        if (($props.node[key] !== undefined && (value !== undefined && $props.node[key] === value)) ||
            ($props.node[key] && value === undefined)) {
          if (a === 'selected') {
            c.push('app-tree__node-selected')
          } else if (a === 'deleted') {
            c.push('app-tree__node-deleted')
          } else if (a === 'muted') {
            c.push('app-tree__node-muted')
          }
        }
      }
    }
  }

  const route = router.currentRoute.value

  if (route['name'] === $data.config['route'] && (parseInt(route['params']?.id?.toString()) === $props.node?.['id'] ||
          (route['params']?.['id'] && route['params']['id'] === $props.node?.['key'])) &&
      (!$props.node['folder'] && $props.node['category'] || !$props.node['category'])) {
    c.push('app-tree__node-active')
  }

  return c
})

const tooltip = computed(() => {
  const template = typeof $props.node?.['templates'] !== 'undefined'
      ? ($props.node?.['templates']?.['title'] || '')
      : $data.config['templates']?.['title']

  if (template) {
    const cleanKeys = true
    return template.replace(/\{([\w.]*)}/g, (str, key) => {
      const value = typeof $props.node[key] !== undefined ? $props.node[key] : ''
      return (value === null || value === undefined) ? (cleanKeys ? '' : str) : value.toString().
          replace(/&/g, '&amp;').
          replace(/</g, '&lt;').
          replace(/>/g, '&gt;').
          replace(/"/g, '&quot;').
          replace(/'/g, '&#039;')
    })
  }
})

function action () {
  $emit('action', ...arguments)
}
</script>

<template>
  <div v-if="node" class="app-tree__node" :data-level="level">
    <div class="app-tree__node-item" :class="className" :style="{ paddingLeft: (level * 16) + `px` }">
      <div v-if="node['data'] || node['category']" class="app-tree__node-toggle"
           @click="$emit('action', 'toggleNode', node)">
        <app-loader-icon v-if="node['loading']" class="!w-4 !h-4"/>
        <i v-else class="fa fa-angle-right fa-fw" :class="{ 'rotate-90': node['data']?.length }"/>
      </div>

      <div class="app-tree__node-icon"
           @click.stop="$emit('action', 'buildContextMenu', $event, node)"
           @contextmenu.prevent="$emit('action', 'buildContextMenu', $event, node)">
        <i v-if="icon" class="fa-fw" :class="icon"/>
        <template v-else-if="node['data'] !== undefined || node['category']">
          <i v-if="node['data']?.length" class="far fa-folder-open fa-fw pl-0.5 w-5"/>
          <i v-else-if="node['data'] === null" class="fa fa-folder fa-fw w-5"/>
          <i v-else class="far fa-folder fa-fw w-5"/>
        </template>
        <i v-else class="far fa-file fa-fw"/>
        <i v-if="node['locked']" class="fa fa-lock text-sm text-rose-500 bottom-0 right-0 absolute"/>
      </div>

      <div class="app-tree__node-title"
           @click="$emit('action', 'clickNode', $event, node)"
           @contextmenu.prevent="$emit('action', 'buildContextMenu', $event, node)"
           :data-tooltip="tooltip">
        {{ title }}
      </div>

      <template v-if="(node['appends'] || $data.config['appends'])?.length">
        <div v-for="i in (node['appends'] || $data.config['appends'])" :class="`app-tree__node-`+i" class="app-tree__node-append">
          {{ node[i] }}
        </div>
      </template>
    </div>

    <template v-if="node['data']?.length">
      <div class="app-tree__node-children">
        <tree-node v-for="item in node['data']" v-bind="{ node: item, level: level + 1 }" @action="action"/>

        <div v-if="node['meta'] && node['meta']['pagination'] && node['meta']['pagination']['next']"
             @click.stop="$emit('action', 'more', node)"
             class="app-tree__node-pagination"
             :style="{ paddingLeft: ((level + 1) * 18) + `px` }">
          {{ node['meta']['pagination']['lang']['next'] }}
          <app-loader-icon v-if="node['loading']" class="!w-4 !h-4 ml-2"/>
        </div>
      </div>
    </template>
  </div>
</template>
