<script>
import { inject } from 'vue'
import AppLoaderIcon from '../Layout/LoaderIcon.vue'

export default {
  name: 'TreeNode',
  components: { AppLoaderIcon },
  props: {
    id: [String, Number],
    level: Number,
    node: [null, Object]
  },
  computed: {
    title () {
      if (this.aliases?.['title']) {
        const aliases = typeof this.aliases['title'] === 'object' ? this.aliases['title'] : [this.aliases['title']]

        for (const i of aliases) {
          if (this.node[i] !== undefined) {
            return this.node[i]
          }
        }
      }

      return this.node['title']
    },
    icon () {
      if (this.node['icon']) {
        return this.node['icon']
      }

      if (this.icons[this.node['id']]) {
        return this.icons[this.node['id']]
      }

      if (this.icons[this.node['type']]) {
        return this.icons[this.node['type']]
      }

      if (this.icons['default'] && !(this.node['category'] || this.node['data'] !== undefined)) {
        return this.icons['default']
      }
    },
    class () {
      const c = []

      if (this.node['selected']) {
        c.push('app-tree__node-selected')
      }

      if (this.node['deleted']) {
        c.push('app-tree__node-deleted')
      }

      if (this.node['unpublished']) {
        c.push('app-tree__node-unpublished')
      }

      return c
    },
    tooltip () {
      const template = typeof this.node?.['templates'] !== 'undefined'
          ? (this.node?.['templates']?.['title'] || '')
          : this.templates?.['title']

      if (template) {
        const cleanKeys = true
        return template.replace(/\{([\w.]*)}/g, (str, key) => {
          const value = typeof this.node[key] !== undefined ? this.node[key] : ''
          return (value === null || value === undefined) ? (cleanKeys ? '' : str) : value.toString().
              replace(/&/g, '&amp;').
              replace(/</g, '&lt;').
              replace(/>/g, '&gt;').
              replace(/"/g, '&quot;').
              replace(/'/g, '&#039;')
        })
      }
    }
  },
  data () {
    return {
      settings: inject('settings'),
      templates: inject('templates'),
      appends: inject('appends'),
      aliases: inject('aliases'),
      icons: inject('icons')
    }
  },
  methods: {
    action () {
      if (typeof this[arguments[0]] === 'function') {
        this[arguments[0]](...Array.from(arguments).splice(1))
      } else {
        this.$emit('action', ...arguments)
      }
    }
  }
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
          <i v-else-if="!node['data']" class="fa fa-folder fa-fw w-5"/>
          <i v-else class="far fa-folder fa-fw w-5"/>
        </template>
        <i v-else class="far fa-file fa-fw"/>
      </div>

      <div class="app-tree__node-title" :class="this.class"
           @click="$emit('action', 'clickNode', $event, node)"
           @contextmenu.prevent="$emit('action', 'buildContextMenu', $event, node)"
           :data-tooltip="tooltip">
        {{ title }}
      </div>

      <template v-if="(node['appends'] || appends)?.length">
        <div v-for="i in (node['appends'] || appends)" :class="`app-tree__node-`+i" class="app-tree__node-append">
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
