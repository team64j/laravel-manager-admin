<script setup>
import { computed, inject, reactive } from 'vue'
import AppLoaderIcon from '../Layout/LoaderIcon.vue'

const $props = defineProps({
  id: [String, Number],
  level: Number,
  node: [null, Object]
})

const $emit = defineEmits(['action'])

const $data = reactive({
  settings: inject('settings'),
  templates: inject('templates'),
  appends: inject('appends'),
  aliases: inject('aliases'),
  icons: inject('icons')
})

const title = computed(() => {
  if ($data.aliases?.['title']) {
    const aliases = typeof $data.aliases['title'] === 'object' ? $data.aliases['title'] : [$data.aliases['title']]

    for (const i of aliases) {
      if ($props.node[i] !== undefined) {
        return $props.node[i]
      }
    }
  }

  return $props.node['title']
})

const icon = computed(() => {
  if ($props.node['icon']) {
    return $props.node['icon']
  }

  if ($data.icons[$props.node['id']]) {
    return $data.icons[$props.node['id']]
  }

  if ($data.icons[$props.node['type']]) {
    return $data.icons[$props.node['type']]
  }

  if ($data.icons['default'] && !($props.node['category'] || $props.node['data'] !== undefined)) {
    return $data.icons['default']
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

  if ($props.node['unpublished']) {
    c.push('app-tree__node-unpublished')
  }

  return c
})

const tooltip = computed(() => {
  const template = typeof $props.node?.['templates'] !== 'undefined'
      ? ($props.node?.['templates']?.['title'] || '')
      : $data.templates?.['title']

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
    <div class="app-tree__node-item" :style="{ paddingLeft: (level * 16) + `px` }">
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
      </div>

      <div class="app-tree__node-title" :class="className"
           @click="$emit('action', 'clickNode', $event, node)"
           @contextmenu.prevent="$emit('action', 'buildContextMenu', $event, node)"
           :data-tooltip="tooltip">
        {{ title }}
      </div>

      <template v-if="(node['appends'] || $data.appends)?.length">
        <div v-for="i in (node['appends'] || $data.appends)" :class="`app-tree__node-`+i" class="app-tree__node-append">
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

<style scoped>
.app-tree__node {
  @apply py-0.5 cursor-default
}
.app-tree__node > div, .app-tree__node > div > div {
  @apply relative
}
.app-tree__node .app-tree__node-item {
  @apply flex items-center pl-5 w-full
}
.app-tree__node .app-tree__node-item::before {
  @apply absolute left-0 top-0 right-0 bottom-0 content-[""] rounded pointer-events-none hover:bg-blue-600/10 dark:hover:bg-blue-600/30
}
.app-tree__node .app-tree__node-toggle {
  @apply absolute -ml-5 w-6 flex items-center justify-center cursor-pointer text-gray-300 hover:text-blue-500
}
.app-tree__node .app-tree__node-icon {
  @apply pl-1 cursor-pointer text-gray-400 dark:text-gray-200
}
.app-tree__node .app-tree__node-title {
  @apply truncate px-1 pb-0.5 grow cursor-pointer
}
.app-tree__node .app-tree__node-append {
  @apply pr-1.5 text-sm opacity-80 whitespace-nowrap
}
.app-tree__node .app-tree__node-pagination {
  @apply flex items-center text-amber-400 cursor-pointer
}
.app-tree__node-children {
  @apply flex flex-col
}
.app-tree__node-selected {
  @apply text-blue-500 dark:text-blue-300
}
.app-tree__node-unpublished {
  @apply italic opacity-70
}
.app-tree__node-deleted {
  @apply !text-rose-500 not-italic line-through
}
</style>
