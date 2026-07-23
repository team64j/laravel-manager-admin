<script setup>
import { computed, inject, reactive } from 'vue'
import router from '@/router'
import { getValue } from '@/composables'

const $props = defineProps({
  id: [String, Number],
  level: Number,
  node: [null, Object]
})

const $emit = defineEmits(['action'])

const $data = reactive({
  config: inject('config')
})

const keyId = $data.config['settings']['keyId'] ?? 'id'
const keyTitle = $data.config['settings']['keyTitle'] ?? 'title'

const title = computed(() => {
  if ($data.config['aliases']?.['title']) {
    const aliases = typeof $data.config['aliases']['title'] === 'object'
        ? $data.config['aliases']['title']
        : [$data.config['aliases']['title']]

    for (const i of aliases) {
      if ($props.node?.['attributes']?.[i] !== undefined) {
        return $props.node['attributes'][i]
      }
    }
  }

  return $props.node?.['attributes']?.[keyTitle] ?? $props.node['title'] ?? $props.node[keyId]
})

const icon = computed(() => {
  if ($props.node['icon']) {
    return $props.node['icon']
  }

  if (!$data.config['icons']) {
    return
  }

  if ($data.config['icons'][$props.node[keyId]]) {
    return $data.config['icons'][$props.node[keyId]]
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

  if ($data.config['aliases']) {
    for (const a in $data.config['aliases']) {
      const aliases = typeof $data.config['aliases'][a] === 'object'
          ? $data.config['aliases'][a]
          : [$data.config['aliases'][a]]
      let key, value

      for (const i of aliases) {
        [key, value] = /:/.test(i) ? i.split(':', 2) : [i, $props.node?.['attributes']?.[key]]

        if (value !== undefined) {
          if (/^-?[\d.]+(?:e-?\d+)?$/.test(value)) {
            value = parseInt(value)
          } else if (['true', 'false'].includes(value)) {
            value = value === 'true'
          }
        }

        $props.node[a] = $props.node?.['attributes']?.[key] !== undefined &&
            ($props.node?.['attributes']?.[key] === value || value === undefined)
      }
    }
  }

  if ($props.node['selected']) {
    c.push('app-tree__node-selected')
  }

  if ($props.node['deleted']) {
    c.push('app-tree__node-deleted')
  }

  if ($props.node['muted']) {
    c.push('app-tree__node-muted')
  }

  if ($props.node['locked']) {
    c.push('app-tree__node-locked')
  }

  const route = router.currentRoute.value

  if (
      route['fullPath'] === $props.node?.['route']?.['path'] ||
      (
          (
              route['name'] === $data.config['route'] ||
              route['path'] ===
              ($data.config['route']?.['path'] || $data.config['route']).replace(':' + keyId, route['params'][keyId])
          ) && (
              (
                  route['params']?.[keyId]?.toString() === $props.node?.[keyId]?.toString()
              ) ||
              (
                  route['params']?.[keyId] && route['params']?.[keyId]?.toString() === $props.node?.[keyId]?.toString()
              )
          )/* && (
              !$props.node['folder'] && $props.node['category'] || !$props.node['category']
          )*/
      )
  ) {
    c.push('app-tree__node-active')
  }

  return c
})

const tooltip = computed(() => {
  const template = $props.node?.['templates'] !== undefined
      ? ($props.node?.['templates']?.['title'] || '')
      : $data.config['templates']?.['title']

  if (template) {
    const cleanKeys = true
    return template.replace(/\{([\w.]*)}/g, (str, key) => {
      const value = getValue(key, $props.node)
      return (value === null || value === undefined) ? (cleanKeys ? '' : str) : value.toString().
          replace(/&/g, '&amp;').
          replace(/</g, '&lt;').
          replace(/>/g, '&gt;').
          replace(/"/g, '&quot;').
          replace(/'/g, '&#039;')
    }).replace(/\r\n/g, '<br>')
  }
})

function action () {
  $emit('action', ...arguments)
}

function clickNode (event) {
  $emit('action', 'clickNode', event, $props.node)
}

function toggleNode (event) {
  $emit('action', 'toggleNode', $props.node)
}

function buildContextMenu (event) {
  $emit('action', 'buildContextMenu', event, $props.node)
}

function more (event) {
  $emit('action', 'more', $props.node)
}
</script>

<template>
  <div v-if="$props.node" class="app-tree__node" :data-level="$props.level">
    <div class="app-tree__node-item" :class="className" :style="{ paddingLeft: ($props.level * 16) + `px` }">
      <div v-if="$props.node['data'] || $props.node['category']" class="app-tree__node-toggle"
           @click="toggleNode">
        <i v-if="$props.node['loading']"
           class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-4 w-4 animate-spin"/>
        <i v-else class="fa fa-angle-right fa-fw" :class="{ 'rotate-90': $props.node['data']?.['length'] }"/>
      </div>

      <div class="app-tree__node-icon"
           @click.stop="buildContextMenu"
           @contextmenu.prevent="buildContextMenu">
        <i v-if="icon" class="fa-fw" :class="icon"/>
        <template v-else-if="$props.node['data'] !== undefined || $props.node['category']">
          <i v-if="$props.node['data']?.['length']"
             :class="$data.config['icons']['default-folder-open'] ?? 'far fa-folder-open'"
             class="fa-fw pl-0.5 w-5"/>
          <i v-else
             :class="$data.config['icons']['default-folder'] ?? 'far fa-folder'"
             class="fa-fw w-5"/>
        </template>
        <i v-else class="far fa-file fa-fw"/>
        <i v-if="$props.node['locked']" class="fa fa-lock text-sm text-rose-500 bottom-0 right-0 absolute"/>
      </div>

      <div class="app-tree__node-title"
           @click="clickNode"
           @contextmenu.prevent="buildContextMenu"
           :data-tooltip="tooltip">
        {{ title }}
      </div>

      <template v-if="($props.node['appends'] || $data.config['appends'])?.length">
        <div v-for="i in ($props.node['appends'] || $data.config['appends'])" :class="`app-tree__node-`+i"
             class="app-tree__node-append">
          {{ $props.node[i] }}
        </div>
      </template>
    </div>

    <template v-if="$props.node['data']?.['length']">
      <div class="app-tree__node-children">
        <template v-for="item in $props.node['data']">
          <tree-node v-bind="{ node: item, level: $props.level + 1 }" @action="action"/>
        </template>

        <div v-if="$props.node['meta'] && $props.node['meta']['pagination'] && $props.node['meta']['pagination']['next']"
             @click.stop="more"
             class="app-tree__node-pagination"
             :style="{ paddingLeft: (($props.level + 1) * 18) + `px` }">
          {{ $props.node['meta']['pagination']['lang']['next'] }}
          <i v-if="$props.node['loading']"
             class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-4 w-4 animate-spin ml-2"/>
        </div>
      </div>
    </template>
  </div>
</template>
