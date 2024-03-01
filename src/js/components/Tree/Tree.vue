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
    templates: Object,
    aliases: Object,
    appends: Array,
    icons: Object,
    settings: Object,
    contextMenu: Object
  },
  data () {
    return {
      loading: false,
      data: null,
      meta: {},
      showContextMenu: false,
      dataContextMenu: [],
      classContextMenu: null
    }
  },
  mounted () {
    provide('templates', this.templates)
    provide('appends', this.appends)
    provide('aliases', this.aliases)
    provide('icons', this.icons)

    this.get()

    document.addEventListener('click', event => {
      if (this.showContextMenu) {
        this.showContextMenu = false
      }
    })
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
    },
    buildContextMenu (event, node) {
      this.showContextMenu = false
      this.dataContextMenu = []
      const contextMenu = node['contextMenu'] !== undefined ? node['contextMenu'] : this.contextMenu

      if (contextMenu === undefined) {
        return
      }

      this.classContextMenu = contextMenu?.class ?? null

      contextMenu?.actions.forEach(action => {
        if (action.hidden) {
          for (const h in action.hidden) {
            if (node[h] === action.hidden[h]) {
              return
            }
          }
        }

        if (action.split) {
          this.dataContextMenu.push({
            split: true
          })
        } else {
          this.dataContextMenu.push({
            title: action.title,
            icon: action.icon
          })
        }
      })

      this.showContextMenu = true

      this.$nextTick(() => {
        const position = event.target.getBoundingClientRect()

        let top = position.top - 30
        let left = position.left + position.width

        if (top + this.$refs.ctx.offsetHeight > this.$el.offsetHeight) {
          top -= top + this.$refs.ctx.offsetHeight - this.$el.offsetHeight - 30
        }

        this.$refs.ctx.style.top = top + `px`
        this.$refs.ctx.style.left = left + `px`
      })
    },
    clickContextMenu (item) {

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

    <transition>
      <div v-if="showContextMenu" ref="ctx" class="app-tree__context-menu" :class="classContextMenu">
        <template v-for="i in dataContextMenu">
          <div v-if="i.split" class="app-tree__context-menu__split"/>
          <div v-else-if="i.title && Object.values(i).length === 1" class="app-tree__context-menu__item">
            {{ i.title }}
          </div>
          <div v-else class="app-tree__context-menu__item" @mousedown="clickContextMenu(i)">
            <i v-if="i.icon" :class="i.icon" class="fa fa-fw"/>
            {{ i.title }}
          </div>
        </template>
      </div>
    </transition>
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
.app-tree__context-menu {
  @apply fixed left-0 top-0 py-2 bg-gray-700 rounded shadow-lg
}
.app-tree__context-menu__split {
  @apply border-t m-2
}
.app-tree__context-menu__item {
  @apply px-4 py-0.5 hover:bg-blue-600 hover:text-white cursor-pointer
}
.app-tree__context-menu__item i {
  @apply mr-1 opacity-80
}
</style>
