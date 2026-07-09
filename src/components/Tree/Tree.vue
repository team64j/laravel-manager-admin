<script setup>
import { getCurrentInstance, nextTick, onMounted, provide, reactive, ref, watch } from 'vue'
import { action as _action } from '@/composables'
import router from '@/router'
import store from '@/services/store'
import session from '@/services/session'
import TreeNode from './TreeNode.vue'
import TreeMenuItem from './TreeMenuItem.vue'

const currentInstance = getCurrentInstance()

defineOptions({
  name: 'Tree',
  __isStatic: true
})

const $props = defineProps({
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
})

const keyStorage = `tree.` + $props.id.toLowerCase()

const $data = reactive({
  propSettings: $props.settings || {},
  propRoute: typeof $props.route === 'object' ? $props.route : { path: $props.route },
  idContextMenu: null,
  showContextMenu: false,
  dataContextMenu: [],
  classContextMenu: null,
  lastSelectValue: null
})

const refData = ref(null)
const refMeta = ref(null)

provide('config', {
  templates: $props.templates,
  settings: $props.settings,
  appends: $props.appends,
  aliases: $props.aliases,
  icons: $props.icons,
  route: $props.route
})

onMounted(() => {
  Object.assign($data.propSettings, session.get(keyStorage, {}))

  watch(
      () => $data.propSettings,
      (a) => {
        session.set(keyStorage, a)
      },
      { deep: true }
  )

  watch(
      () => store.storage.treeSelect,
      (select) => {
        const route = router.currentRoute.value

        if (route['path'] === router.parse({ ...$data.propRoute, ...route }).path) {
          currentInstance.vnode.el.querySelector('.app-tree__body').classList.toggle('focused', !!select)
        }
      }
  )

  watch(
      () => store.storage.actionUpdate,
      () => {
        const route = router.currentRoute.value

        if (router.key(router.parse({ path: $props.route, params: route.params }), route)) {
          switch (store.get('action')) {
            case 'create':
              get(true)
              //createNode(store.get('data'), refData.value)
              break

            case 'update':
              get(true)
              //updateNode(store.get('data'), refData.value)
              break

            case 'delete':
              get(true)
              //deleteNode(store.get('data'), refData.value)
              break
          }
        }
      }
  )

  get()

  document.addEventListener('click', () => {
    if ($data.showContextMenu) {
      $data.showContextMenu = false
    }
  })
})

function action (...args) {
  _action.call(currentInstance, ...args)
}

function get (update) {
  if (!$props.url) {
    return
  }

  const route = router.currentRoute.value

  if (!update) {
    refData.value = null
  }

  const settings = $data.propSettings

  if ($data.propSettings['history'] && route['params'][$data.propSettings['history']] !== undefined) {
    if (settings['opened'] === undefined) {
      settings['opened'] = []
    }

    if (!~settings['opened'].indexOf(route['params'][$data.propSettings['history']])) {
      settings['opened'].push(route['params'][$data.propSettings['history']])
    }
  }

  axios.get($props.url, {
    params: {
      settings
    }
  }).then(({ data }) => {
    refData.value = data['data']
    refMeta.value = data['meta']
  }).catch((error) => {
    refData.value = []
    if (error?.message) {
      refMeta.value = {
        message: error.message
      }
    }
  })
}

function keyNode (node) {
  return node['id'] ?? node['keyNode']
}

function clickNode (event, node) {
  const route = router.currentRoute.value
  const id = keyNode(node)

  if (store.get('treeSelect') && route['path'] === router.parse({ ...$data.propRoute, ...route }).path) {
    const context = store.get('context')
    const event = store.get('event')

    const path = router.parse({
      path: $props.route,
      params: {
        id: 'parents'
      }
    }).path + '/' + route['params']['id'] + '/' + id

    axios.get(path).then(({ data: { data } }) => {
      $data.lastSelectValue = data['id'] + ' - ' + data['title']
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
      store.set('treeSelect', false)
    }).catch(() => {
      setTimeout(() => {
        event.target.classList.add('focus')
        if (context?.exposed?.input) {
          context.exposed.input.value.focus()
        }
      }, 0)
      store.set('treeSelect', true)
    }).finally(() => {
      if ($data.lastSelectValue) {
        context.emit('update:props', { value: $data.lastSelectValue })
      }
    })

    return
  }

  if (node['category']) {
    toggleNode(node)

    if (!node['folder']) {
      return
    }
  }

  currentInstance.parent.emit('action', 'pushRouter', {
    ...(event.ctrlKey && $props.routeList ? { path: $props.routeList } : (node['route'] || $data.propRoute)),
    params: node,
    meta: {
      title: node.title
    }
  })
}

