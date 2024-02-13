<template>
  <li
      :class="this.class"
      :data-level="level">
    <div :style="{ paddingLeft: (level * 18) + 8 + 'px' }" class="app-tree__node">
      <div v-if="node['loading']" class="app-tree__node__toggle">
        <app-loader-icon/>
      </div>
      <div v-else-if="node['folder'] && !node['hideChildren']"
           class="app-tree__node__toggle"
           @click.stop="$emit('action', 'toggle', node)">
        <i v-if="node?.['data']" class="fa fa-angle-down fa-fw"/>
        <i v-else class="fa fa-angle-right fa-fw"/>
      </div>

      <i class="app-tree__node-icon" :class="icon" @mousedown="contextmenu">
        <i v-if="node['private']" class="fa fa-lock app-tree__node-lock"/>
      </i>

      <div @click="$emit('action', 'click', $event, node, category)"
           @contextmenu="contextmenu"
           @mouseenter="mouseenter"
           @mousemove="mousemove"
           @mouseleave="mouseleave"
           class="app-tree__node-title"
           :data-tooltip="title">
        {{ name }}
      </div>

      <component :is="append"/>

      <div v-if="help" v-html="help" class="app-tree__node-help"/>
      <button ref="menuBtn" class="absolute opacity-0 w-0 h-0 p-0" @click="menuOpen" @blur="menuClose"/>

      <transition>
        <div v-show="menuActive && actions" class="app-tree__node__menu" :class="menuData?.class">
          <div class="app-tree__node__menu-header">
            {{ node.title }}
          </div>
          <template v-for="action in actions">
            <div v-if="action.title && Object.values(action).length === 1" class="app-tree__node__menu-item">
              {{ action.title }}
            </div>
            <div v-else-if="action.split" class="app-tree__node-split"/>
            <div v-else class="app-tree__node__menu-item" @mousedown="clickAction(action)">
              <i v-if="action.icon" :class="action.icon" class="fa fa-fw"/>
              {{ action.title }}
            </div>
          </template>
        </div>
      </transition>
    </div>

    <ul v-if="node?.['data'] && node['data'].length">
      <tree-node
          v-for="child in node['data']"
          v-bind="Object.assign({}, $props, { node: child, level: level + 1 })"
          @action="action"/>

      <li v-if="node['meta']?.['pagination']?.['next']" @click.stop="more(node['meta']['pagination']['next'])">
        <a class="app-tree__node-more">
          <app-loader-icon v-if="node['loading']"/>
          <span v-else>{{ node['meta']['pagination']['lang']['next'] }}</span>
        </a>
      </li>
    </ul>
  </li>
</template>

<script>
import { compile } from 'vue'
import AppLoaderIcon from '../Layout/LoaderIcon.vue'

