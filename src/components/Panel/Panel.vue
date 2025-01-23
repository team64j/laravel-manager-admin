<script>
import { compile, h, reactive, toRaw, watch } from 'vue'
import draggable from 'vuedraggable'
import router from '../../router'
import store from '../../store'
import { uniqId } from '../../utils'
import { getValue } from '../../composables/value'

import('./Panel.css')

export default {
  components: { draggable },
  __isStatic: true,
  name: 'Panel',
  emits: ['action', 'update:props', 'update:modelValue'],
  props: {
    id: {
      type: String,
      default: uniqId()
    },
    modelValue: null,
    url: String,
    data: {
      type: Array,
      default (props) {
        return props.url ? [] : props.modelValue ?? []
      }
    },
    meta: Object,
    layout: Object,
    columns: {
      type: Array,
      default: (props) => props?.meta?.columns ?? []
    },
    filters: {
      type: Array,
      default: (props) => props?.meta?.filters ?? []
    },
    route: {
      type: [String, Object],
      default: (props) => props?.meta?.route
    },
    draggable: {
      type: [Boolean, String],
      default: (props) => props?.meta?.draggable
    },
    history: [Boolean, String],
    rerender: Boolean,
    contextMenu: Object,
    view: String,
    views: [Object, Array],
    currentRoute: Object
  },
  data () {
    const key = `panel.` + this.id.toLowerCase()

    return {
      keyStorage: key,
      filterTimer: 0,
      filterValues: {},
      settings: store.getters.get(`Session.${key}`, {}),
      idContextMenu: null,
      showContextMenu: false,
      dataContextMenu: [],
      classContextMenu: null,
      propView: this.view
    }
  },
  mounted () {
    if (this.url) {
      this.get()
    }

    if (this.history) {
      watch(
          () => this.currentRoute['params'][this.history],
          (a, b) => {
            a !== undefined && b !== undefined && b !== this.currentRoute['params'][this.history] && this.get({}, [])
          }
      )
    }

    document.addEventListener('click', () => {
      if (this.showContextMenu) {
        this.showContextMenu = false
      }
    })

    document.addEventListener('keydown', event => {
      if (this.keyStorage === store.getters.get('activePanel')) {
        if (event.ctrlKey && event.key === 'a') {
          event.preventDefault()

          this.data.forEach(i => {
            if (i.data) {
              i.data.forEach(j => this.selectRow(event, j))
            } else {
              this.selectRow(event, i)
            }
          })
        } else if (event.key === 'Escape') {
          this.data.forEach(i => {
            if (i.data) {
              i.data.forEach(j => j.__active = false)
            } else {
              i.__active = false
            }
          })
        }
      }
    })
  },
  computed: {
    propUrl () {
      return this.url ?? (this.currentRoute?.['meta']?.url || (this.currentRoute['path'])) ?? null
    }
  },
  methods: {
    action () {
      if (typeof this[arguments[0]] === 'function') {
        this[arguments[0]](...Array.from(arguments).splice(1))
      } else {
        this.$emit('action', ...arguments)
      }
    },
    key (data) {
      return data['id'] ?? data['key']
    },
    get (query, params) {
      const route = router.parse(this.propUrl)
      query = Object.assign(route.query, query || this.currentRoute?.['query'] || {})

      this.$emit('update:props', {
        data: params,
        meta: params ? Object.assign({}, { pagination: this.meta['pagination'] }) : {}
      }, this)

      if (this.$refs.data) {
        this.$refs.data.style.overflow = 'scroll'
      }

      this.$el.querySelectorAll('thead > tr > th').forEach(i => {
        i.style.maxWidth = i.clientWidth + 'px'
        i.style.minWidth = i.clientWidth + 'px'
      })

      axios.get(route.path, {
        params: query
      }).then(({ data }) => {
        const props = {
          data: data.data,
          meta: data.meta
        }

        if (data.meta?.columns) {
          props.columns = data.meta.columns
          delete data.meta.columns
        }

        if (data.meta?.filters) {
          props.filters = data.meta.filters
          delete data.meta.filters
        }

        if (this.$refs.data) {
          this.$refs.data.style.overflow = null
        }

        this.$el.querySelectorAll('thead > tr > th').forEach(i => {
          i.style.maxWidth = null
          i.style.minWidth = null
        })

        this.$emit('update:props', props)
      })
    },
    load (route, props) {
      if (this.history) {
        if (this.rerender) {
          this.$emit(
              'action',
              'pushRouter',
              route
          )
        } else {
          router.to(route)
          this.get(route.query, [])

          if (props) {
            this.$emit('update:props', props, this)
          }
        }
      } else {
        this.get(route.query, [])
      }
    },
    selectRow (event, item, route) {
      if (item.route) {
        route = item.route
      }

      if (route) {
        if (typeof route === 'object') {
          this.$emit('action', 'pushRouter', {
            ...route,
            params: item
          })
        } else {
          this.$emit('action', 'pushRouter', {
            path: route,
            params: item
          })
        }
      } else {
        store.dispatch('set', { activePanel: this.keyStorage })
        const column = this.columns?.find(i => i.selectable)

        if (column && item[column.component.attrs.keyValue] !== undefined) {
          const index = this.modelValue.findIndex(i => i === item[column.component.attrs.keyValue])

          if (index < 0) {
            this.modelValue.push(item[column.component.attrs.keyValue])
          } else {
            this.modelValue.splice(index, 1)
          }
        } else {
          if (!event.ctrlKey) {
            this.data.forEach(i => {
              if (i.data) {
                i.data.forEach(j => item.__key !== j.__key && (j['__active'] = false))
              } else {
                item.__key !== i.__key && (i['__active'] = false)
              }
            })
          }

          item['__active'] = !item['__active']
        }
      }
    },
    dblClickRow (event, item) {
      if (item['dbClick']) {
        this.$emit('action', item['dbClick'], item)
      }
    },
    cells (item) {
      const items = []

      if (typeof item === 'object') {
        if (!item.hasOwnProperty('__key')) {
          Object.defineProperty(item, '__key', {
            value: uniqId()
          })
        }

        if (!item['route'] && !item.hasOwnProperty('__active')) {
          Object.defineProperty(item, '__active', {
            value: false,
            writable: true
          })
        }
      }

      if (this.columns?.length) {
        for (const i in this.columns) {
          const style = this.columns[i].style

          items.push(h('td', {
            style
          }, this.value(item, this.columns[i])))
        }
      } else {
        for (const i in item) {
          const slots = []
          const style = item[i]?.style

          if (item[i] !== null) {
            slots.push(h(compile(item[i]?.toString())))
          }

          items.push(h(`td`, { style }, slots))
        }
      }

      return items
    },
    value (item, column) {
      const key = column.key ?? column.name

      if (/\./.test(key)) {
        return getValue(key, item)
      }

      if (item[key]?.component) {
        return this.getComponent(item[key])
      } else if (column.component) {
        const component = structuredClone(toRaw(column.component))

        if (component?.attrs?.['keyValue'] !== undefined) {
          component.attrs.value = item[component.attrs['keyValue']] ?? item
        }

        return this.getComponent(component)
      }

      const slots = []

      if (column.values) {
        slots.push(this.columnValues(item, column))
      } else if (column.actions) {
        for (const i in column.actions) {
          slots.push(h(`i`, {
            class: `mx-1 opacity-60 hover:opacity-80 ` + column.actions[i].icon,
            'data-tooltip': column.actions[i].help,
            onClick: (event) => {
              this.action(i, item, column.values ? item[i] : column)
              event.preventDefault()
              event.stopPropagation()
            }
          }))
        }
      } else if ((item[key] ?? column) !== undefined) {
        if (item[key] !== undefined) {
          if (column.html) {
            slots.push(h(compile(item[key])))
          } else {
            slots.push(h(`span`, item[key]))
          }
        } else if (item[`${key}.html`] !== undefined) {
          slots.push(h(compile(item[`${key}.html`])))
        } else if (column.icon) {
          slots.push(h(`i`, {
            class: column.icon
          }))
        }

        if (item[key + `.help`]) {
          slots.push(h(`i`, {
            class: `ml-2`,
            'data-tooltip': item[key + `.help`]
          }))
        }
      }

      return slots
    },
    columnValues (item, column) {
      if (typeof Object.values(column.values)[0] === 'object') {
        if (item[column.name || column.key]) {
          return h({ template: item[column.name || column.key] })
        } else {
          for (const i in column.values) {
            for (const j in column.values[i]) {
              if (item[i]?.toString() === j.toString()) {
                return h({ template: column.values[i][j] })
              }
            }
          }
        }
      } else {
        return h({ template: column.values[item[column.name]] ?? column.values?.[item[column.key]] })
      }
    },
    findValue (keys, data) {
      const key = keys[0]
      let value

      if (data?.[key] !== undefined) {
        if (keys[1] !== undefined) {
          keys.shift()
          value = this.findValue(keys, data[key])
        } else {
          value = data[key]
        }
      }

      return value
    },
    getComponent (data) {
      const component = this.$.root.appContext.components[data.component]

      const attrs = reactive({ ...(data.attrs || {}) })
      attrs.key = data.model

      if (component.props?.['currentRoute']) {
        attrs.currentRoute = this.currentRoute
      }

      if (this.modelValue?.[data.model] !== undefined) {
        attrs.modelValue = this.modelValue[data.model]
        attrs['onUpdate:modelValue'] = (value) => this.setDataValue(data.model.split('.'), value, this.modelValue, true)
      } else if (/\./.test(data.model)) {
        attrs.modelValue = this.findDataValue(data.model.split('.'), this.modelValue || this.$props)
        attrs['onUpdate:modelValue'] = (value) => this.setDataValue(data.model.split('.'), value, this.modelValue, true)
      } else {
        attrs.modelValue = this.modelValue
        attrs['onUpdate:modelValue'] = (...args) => this.$emit('update:modelValue', ...args, this.modelValue)
      }

      attrs['onAction'] = (...args) => this.$emit('action', ...args)

      return h(
          component,
          attrs
      )
    },
    sortable (data) {
      const draggable = data?.draggable || this.draggable

      if (typeof draggable === 'string') {
        (data?.data || data).forEach((i, k) => {
          if (i[draggable] !== undefined) {
            i[draggable] = k + 1
          }
        })
      }
      this.$emit('action', 'sortable', ...arguments)
    },
    updateModelValue () {
      this.$emit('update:modelValue', ...arguments)

      if (this.rerender) {
        // Обновляем весь компонент
        this.renderComponent = false
        this.$nextTick(() => {
          this.renderComponent = true
        })
      }
    },
    findDataValue (keys, data) {
      const key = keys[0]
      let value

      if (data[key] !== undefined) {
        if (keys[1] !== undefined) {
          keys.shift()
          value = this.findDataValue(keys, data[key])
        } else {
          value = data[key]
        }
      }

      return value
    },
    setDataValue (keys, value, data, first) {
      if (!first && data && data[keys[0]] === undefined) {
        data[keys[0]] = {}
      }

      keys.forEach((key, index) => {
        if (data[key] !== undefined) {
          if (keys[index + 1] !== undefined) {
            keys.shift()
            this.setDataValue(keys, value, data[key])
          } else {
            data[key] = value
          }
        }
      })
    },
    toggleCategory (category) {
      if (!this.settings.closed) {
        this.settings.closed = []
      }

      let index = this.settings.closed.indexOf(category['id'] ?? category['key'])

      if (index > -1) {
        this.settings.closed.splice(index, 1)
      } else {
        this.settings.closed.push(category['id'] ?? category['key'])
      }

      store.dispatch('set', { ['Session.' + this.keyStorage]: { closed: this.settings.closed } })
    },
    hasClosedCategory (category) {
      return this.settings?.closed?.includes(category['id'] ?? category['key'])
    },
    pagination (url) {
      url = url.split('?')[1] ?? ''

      if (this.propUrl) {
        url = router.parse('?' + url)
        this.load(url)
      } else {
        this.$emit('action', 'pagination', ...arguments)
      }
    },
    getColumnFilters () {
      const filters = []
      let propFilters = this.filters

      if (this.filters) {
        if (Array.isArray(propFilters)) {
          const keys = propFilters.map(i => i.name || i)
          const values = propFilters.map(i => typeof i === 'object' ? i : { name: i })
          propFilters = Object.fromEntries(keys.map((_, i) => [keys[i], values[i]]))
        }

        for (const i of this.columns) {
          if (propFilters[i.name]) {
            if (typeof propFilters[i.name] == 'boolean') {
              propFilters[i.name] = {
                name: i.name
              }
            }

            filters.push(propFilters[i.name])
          } else if (i.filter) {
            filters.push({ name: i.name })
          } else {
            filters.push(null)
          }
        }
      } else if (this.columns?.length) {
        for (const i of this.columns) {
          if (i.filter) {
            if (i.filter.data === undefined) {
              i.filter = {
                data: i.filter
              }
            }

            filters.push(i.filter)
          } else {
            filters.push(null)
          }
        }
      }

      return filters
    },
    columnFilters (event, filter) {
      clearTimeout(this.filterTimer)
      let value = event.target.value,
          name = filter.name,
          delay = event.target.tagName === 'INPUT' ? 300 : 0

      if (filter?.type === 'date' || filter?.type === 'datetime') {
        value = [
          event.target.parentElement.firstElementChild['value'],
          event.target.parentElement.lastElementChild['value']
        ]

        if (value[0] === '' || value[1] === '') {
          value = ''
        }
      } else if (filter.data && !filter.data.some(i => i.key === value) && filter.data.some(i => i.value === value)) {
        value = filter.data.find(i => i.value === value)['key']
      }

      if (this.propUrl) {
        this.filterTimer = setTimeout(() => {
          const query = Object.assign({}, this.currentRoute['query'] || {})
          if (value !== '') {
            query[name] = value
          } else {
            delete query[name]
          }

          delete query['page']

          this.filterValues = query
          this.load(router.parse({ query }))
        }, delay)
      }
    },
    columnFilterClear (name) {
      if (this.filterValues[name] !== undefined) {
        delete this.filterValues[name]
      }

      this.load(router.parse({ query: this.filterValues }))
    },
    buildContextMenu (event, node) {
      const contextMenu = node['contextMenu'] !== undefined ? node['contextMenu'] : this.contextMenu

      if (!contextMenu) {
        return
      }

      event.preventDefault()
      this.idContextMenu = this.key(node)
      this.showContextMenu = false
      this.dataContextMenu = []

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
        let top = event.clientY + 16
        let left = event.clientX + 16

        if (left + this.$refs.ctx.offsetWidth + 16 > window.innerWidth) {
          left -= this.$refs.ctx.offsetWidth + 16
        }

        if (top + this.$refs.ctx.offsetHeight + 16 > window.innerHeight) {
          top -= this.$refs.ctx.offsetHeight + 16
        }

        this.$refs.ctx.style.top = top + `px`
        this.$refs.ctx.style.left = left + `px`
      })
    },
    clickContextMenu (item) {
      if (item.to) {
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
    clickView (i) {
      this.propView = i.key
    }
  }
}
</script>

