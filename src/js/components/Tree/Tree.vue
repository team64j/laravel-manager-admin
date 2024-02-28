<script>
import TreeNode from './TreeNode.vue'

export default {
  components: { TreeNode },
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
    settings: Object
  },
  data () {
    return {
      data: [],
      meta: {}
    }
  },
  mounted () {
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
      axios.get(this.url).then(({ data }) => {
        this.data = data['data']
        this.meta = data['meta']
      })
    },
    click (event, node) {
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
      if (node['data'].length) {
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
        })
      }
    }
  }
}
</script>

<template>
  <div class="app-tree">
    <div class="app-tree__menu">

    </div>

    <div class="app-tree__body">
      <div class="app-tree__root">
        <tree-node v-for="item in data" v-bind="{ node: item, level: 1 }" @action="action"/>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-tree {
  @apply flex flex-col overflow-hidden w-full
}
.app-tree__body {
  @apply grow
}
.app-tree__root {
  @apply overflow-y-auto p-1
}
</style>
