<script>
import { provide } from 'vue'
import TreeNode from './TreeNode.vue'
import TreeMenuItem from './TreeMenuItem.vue'
import AppLoaderIcon from '../Layout/LoaderIcon.vue'

export default {
  components: { TreeNode, TreeMenuItem, AppLoaderIcon },
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
    settings: Object,
    templates: Object,
    aliases: Object,
    appends: Array,
    icons: Object,
    contextMenu: Object,
    menu: Object
  },
  data () {
    return {
      keyStorage: `tree.` + this.id.toLowerCase(),
      loading: false,
      data: null,
      meta: {},
      propSettings: this.settings || {},
      propRoute: typeof this.route === 'object' ? this.route : {
        name: this.route,
        meta: {}
      },
      idContextMenu: null,
      showContextMenu: false,
      dataContextMenu: [],
      classContextMenu: null,
      lastSelectValue: null
    }
  },
  watch: {
    propSettings: {
      handler (data) {
        this.$store.dispatch('set', { [`Session.${this.keyStorage}`]: data })
      },
      deep: true
    },
    '$store.state.treeSelect' (select) {
      if (this.$route['name'] === this.propRoute.name) {
        this.$el.querySelector('.app-tree__body').classList.toggle('focused', !!select)
      }
    },
    '$store.state.actionUpdate' () {
      if (this.$store.state.route === this.propRoute.name) {
        switch (this.$store.state.action) {
          case 'create':
            this.createNode(this.$store.state.data, this.data)
            break

          case 'update':
            this.updateNode(this.$store.state.data, this.data)
            break

          case 'delete':
            this.deleteNode(this.$store.state.data, this.data)
            break
        }
      }
    }
  },
  mounted () {
    provide('config', {
      settings: this.propSettings,
      templates: this.templates,
      appends: this.appends,
      aliases: this.aliases,
      icons: this.icons,
      route: this.route
    })

    Object.assign(this.propSettings, this.$store.getters.get(`Session.${this.keyStorage}`, {}))

    this.get()

    document.addEventListener('click', () => {
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
      this.data = null

      axios.get(this.url, {
        params: {
          settings: this.propSettings
        }
      }).then(({ data }) => {
        this.data = data['data']
        this.meta = data['meta']
      }).catch((error) => {
        this.data = []
        if (error?.message) {
          this.meta = {
            message: error.message
          }
        }
      }).finally(() => {
        this.loading = false
      })
    },
    clickNode (event, node) {
      if (this.$store.getters.get('treeSelect') && this.$route['name'] === this.propRoute.name) {
        const context = this.$store.getters.get('context')
        const event = this.$store.getters.get('event')
        context.loading = true
        this.loading = true

        const path = this.$router.resolve({
          name: this.route,
          params: {
            id: 'parents'
          }
        }).path + '/' + this.$route['params']['id'] + '/' + node['id']

        axios.get(path).then(({ data: { data } }) => {
          context.loading = false
          context.model = data['id']
          this.lastSelectValue = data['id'] + ' - ' + data['title']
          this.$store.dispatch('set', { treeSelect: false })
        }).catch(() => {
          setTimeout(() => event.target.classList.add('focus'), 0)
          this.$store.dispatch('set', { treeSelect: true })
        }).finally(() => {
          context.loading = false
          this.loading = false
          if (this.lastSelectValue) {
            this.$nextTick(() => event.target.value = this.lastSelectValue)
          }
        })

        return
      }

      if (node['category']) {
        return this.toggleNode(node)
      }

      if (event.ctrlKey && this.routeList) {
        this.$parent.$emit('action', 'pushRouter', {
          name: this.routeList,
          params: {
            id: node['id']
          }
        })
      } else {
        this.$parent.$emit('action', 'pushRouter', {
          ...this.propRoute,
          params: {
            id: node['id']
          }
        })
      }
    },
    toggleNode (node) {
      const opened = [...this.propSettings.opened || []]

      const id = node['id'] ?? node['key']
      const index = opened.indexOf(id)

      if (node['data']?.length) {
        if (~index) {
          opened.splice(index, 1)
          this.removeChildOpened(node, opened)
        }

        node['data'] = []
      } else {
        if (!~index) {
          opened.push(id)
        }

        node['loading'] = true
        axios.get(this.url, {
          params: {
            settings: Object.assign({}, this.propSettings, { parent: node['id'] })
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

      this.propSettings.opened = opened
    },
    updateNode (node, data) {
      if (this.$store.getters.get('treeSelect')) {
        this.$store.dispatch('remove', 'treeSelect')
        this.get()
        return
      }

      data.forEach(i => {
        if (i.id === node['id']) {
          for (const j in node) {
            if (node[j] !== undefined) {
              i[j] = node[j]
            }
          }
        } else if (i.data) {
          this.updateNode(node, i.data)
        }
      })
    },
    createNode (node, data) {

    },
    deleteNode (node, data) {
      data.forEach((i, k) => {
        if (i.id === node.id) {
          data.splice(k, 1)
        } else if (i.data) {
          this.deleteNode(node, i.data)
        }
      })
    },
    removeChildOpened (data, opened) {
      for (const node of data['data']) {
        if (!node) {
          continue
        }

        const id = node['id'] ?? node['key']

        if (node['data']?.length) {
          const index = opened.indexOf(id)

          if (~index) {
            opened.splice(index, 1)
            this.removeChildOpened(node, opened)
          }
        }
      }
    },
    more (node) {
      if (node['data'].length) {
        node['loading'] = true
        axios.get(node['meta']['pagination']['next'], {
          params: {
            settings: Object.assign({}, this.propSettings, { parent: node['id'] })
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
      this.idContextMenu = node['id']
      this.showContextMenu = false
      this.dataContextMenu = []
      const contextMenu = node['contextMenu'] !== undefined ? node['contextMenu'] : this.contextMenu

      if (!contextMenu) {
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
            icon: action.icon,
            to: action.to
          })
        }
      })

      this.showContextMenu = true

      this.$nextTick(() => {
        const position = event.currentTarget.offsetParent.querySelector('.app-tree__node-title').getBoundingClientRect()

        let top = position.top - position.height
        let left = position.left

        if (top + this.$refs.ctx.offsetHeight > this.$el.offsetHeight) {
          top -= top + this.$refs.ctx.offsetHeight - this.$el.offsetHeight - 30
        }

        this.$refs.ctx.style.top = top + `px`
        this.$refs.ctx.style.left = left + `px`
      })
    },
    clickContextMenu (item) {
      if (item.to) {
        item.to.query ??= {}
        item.to.params ??= {}

        if (item.to.query.id && item.to.query.id.toString()[0] === ':') {
          item.to.query.id = this.idContextMenu
        }

        if (item.to.query.parent && item.to.query.parent.toString()[0] === ':') {
          item.to.query.parent = this.idContextMenu
        }

        if (item.to.params.id && item.to.params.id.toString()[0] === ':') {
          item.to.params.id = this.idContextMenu
        }

        if (item.to.params.parent && item.to.params.parent.toString()[0] === ':') {
          item.to.params.parent = this.idContextMenu
        }

        this.$router.push(item.to)
      }
    },
    menuUpdate () {
      this.get()
    }
  }
}
</script>

<template>
  <div class="app-tree">
    <div v-if="menu" class="app-tree__menu">
      <div class="flex items-center grow">
        <template v-for="a in menu['actions'].filter(i => i.position === 'left' || !i.position)">
          <tree-menu-item v-bind="a" :settings="propSettings" @action="action"/>
        </template>
      </div>
      <div class="flex items-center">
        <template v-for="a in menu['actions'].filter(i => i.position === 'right')">
          <tree-menu-item v-bind="a" :settings="propSettings" @action="action"/>
        </template>
      </div>
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
      <div v-if="showContextMenu && dataContextMenu.length" ref="ctx" class="app-tree__context-menu"
           :class="classContextMenu">
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
  @apply grow-0 flex relative z-10 p-0.5 border-b dark:border-t
}
.app-tree__body {
  @apply grow overflow-hidden
}
.app-tree__body.focused {
  @apply ring-2 ring-inset ring-blue-500
}
.app-tree__root {
  @apply overflow-y-auto p-1 h-full
}
</style>

<style>
.app-tree .app-tree__context-menu {
  @apply fixed left-0 top-0 min-w-64 py-1 border bg-white border-white dark:bg-gray-700 dark:border-gray-700 rounded shadow-2xl
}
.app-tree .app-tree__context-menu.app-tree__context-menu__position-left {
  @apply left-0 right-auto
}
.app-tree .app-tree__context-menu.app-tree__context-menu__position-right {
  @apply left-auto right-0
}
.app-tree .app-tree__context-menu__header {
  @apply px-4 pb-2
}
.app-tree .app-tree__context-menu__split {
  @apply border-t my-1
}
.app-tree .app-tree__context-menu__item {
  @apply px-4 py-0.5 hover:bg-blue-600 hover:text-white cursor-pointer
}
.app-tree .app-tree__context-menu__item i {
  @apply mr-1 opacity-80
}
</style>