<template>
  <div class="app-panel" :class="{ ['app-panel__view-' + this.propView]: this.propView }">
    <div v-if="$slots['top']">
      <slot name="top"/>
    </div>

    <div v-if="views" class="flex justify-end px-5 pb-2" :class="{ 'border-b': this.propView === 'icon' }">
      <button v-for="i in views"
              type="button"
              :class="{ 'btn-blue': this.propView === i.key }"
              class="btn-sm ml-1 inline-flex items-center"
              @click="clickView(i)">
        <i v-if="i.icon" :class="[i.icon, i.value ? 'mr-1' : '']"/>
        <span>{{ i.value }}</span>
      </button>
    </div>

    <div v-if="data" class="app-panel__data" ref="data">
      <table ref="table" :class="{ 'min-h-full': !data.length }">
        <thead v-if="columns?.length && columns.filter(column => column.label).length">
        <tr>
          <template v-for="column in columns">
            <th :style="{ width: column.width }">
              <div :style="{ minWidth: column.width }">
                {{ column.label ?? '' }}
              </div>
            </th>
          </template>
        </tr>
        <tr v-if="this.filters" class="app-panel__filters">
          <th v-for="f in getColumnFilters()">
            <div v-if="f">

              <template v-if="f?.type === 'date'">
                <input type="date"
                       name="filter"
                       :value="f.data.from"
                       :min="f.data.min"
                       :max="f.data.to"
                       @input="columnFilters($event, f)"
                       autocomplete="off">
                <input type="date"
                       name="filter"
                       :value="f.data.to"
                       :min="f.data.from"
                       :max="f.data.max"
                       @input="columnFilters($event, f)"
                       autocomplete="off">
              </template>

              <select v-else-if="f?.data"
                      @input="columnFilters($event, f)"
                      autocomplete="off">
                <option v-for="o in f.data" :value="o.key" :selected="o.selected">{{ o.value }}</option>
              </select>

              <template v-else>
                <input type="text"
                       name="filter"
                       @input="columnFilters($event, f)"
                       :value="currentRoute['value']?.query?.[f.name] ?? filterValues?.[f.name]"
                       :placeholder="f.placeholder ?? '...'"
                       autocomplete="off">
                <i v-if="currentRoute['value']?.query?.[f.name] ?? filterValues?.[f.name]" class="fa fa-remove"
                   @click="columnFilterClear(f.name)"/>
              </template>

            </div>
          </th>
        </tr>
        </thead>

        <tbody v-if="!data.length">
        <tr class="pointer-events-none !max-w-full">
          <td :colspan="columns?.length || 1" class="text-center p-5">
            <div v-if="meta?.['message']">
              {{ meta?.['message'] }}
            </div>
            <i v-else
               class="inline-block rounded-full border-2 border-slate-200 border-r-blue-500 dark:border-white/20 dark:border-r-blue-500 h-5 w-5 animate-spin"/>
          </td>
        </tr>
        </tbody>

        <template v-for="category in (data[0]?.data ? data : [{ data, route, draggable }])">
          <tbody v-if="category.name && category.data.length" class="app-panel__category">
          <tr class="cursor-pointer hover:text-blue-500"
              :class="{ closed: this.hasClosedCategory(category) }"
              @dblclick="toggleCategory(category)"
              @contextmenu="buildContextMenu($event, category)">
            <td class="px-4 pt-3 pb-1 border-b-2 font-bold"
                :colspan="columns?.length || Object.values(category.data[0]).length">
              <span class="toggle select-none">
                <i :class="[!this.hasClosedCategory(category) ? 'fa-square-minus' : 'fa-square-plus']"
                   class="far fa-fw mr-1"
                   @mousedown.stop="toggleCategory(category)"/>
                <span>{{ category.name }}</span>
                <span v-if="category.id" class="ml-1">({{ category.id }})</span>
              </span>
            </td>
          </tr>
          </tbody>

          <template v-if="category.data && !this.hasClosedCategory(category)">
            <tbody v-if="category.route || route">
            <tr v-for="item in category.data"
                @click="selectRow($event, item, category.route || route)"
                @dblclick="dblClickRow($event, item)"
                class="cursor-pointer"
                :class="{ 'disabled' : item.disabled, 'active': item['__active'] }"
                @contextmenu="buildContextMenu($event, category)">
              <component v-for="cell in cells(item)" :is="cell"/>
            </tr>
            </tbody>

            <draggable v-else-if="category.draggable ?? draggable"
                       :list="category.data"
                       item-key="id"
                       tag="tbody"
                       @end="sortable(category.data)">
              <template #item="{ element: item }">
                <tr :class="{ 'disabled' : item.disabled, 'active': item['__active'] }"
                    @click="selectRow($event, item)"
                    @dblclick="dblClickRow($event, item)"
                    @contextmenu="buildContextMenu($event, item)">
                  <template v-for="cell in cells(item)">
                    <component :is="cell"
                               @action="action"
                               :model-value="modelValue"
                               @update:modelValue="updateModelValue"/>
                  </template>
                </tr>
              </template>
            </draggable>

            <tbody v-else>
            <tr v-for="item in category.data"
                @click="selectRow($event, item)"
                @dblclick="dblClickRow($event, item)"
                :class="{ 'disabled' : item.disabled, 'active': item['__active'], 'cursor-pointer': item.route }"
                @contextmenu="buildContextMenu($event, item)">
              <component v-for="cell in cells(item)" :is="cell"/>
            </tr>
            </tbody>
          </template>
        </template>

      </table>
    </div>

    <div v-else class="flex grow items-center justify-center text-center p-5 w-full">
      <i class="inline-block rounded-full border-2 border-slate-200 border-r-blue-500 dark:border-white/20 dark:border-r-blue-500 h-5 w-5 animate-spin"/>
    </div>

    <div v-if="meta?.['pagination']?.['prev'] || meta?.['pagination']?.['next']" class="app-panel__pagination">
      <div class="app-panel__pagination-arrows">
        <button :class="{ 'pointer-events-none opacity-50' : !meta['pagination']['prev'] }"
                class="btn-sm btn-gray"
                @click="pagination(meta['pagination']['prev'])">
          <i class="fa fa-angle-left fa-fw"/>
        </button>
        <button :class="{ 'pointer-events-none opacity-50' : !meta['pagination']['next'] }"
                class="btn-sm btn-gray ml-1"
                @click="pagination(meta['pagination']['next'])">
          <i class="fa fa-angle-right fa-fw"/>
        </button>
      </div>
      <div class="app-panel__pagination-info" v-if="meta['pagination']['info']">
        {{ meta['pagination']['info'] }}
      </div>
    </div>

    <transition>
      <div v-if="showContextMenu && dataContextMenu.length" ref="ctx" class="app-panel__context-menu"
           :class="classContextMenu">
        <template v-for="i in dataContextMenu">
          <div v-if="i.split" class="app-panel__context-menu__split"/>
          <div v-else-if="i.title && Object.values(i).length === 1" class="app-panel__context-menu__item">
            {{ i.title }}
          </div>
          <div v-else class="app-panel__context-menu__item" @mousedown="clickContextMenu(i)">
            <i v-if="i.icon" :class="i.icon" class="fa fa-fw"/>
            {{ i.title }}
          </div>
        </template>
      </div>
    </transition>

  </div>
</template>
