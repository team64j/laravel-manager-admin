<script>
import { provide } from 'vue'
import { action } from '@/composables'
import router from '@/router'
import store from '@/store'
import TreeNode from './TreeNode.vue'
import TreeMenuItem from './TreeMenuItem.vue'

import('./Tree.css')

export default {
  components: { TreeNode, TreeMenuItem },
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
      propRoute: typeof this.route === 'object' ? this.route : { path: this.route },
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
        store.dispatch('set', { [`Session.${this.keyStorage}`]: data })
      },
      deep: true
    },
    '$store.state.treeSelect' (select) {
      const route = router.currentRoute.value

      if (route['path'] === router.parse({ ...this.propRoute, ...route }).path) {
        this._.vnode.el.querySelector('.app-tree__body').classList.toggle('focused', !!select)
      }
    },
    '$store.state.actionUpdate' () {
      const route = router.currentRoute.value

      if (store.state['route'] === route['path']) {
        switch (store.state['action']) {
          case 'create':
            this.createNode(store.state['data'], this.data)
            break

          case 'update':
            this.updateNode(store.state['data'], this.data)
            break

          case 'delete':
            this.deleteNode(store.state['data'], this.data)
            break
        }
      }
    }
  },
  setup (props) {
    provide('config', {
      templates: props.templates,
      settings: props.settings,
      appends: props.appends,
      aliases: props.aliases,
      icons: props.icons,
      route: props.route
    })
  },
  mounted () {
    Object.assign(this.propSettings, store.getters.get(`Session.${this.keyStorage}`, {}))

    this.get()

    document.addEventListener('click', () => {
      if (this.showContextMenu) {
        this.showContextMenu = false
      }
    })
  },
  methods: {
    action,
    get (update) {
      const route = router.currentRoute.value
      this.loading = true

      if (!update) {
        this.data = null
      }

      const settings = this.propSettings

      if (this.propSettings['history'] && route['params'][this.propSettings['history']] !== undefined) {
        if (settings['opened'] === undefined) {
          settings['opened'] = []
        }

        if (!~settings['opened'].indexOf(route['params'][this.propSettings['history']])) {
          settings['opened'].push(route['params'][this.propSettings['history']])
        }
      }

      axios.get(this.url, {
        params: {
          settings
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
    key (node) {
      return node['id'] ?? node['key']
    },
    clickNode (event, node) {
      const route = router.currentRoute.value
      const id = this.key(node)

      if (store.getters.get('treeSelect') && route['path'] === router.parse({ ...this.propRoute, ...route }).path) {
        const context = store.getters.get('context')
        const event = store.getters.get('event')
        context.exposed.data.loading = true
        this.loading = true

        const path = router.parse({
          path: this.route,
          params: {
            id: 'parents'
          }
        }).path + '/' + route['params']['id'] + '/' + id

        axios.get(path).then(({ data: { data } }) => {
          this.lastSelectValue = data['id'] + ' - ' + data['title']
          context.exposed.data.loading = false
          if (context?.exposed?.model) {
            context.exposed.model.value = data['id']
          } else {
            context.ctx.model = data['id']
          }
          if (context?.exposed?.input) {
            context.exposed.input.value.blur()
            context.exposed.input.value.classList.remove('focus')
          } else {
            event.target.classList.remove('focus')
          }
          store.dispatch('set', { treeSelect: false })
        }).catch(() => {
          setTimeout(() => {
            event.target.classList.add('focus')
            if (context?.exposed?.input) {
              context.exposed.input.value.focus()
            }
          }, 0)
          store.dispatch('set', { treeSelect: true })
        }).finally(() => {
          context.exposed.data.loading = false
          this.loading = false
          if (this.lastSelectValue) {
            context.emit('update:props', { value: this.lastSelectValue })
          }
        })

        return
      }

      if (node['category']) {
        this.toggleNode(node)

        if (!node['folder']) {
          return
        }
      }

      if (event.ctrlKey && this.routeList) {
        this.$parent.$emit('action', 'pushRouter', {
          path: this.routeList,
          params: node,
          meta: {
            title: node.title
          }
        })
      } else {
        const route = node['route'] || this.propRoute
        this.$parent.$emit('action', 'pushRouter', {
          ...route,
          params: node,
          meta: {
            title: node.title
          }
        })
      }
    },
    toggleNode (node) {
      const opened = [...this.propSettings.opened || []]

      const id = this.key(node)
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
            settings: Object.assign({}, this.propSettings, { parent: id })
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
      if (store.getters.get('treeSelect')) {
        store.dispatch('remove', 'treeSelect')
        this.get()
        return
      }

      data.forEach(i => {
        if (this.key(i) === this.key(node) &&
            (!i?.route?.path || i.route.path === router.currentRoute.value.fullPath)) {
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

        if (node['data']?.length) {
          const index = opened.indexOf(this.key(node))

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
            settings: Object.assign({}, this.propSettings, { parent: this.key(node) })
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
      const key = this.key(node)

      if (this.idContextMenu === key) {
        this.idContextMenu = null
        this.showContextMenu = false
        return
      }

      this.idContextMenu = key
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
            to: action.to,
            node
          })
        }
      })

      this.showContextMenu = true

      this.$nextTick(() => {
        const position = event.currentTarget.offsetParent.querySelector('.app-tree__node-title').getBoundingClientRect()

        let top = position.top - position.height
        let left = position.left

        if (top + this.$refs.ctx.offsetHeight > this._.vnode.el.offsetHeight) {
          top -= top + this.$refs.ctx.offsetHeight - this._.vnode.el.offsetHeight - 30
        }

        this.$refs.ctx.style.top = top + `px`
        this.$refs.ctx.style.left = left + `px`
      })
    },
    clickContextMenu (event, item) {
      if (event.buttons === 1 && event.button === 0 && item.to) {
        item.to.query ??= {}
        item.to.params ??= {}
        const route = { ...item.to }
        Object.assign(route.params, item.node)
        if (item.to?.target) {
          axios.head(router.parse({ ...item.to }).fullPath).then(r => {
            r.request.responseURL && window.open(r.request.responseURL, item.to.target)
          }).catch(r => {
            r.request.responseURL && window.open(r.request.responseURL, item.to.target)
          })
        } else {
          router.to(route)
        }
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
          <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
        </div>

        <template v-else-if="data?.length">
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
          <div v-else class="app-tree__context-menu__item" @mousedown="clickContextMenu($event, i)">
            <i v-if="i.icon" :class="i.icon" class="fa fa-fw"/>
            {{ i.title }}
          </div>
        </template>
      </div>
    </transition>
  </div>
</template>