function toggleNode (node) {
  const opened = [...$data.propSettings['opened'] || []]

  const id = keyNode(node)
  const index = opened.indexOf(id)

  if (node['data']?.length) {
    if (~index) {
      opened.splice(index, 1)
      removeChildOpened(node, opened)
    }

    node['data'] = []
  } else {
    if (!~index) {
      opened.push(id)
    }

    node['loading'] = true
    axios.get($props.url, {
      params: {
        settings: Object.assign({}, $data.propSettings, { parent: id })
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

  $data.propSettings.opened = opened
}

function updateNode (node, data) {
  if (store.get('treeSelect')) {
    store.set('treeSelect', null)
    get()
    return
  }

  data.forEach(i => {
    if (keyNode(i) === keyNode(node) && (!i?.route?.path || i.route.path === router.currentRoute.value.fullPath)) {
      for (const j in node) {
        if (i[j] !== undefined) {
          i[j] = node[j]
        }
      }
    } else if (i.data) {
      updateNode(node, i.data)
    }
  })
}

function createNode (node, data) {

}

function deleteNode (node, data) {
  data.forEach((i, k) => {
    if (i.id === node.id) {
      data.splice(k, 1)
    } else if (i.data) {
      deleteNode(node, i.data)
    }
  })
}

function removeChildOpened (data, opened) {
  for (const node of data['data']) {
    if (!node) {
      continue
    }

    if (node['data']?.length) {
      const index = opened.indexOf(keyNode(node))

      if (~index) {
        opened.splice(index, 1)
        removeChildOpened(node, opened)
      }
    }
  }
}

function more (node) {
  if (node['data'].length) {
    node['loading'] = true
    axios.get(node['meta']['pagination']['next'], {
      params: {
        settings: Object.assign({}, $data.propSettings, { parent: keyNode(node) })
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

function buildContextMenu (event, node) {
  const key = keyNode(node)

  if ($data.idContextMenu === key) {
    $data.idContextMenu = null
    $data.showContextMenu = false
    return
  }

  $data.idContextMenu = key
  $data.dataContextMenu = []
  const contextMenu = node['contextMenu'] !== undefined ? node['contextMenu'] : $props.contextMenu

  if (!contextMenu) {
    return
  }

  $data.classContextMenu = contextMenu?.class ?? null

  contextMenu?.actions.forEach(action => {
    if (action.hidden) {
      for (const h in action.hidden) {
        if (node[h] === action.hidden[h]) {
          return
        }
      }
    }

    if (action.split) {
      $data.dataContextMenu.push({
        split: true
      })
    } else {
      $data.dataContextMenu.push({
        title: action.title,
        icon: action.icon,
        to: action.to,
        node
      })
    }
  })

  $data.showContextMenu = true

  nextTick(() => {
    const position = event.currentTarget.offsetParent.querySelector('.app-tree__node-title').getBoundingClientRect()

    let top = position.top - position.height
    let left = position.left

    if (top + currentInstance.refs.ctx.offsetHeight > currentInstance.vnode.el.offsetHeight) {
      top -= top + currentInstance.refs.ctx.offsetHeight - currentInstance.vnode.el.offsetHeight - 30
    }

    currentInstance.refs.ctx.style.top = top + `px`
    currentInstance.refs.ctx.style.left = left + `px`
  })
}

function clickContextMenu (event, item) {
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
}

function menuUpdate () {
  get()
}

defineExpose({
  more,
  clickNode,
  toggleNode,
  createNode,
  deleteNode,
  menuUpdate,
  clickContextMenu,
  buildContextMenu
})
</script>

<template>
  <div class="app-tree">
    <div v-if="$props.menu" class="app-tree__menu">
      <div class="flex items-center grow">
        <template v-for="a in $props.menu['actions'].filter(i => i.position === 'left' || !i.position)">
          <tree-menu-item v-bind="a" :settings="$data.propSettings" @action="action"/>
        </template>
      </div>
      <div class="flex items-center">
        <template v-for="a in $props.menu['actions'].filter(i => i.position === 'right')">
          <tree-menu-item v-bind="a" :settings="$data.propSettings" @action="action"/>
        </template>
      </div>
    </div>

    <div class="app-tree__body">
      <div class="app-tree__root">
        <div v-if="!refData" class="text-center p-5">
          <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
        </div>

        <template v-else-if="refData?.length">
          <tree-node v-for="node in refData" v-bind="{ node, level: 1 }" @action="action"/>
        </template>

        <div v-else class="text-center p-5">
          {{ refData['message'] }}
        </div>
      </div>
    </div>

    <transition>
      <div v-if="$data.showContextMenu && $data.dataContextMenu.length" ref="ctx" class="app-tree__context-menu"
           :class="$data.classContextMenu">
        <template v-for="i in $data.dataContextMenu">
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

<style>
.app-tree {
  @apply flex flex-col overflow-hidden w-full h-full
}
.app-tree__body {
  @apply grow overflow-hidden bg-gray-700 rounded
}
.app-tree__body.focused {
  @apply ring-2 ring-inset ring-blue-500
}
.app-tree__root {
  @apply overflow-y-auto overflow-x-hidden p-1 h-full
}
.app-tree__context-menu {
  @apply fixed left-0 top-0 min-w-64 py-1 bg-white dark:text-gray-100 dark:bg-gray-700 rounded shadow-xl shadow-black/20
}
.app-tree__context-menu.app-tree__context-menu__position-left {
  @apply left-0 right-auto
}
.app-tree__context-menu.app-tree__context-menu__position-right {
  @apply left-auto right-0
}
.app-tree__context-menu__header {
  @apply px-4 pb-2
}
.app-tree__context-menu__split {
  @apply border-t my-1
}
.app-tree__context-menu__item {
  @apply px-4 py-0.5 hover:bg-blue-600 hover:text-white cursor-pointer
}
.app-tree__context-menu__item i {
  @apply mr-1
}
.app-tree__menu {
  @apply grow-0 flex relative z-10 px-0.5 py-1.5
}
.app-tree__menu-item {
  @apply relative
}
.app-tree__menu-item button {
  @apply flex justify-center items-center w-6 h-6 mx-0.5 p-0 border-0 focus:ring-0 text-gray-400 hover:text-gray-500 dark:text-gray-100 dark:hover:text-gray-100
}
.app-tree__menu-item .app-tree__context-menu {
  @apply absolute top-full m-1
}
.app-tree__node {
  @apply cursor-default
}
.app-tree__node > div, .app-tree__node > div > div {
  @apply relative
}
.app-tree__node .app-tree__node-item {
  @apply flex items-center pl-5 h-8 w-full rounded hover:bg-gray-200/60 dark:hover:bg-gray-600/70
}
.app-tree__node .app-tree__node-item.app-tree__node-active {
  @apply bg-gray-200/40 dark:bg-gray-600/50
}
.app-tree__node .app-tree__node-toggle {
  @apply absolute -ml-5 w-6 flex items-center justify-center cursor-pointer text-gray-300 hover:text-blue-500
}
.app-tree__node .app-tree__node-icon {
  @apply pl-1 cursor-pointer text-gray-400 dark:text-gray-300
}
.app-tree__node .app-tree__node-icon > i:first-of-type {
  @apply inline-block w-7 h-8 leading-8;
  font-size: 1.2rem;
}
.app-tree__node .app-tree__node-title {
  @apply truncate px-1 grow leading-8 cursor-pointer dark:text-gray-100
}
.app-tree__node .app-tree__node-append {
  @apply pr-1.5 text-sm opacity-80 whitespace-nowrap
}
.app-tree__node .app-tree__node-pagination {
  @apply flex items-center text-amber-400 cursor-pointer
}
.app-tree__node .app-tree__node-children {
  @apply flex flex-col
}
.app-tree__node .app-tree__node-selected .app-tree__node-title {
  @apply text-blue-500 dark:text-blue-300
}
.app-tree__node .app-tree__node-muted .app-tree__node-title {
  @apply italic opacity-60
}
.app-tree__node .app-tree__node-deleted .app-tree__node-title {
  @apply !text-rose-600 opacity-100 not-italic line-through
}
</style>
