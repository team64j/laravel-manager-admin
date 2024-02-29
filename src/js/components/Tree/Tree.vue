<script>
import { provide } from 'vue'
import TreeNode from './TreeNode.vue'
import AppLoaderIcon from '../Layout/LoaderIcon.vue'

export default {
  components: { AppLoaderIcon, TreeNode },
  __isStatic: true,
  name: 'Tree',
  props: {
    id: {
      type: String,
      required: true
    },
    url: String,
    route: [String, Object],
    routeList: String,
    aliases: Object,
    icons: Object,
    appends: Array,
    settings: Object
  },
  data () {
    return {
      loading: false,
      data: null,
      meta: {}
    }
  },
  mounted () {
    provide('appends', this.appends)
    provide('aliases', this.aliases)
    provide('icons', this.icons)

    this.get()
  },
  methods: {
    action () {
      if (typeof this[arguments[0]] === 'function') {
        this[arguments[0]](...Array.from(arguments).splice(1))
      } else {
        this.$emit('action', ...arguments)
      }
    },
    get () {
      this.loading = true

      axios.get(this.url).then(({ data }) => {
        this.data = data['data']
        this.meta = data['meta']
      }).finally(() => {
        this.loading = false
      })
    },
    click (event, node) {
      if (node['category']) {
        return this.toggle(node)
      }

      if (event.ctrlKey && this.routeList && node['folder']) {
        this.$parent.$emit('action', 'pushRouter', {
          name: this.routeList,
          params: {
            id: node.id
          }
        })
      } else {
        const route = typeof this.route === 'object' ? this.route : {
          name: this.route,
          meta: {}
        }

        this.$parent.$emit('action', 'pushRouter', {
          ...route,
          params: {
            id: node.key || node.id
          }
        })
      }
    },
    toggle (node) {
      if (node['data']?.length) {
        node['data'] = []
      } else {
        node['loading'] = true
        axios.get(this.url, {
          params: {
            settings: Object.assign({}, this.settings, { parent: node['id'] })
          }
        }).then(({ data }) => {
          if (data['data']) {
            node['data'] = data['data']
          }

          if (data['meta']) {
            node['meta'] = data['meta']
          }
        }).finally(() => {
          node['loading'] = false
        })
      }
    },
    more (node) {
      if (node['data'].length) {
        node['loading'] = true
        axios.get(node['meta']['pagination']['next'], {
          params: {
            settings: Object.assign({}, this.settings, { parent: node['id'] })
          }
        }).then(({ data }) => {
          if (data['data']) {
            node['data'] = node['data'].concat(data['data'])
          }

          if (data['meta']) {
            node['meta'] = data['meta']
          }
        }).finally(() => {
          node['loading'] = false
        })
      }
    }
  }
}
</script>

<template>
  <div class="app-tree">
    <div class="app-tree__menu">
      MENU
    </div>

    <div class="app-tree__body">
      <div class="app-tree__root">
        <div v-if="!data" class="text-center p-5">
          <app-loader-icon/>
        </div>

        <template v-else-if="data.length">
          <tree-node v-for="node in data" v-bind="{ node, level: 1 }" @action="action"/>
        </template>

        <div v-else class="text-center p-5">
          {{ meta['message'] }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-tree {
  @apply flex flex-col overflow-hidden w-full h-full
}
.app-tree__menu {
  @apply grow-0
}
.app-tree__body {
  @apply grow overflow-hidden
}
.app-tree__root {
  @apply overflow-y-auto p-1 h-full
}
</style>
