<script>
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
  <div v-if="node" class="app-tree__node">
    <div class="app-tree__node-item" :style="{ paddingLeft: (level * 16) + `px` }">
      <div v-if="node['data']" class="app-tree__node-toggle" @click.stop="$emit('action', 'toggle', node)">
        <app-loader-icon v-if="node['loading']" class="!w-4 !h-4"/>
        <i v-else class="fa fa-angle-right fa-fw transition-all" :class="{ 'rotate-90': node['data'].length }"/>
      </div>

      <div class="app-tree__node-icon">
        <i v-if="node['icon']" class="fa-fw" :class="node['icon']"/>
        <template v-else-if="node['data']">
          <i v-if="node['data'].length" class="far fa-folder-open fa-fw pl-0.5 w-5"/>
          <i v-else class="far fa-folder fa-fw w-5"/>
        </template>
        <i v-else class="far fa-file fa-fw"/>
      </div>

      <div class="app-tree__node-title" :class="this.class" @click="$emit('action', 'click', $event, node)">
        {{ node['title'] }}
      </div>

      <div class="app-tree__node-id">
        {{ node['id'] }}
      </div>
    </div>

    <template v-if="node['data']?.length">
      <div class="app-tree__node-children">
        <tree-node v-for="item in node['data']" v-bind="{ node: item, level: level + 1 }" @action="action"/>

        <div v-if="node['meta'] && node['meta']['pagination'] && node['meta']['pagination']['next']"
             @click.stop="$emit('action', 'more', node)"
             class="app-tree__node-pagination"
             :style="{ paddingLeft: ((level + 1) * 18) + `px` }">
          {{ node['meta']['pagination']['lang']['next'] }}
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
  @apply absolute left-0 top-0 right-0 bottom-0 content-[""] rounded pointer-events-none hover:bg-blue-600/10 dark:hover:bg-blue-600/30 transition
}
.app-tree__node .app-tree__node-toggle {
  @apply -ml-5 w-5 flex items-center justify-center text-gray-300 hover:text-blue-500 transition
}
.app-tree__node .app-tree__node-icon {
  @apply pl-1 text-gray-400 dark:text-gray-200
}
.app-tree__node .app-tree__node-title {
  @apply truncate px-1 pb-0.5 grow
}
.app-tree__node .app-tree__node-id {
  @apply pr-1.5 text-sm opacity-80
}
.app-tree__node .app-tree__node-pagination {
  @apply flex items-center text-amber-400
}
.app-tree__node-children {
  @apply flex flex-col
}
.app-tree__node-selected {
  @apply text-blue-500 dark:text-blue-300
}
.app-tree__node-deleted {
  @apply text-rose-600 not-italic line-through
}
.app-tree__node-unpublished {
  @apply italic opacity-70
}
</style>