export default {
  name: 'TreeNode',
  components: { AppLoaderIcon },

  props: [
    'node',
    'id',
    'url',
    'route',
    'category',
    'keyTitle',
    'level',
    'aliases',
    'icons',
    'templates',
    'appends',
    'contextMenu',
    'settings',
    'menu'
  ],

  computed: {
    class () {
      const classes = []

      if (this.node['class']) {
        this.node['class'].split(' ').forEach(i => {
          classes.push(i)
        })
      }

      if (this.node['folder'] !== undefined || !!this.node['data']) {
        classes.push('app-tree__node-folder')
      }

      if (!!this.node['data']) {
        classes.push('app-tree__node-opened')
      }

      if (this.node['hidden']) {
        classes.push('app-tree__node-hide')
      }

      if (this.node['unhidden'] || (this.node['inhidden'] !== undefined && !this.node['inhidden'])) {
        classes.push('app-tree__node-inhidden')
      }

      if (this.node['unpublished'] || this.node['published'] !== undefined && !this.node['published']) {
        classes.push('app-tree__node-unpublished')
      }

      if (this.node['deleted']) {
        classes.push('app-tree__node-deleted')
      }

      if (this.current) {
        classes.push('app-tree__node-active')
      }

      if (this.menuActive) {
        classes.push('app-tree__node-menu-active')
      }

      return classes
    },
    icon () {
      let icon = ''

      switch (true) {
        case !!this.icons[this.node['id']]:
          icon = this.icons[this.node['id']]
          break

        case !!this.icons[this.node['type']]:
          icon = this.icons[this.node['type']]
          break

        case !!this.node['folder']:
          if (this.node?.['data']?.length) {
            icon = this.icons.folderOpen
          } else {
            icon = this.icons.folder
          }
          break

        default:
          icon = this.icons.default
      }

      return icon
    },
    title () {
      if (this.templates?.title) {
        let data = this.templates.title
        let cleanKeys = true

        return data.replace(/\{([\w.]*)}/g, (str, key) => {
          const value = typeof this.node[key] !== undefined ? this.node[key] : ''
          return (value === null || value === undefined) ? (cleanKeys ? '' : str) : value
        }).replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
      }
    },
    help () {
      if (this.templates?.help) {
        let data = this.templates.help
        let cleanKeys = true

        return (data.replace(/\{([\w.]*)}/g, (str, key) => {
          const value = typeof this.node[key] !== undefined ? this.node[key] : ''
          return new Option((value === null || value === undefined) ? (cleanKeys ? '' : str) : value).innerHTML
        })).replace(/\r\n+/g, '<br>')
      }
    },
    name () {
      return this.node[this.keyTitle]
    },
    actions () {
      return this.menuData?.actions?.filter(i => {
        if (i.hidden) {
          for (const j in i.hidden) {
            if (this.node?.[j] === i.hidden[j]) {
              return false
            }
          }
        }

        return true
      })
    },
    current () {
      return this.$route['name'] === this.route
          && (parseInt(this.$route['params']?.id?.toString()) === this.node?.['id'] ||
              (this.$route['params']?.['id'] && this.$route['params']['id'] === this.node?.['key']))
          && (!this.node['folder'] && this.category || !this.category)
    },
    append () {
      const appends = []

      this.appends.map(i => {
        if (this.node[i] !== undefined) {
          appends.push(`<div class="pl-2 text-sm">` + this.node[i] + `</div>`)
        }
      })

      return compile(appends.join(' '))
    }
  },

  data () {
    this.timer = 0

    return {
      menuData: this.node['contextMenu'] ?? this.contextMenu ?? {},
      menuActive: false
    }
  },

  created () {
    this.alias(this.node)
  },

  updated () {
    this.alias(this.node)
  },

  methods: {
    action () {
      if (typeof this[arguments[0]] === 'function') {
        this[arguments[0]](...Array.from(arguments).splice(1))
      } else {
        this.$emit('action', ...arguments)
      }
    },

    alias (data) {
      for (const i in data) {
        if (this.aliases[i] && this.aliases[i] !== i) {
          data[this.aliases[i]] = data[i]
          delete data[i]
        }
      }

      return data
    },

    more (url) {
      this.$emit('action', 'loader', 1)
      this.node.loading = true
      axios.get(url).then(({ data }) => {
        this.node['meta']['pagination']['next'] = data['meta']?.['pagination']?.['next'] || null

        if (data['data']) {
          this.node['data'].push(...data['data'])
        }

        this.$emit('action', 'loader', 0)
        this.node.loading = false
      })
    },

    contextmenu (event) {
      if (this.menuData) {
        event.preventDefault()
        this.$refs.menuBtn.click()
      }
    },

    menuOpen (event) {
      if (this.menuActive) {
        this.menuActive = !this.menuActive
        return
      }

      this.menuActive = true
      event.target.focus()

      this.$nextTick(() => {
        let menu = this.$el.querySelector('.app-tree__node__menu'),
            position = this.$el.firstElementChild.getBoundingClientRect()

        menu.classList.add(
            (position.top + position.height + menu.offsetHeight > window.innerHeight ? 'bottom-full' : 'top-full')
        )
      })
    },

    menuClose () {
      this.$nextTick(() => this.menuActive = false)
    },

    clickAction (action) {
      if (action.to) {
        const to = window._.mergeWith({
          params: { id: this.node['id'] },
          query: { parent: this.node['id'] }
        }, action.to)

        if (to.params.id === this.node['id']) {
          delete to.query.parent
        }

        this.$router.push(to)
      }
    },

    mouseenter () {
      if (this.templates?.help) {
        this.timer = setTimeout(() => {
          clearTimeout(this.timer)
          this.$el.classList.add('app-tree__node-hover')
        }, 1000)
      }
    },

    mousemove (event) {
      if (this.templates?.help) {
        const help = this.$el.querySelector('.app-tree__node-help')
        help.style.left = event.clientX + 16 + 'px'
        help.style.top = event.clientY + 16 + 'px'

        if (event.clientY + 16 + help.offsetHeight > window.innerHeight) {
          help.style.top = event.clientY - help.offsetHeight + 'px'
        }
      }
    },

    mouseleave () {
      if (this.templates?.help) {
        clearTimeout(this.timer)
        this.$el.classList.remove('app-tree__node-hover')
      }
    }
  }
}
</script>
