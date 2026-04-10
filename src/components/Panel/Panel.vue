<script>
import { compile, defineAsyncComponent, h, reactive, toRaw, watch } from 'vue'
import router from '@/router'
import store from '@/store'
import { uniqId } from '@/utils'
import { getValue } from '@/composables'

import('./Panel.css')

export default {
  components: {
    draggable: defineAsyncComponent(() => import('vuedraggable')),
    Input: defineAsyncComponent(() => import('@/components/Input/Input.vue')),
    Button: defineAsyncComponent(() => import('@/components/Button/Button.vue')),
    Select: defineAsyncComponent(() => import('@/components/Select/Select.vue')),
    Datetime: defineAsyncComponent(() => import('@/components/Datetime/Datetime.vue')),
  },
  __isStatic: true,
  name: 'Panel',
  emits: ['action', 'update:props', 'update:modelValue'],
  props: {
    id: {
      type: String,
      default: uniqId(),
    },
    modelValue: null,
    url: String,
    data: {
      type: Array,
      default (props) {
        return props.url ? [] : props.modelValue ?? []
      },
    },
    meta: Object,
    layout: Object,
    columns: {
      type: Array,
      default: (props) => props?.meta?.columns ?? [],
    },
    filters: {
      type: Array,
      default: (props) => props?.meta?.filters ?? [],
    },
    route: {
      type: [String, Object],
      default: (props) => props?.meta?.route,
    },
    draggable: {
      type: [Boolean, String],
      default: (props) => props?.meta?.draggable,
    },
    history: [Boolean, String],
    rerender: Boolean,
    contextMenu: Object,
    view: String,
    views: [Object, Array],
    currentRoute: Object,
  },
  data () {
    const key = `panel.` + this.id.toLowerCase()

    return {
      loading: false,
      keyStorage: key,
      filterTimer: 0,
      filterValues: { ...this.currentRoute.query },
      settings: store.getters.get(`Session.${key}`, {}),
      idContextMenu: null,
      showContextMenu: false,
      dataContextMenu: [],
      classContextMenu: null,
      propView: this.view,
      sorting: {},
    }
  },
  mounted () {
    if (this.url) {
      this.get()
    }

    if (this.history) {
      watch(
          () => router.currentRoute.value,
          (a, b) => {
            a['path'] === b['path'] &&
            a['query'][this.history] !== b['query'][this.history] &&
            this.get(a['query'], [])
          },
          { deep: true },
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
              i.data.forEach(j => j['@active'] = false)
            } else {
              i['@active'] = false
            }
          })
        }
      }
    })

    if (this.$el.parentElement.classList.contains('app-tabs__page')) {
      this.$el.parentElement.childElementCount === 1 && this.$el.parentElement.classList.add('!p-0')
    }
  },
  computed: {
    propUrl () {
      return this.url ?? this.currentRoute['path'] ?? null
    },
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
      this.loading = true
      const route = router.parse(this.currentRoute?.['meta']?.['url'] || this.propUrl)
      query = Object.assign(route.query, this.currentRoute?.query || {}, query)

      this.$emit('update:props', {
        data: params,
        meta: params ? Object.assign({}, { ...this.meta }) : {},
      }, this)

      if (this.$refs.data) {
        this.$refs.data.style.height = this.$refs.data.offsetHeight + 'px'
      }

      this.$el.querySelectorAll('thead > tr > th').forEach(i => {
        i.style.maxWidth = i.clientWidth + 'px'
        i.style.minWidth = i.clientWidth + 'px'
      })

      axios({
        method: route?.['meta']?.['method']?.toLowerCase() ?? 'get',
        url: route.path,
        params: route.query,
        data: Object.assign({}, route.query),
      }).then(({ data }) => {
        const props = {
          data: data.data,
          meta: data.meta,
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

        this.$el.querySelector('.app-panel__data').style.height = null
      }).finally(() => {
        this.loading = false
      })
    },
    load (route, props) {
      if (this.history) {
        if (this.rerender) {
          this.$emit(
              'action',
              'pushRouter',
              route,
          )
        } else {
          router.to(route)
          this.get(route.query, [])

          // if (props) {
          //   this.$emit('update:props', props, this)
          // }
        }
      } else {
        this.get(route.query, [])
      }
    },
    selectRow (event, item, route) {
      if (item['@disabled']) {
        return
      }

      if (item.route) {
        route = item.route
      }

      if (route) {
        if (typeof route === 'object') {
          this.$emit('action', 'pushRouter', {
            ...route,
            params: item,
          })
        } else {
          this.$emit('action', 'pushRouter', {
            path: route,
            params: item,
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
        }
      }

      if (!event.ctrlKey) {
        this.data.forEach(i => {
          if (i.data) {
            i.data.forEach(j => item['@key'] !== j['@key'] && (j['@active'] = false))
          } else {
            item['@key'] !== i['@key'] && (i['@active'] = false)
          }
        })
      }

      item['@active'] = !item['@active']
    },
    dblClickRow (item) {
      if (item['dbClick']) {
        this.$emit('action', item['dbClick'], item)
      }
    },
    cells (item, index) {
      const items = []

      if (typeof item === 'object') {
        if (!item.hasOwnProperty('@key')) {
          Object.defineProperty(item, '@key', {
            value: uniqId(),
          })
        }

        if (!item['route'] && !item.hasOwnProperty('@active')) {
          Object.defineProperty(item, '@active', {
            value: false,
            writable: true,
          })
        }
      }

      if (this.columns?.length) {
        for (const i in this.columns) {
          const style = this.columns[i].style

          items.push(h('td', {
            style,
          }, this.value(item, this.columns[i], index)))
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
    value (item, column, index) {
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
          component.attrs.index = index
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
            },
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
            class: column.icon,
          }))
        }

        if (item[key + `.help`]) {
          slots.push(h(`i`, {
            class: `ml-2`,
            'data-tooltip': item[key + `.help`],
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
        attrs['onUpdate:modelValue'] = (value) => {
          this.setDataValue(data.model.split('.'), value, this.modelValue, true)
          this.$emit('update:modelValue', value, this)
        }
      } else if (/\./.test(data.model)) {
        attrs.modelValue = this.findDataValue(data.model.split('.'), this.modelValue || this.$props)
        attrs['onUpdate:modelValue'] = (value) => {
          this.setDataValue(data.model.split('.'), value, this.modelValue, true)
          this.$emit('update:modelValue', value, this)
        }
      } else {
        attrs.modelValue = this.modelValue
        attrs['onUpdate:modelValue'] = (...args) => {
          this.$emit('update:modelValue', ...args, this.modelValue)
        }
      }

      attrs['onAction'] = (...args) => this.$emit('action', ...args)

      return h(
          component,
          attrs,
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
      if (this.propUrl) {
        this.load(Object.assign({}, router.parse(this.propUrl), { query: router.parse(url).query }))
      } else {
        this.$emit('action', 'pagination', ...arguments)
      }
    },
    getFilters () {
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
                name: i.name,
              }
            }

            filters.push(propFilters[i.name])
          } else if (i.filter) {
            filters.push({ name: i.name })
          } else {
            filters.push(null)
          }
        }
      }

      return filters
    },
    onUpdateFilters (value, ctx, filter) {
      clearTimeout(this.filterTimer)

      let name = filter.name,
          delay = 300

      if (filter?.type === 'date' || filter?.type === 'datetime') {
        value = [value]
      }

      // if (filter?.type === 'date' || filter?.type === 'datetime') {
      //   value = [
      //     event.target.parentElement.firstElementChild['value'],
      //     event.target.parentElement.lastElementChild['value']
      //   ]
      //
      //   if (value[0] === '' || value[1] === '') {
      //     value = ''
      //   }
      // } else if (filter.data && !filter.data.some(i => i.key === value) && filter.data.some(i => i.value === value)) {
      //   value = filter.data.find(i => i.value === value)['key']
      // }

      if (this.propUrl) {
        this.filterTimer = setTimeout(() => {
          if (value === '') {
            delete this.filterValues[name]
          } else {
            this.filterValues[name] = value
          }

          this.load(router.parse({ query: this.filterValues }))
        }, delay)
      }
    },
    onSorting (order, dir) {
      const query = { ...router.currentRoute.value.query }

      if (this.meta?.['sorting']?.[order] === dir) {
        delete query.order
        delete query.dir
      } else {
        query.order = order
        query.dir = dir
      }

      this.load(router.parse({ query }))
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
                name: i.name,
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
                data: i.filter,
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
    columnFilters (value, filter) {
      clearTimeout(this.filterTimer)
      let name = filter.name,
          delay = 300

      if (filter?.type === 'date' || filter?.type === 'datetime') {
        value = [
          event.target.parentElement.firstElementChild['value'],
          event.target.parentElement.lastElementChild['value'],
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
            split: true,
          })
        } else {
          this.dataContextMenu.push({
            title: action.title,
            icon: action.icon,
            to: action.to,
            node,
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
          axios[route['meta']['method'].toLowerCase() ?? 'head'](router.parse({ ...item.to }).fullPath).then(r => {
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
    },
  },
}
</script>

<template>
  <div class="app-panel" :class="{ ['app-panel__view-' + this.propView]: this.propView }">
    <div v-if="$slots['top']">
      <slot name="top"/>
    </div>

    <div v-if="views" class="flex justify-end px-5 pb-2" :class="{ 'border-b': this.propView === 'icon' }">
      <Button v-for="i in views"
              type="button"
              :class="{ 'btn-blue': this.propView === i.key }"
              class="ml-1 inline-flex items-center"
              @click="clickView(i)">
        <i v-if="i.icon" :class="[i.icon, i.value ? 'mr-1' : '']"/>
        <span>{{ i.value }}</span>
      </Button>
    </div>

    <div v-if="data" class="app-panel__data" ref="data">
      <table ref="table" :class="{ 'min-h-full': !data.length }">
        <thead v-if="columns?.length && columns.filter(column => column.label).length">
        <tr>
          <template v-for="column in columns">
            <th :style="{ width: column.width }">
              <div v-if="column.label" :style="{ minWidth: column.width }" class="relative">
                {{ column.label }}
                <div v-if="column.sort" class="app-panel__sorter absolute top-0 !px-0 right-0 flex flex-col text-xs">
                  <i class="fa hover:text-blue-500 hover:opacity-100 transition"
                     :class="[
                         `fa-sort-amount-` + (meta?.['sorting']?.[column.name] || 'asc'),
                         meta?.['sorting']?.[column.name] ? 'text-blue-500' : 'opacity-60'
                     ]"
                     @click="onSorting(column.name, meta?.['sorting']?.[column.name] === 'asc' ? 'desc' : 'asc')"
                  />
                </div>
                <!--                <div v-if="column.sort" class="app-panel__sorter absolute top-0 !px-0 right-0 flex flex-col text-xs">
                                  <i class="fa fa-angle-up px-2 hover:text-blue-500 hover:opacity-100 transition"
                                     :class="[meta?.['sorting']?.[column.name] === 'asc' ? 'text-blue-500 opacity-100' : 'opacity-60']"
                                     @click="onSorting(column.name, 'asc')"/>
                                  <i class="fa fa-angle-down px-2 hover:text-blue-500 hover:!opacity-100 transition"
                                     :class="[meta?.['sorting']?.[column.name] === 'desc' ? 'text-blue-500 opacity-100' : 'opacity-60']"
                                     @click="onSorting(column.name, 'desc')"/>
                                </div>-->
              </div>
            </th>
          </template>
        </tr>
        <tr v-if="this.filters" class="app-panel__filters">
          <th v-for="f in getFilters()">
            <div v-if="f">
              <template v-if="f?.type === 'date'">
                <Input type="date"
                       :value="filterValues[f.name]?.from || f.data.from"
                       :min="f.data.min"
                       :max="f.data.to"
                       input-class="input-sm"
                       @action="action"
                       @update:modelValue="(...args) => onUpdateFilters(...args, f)"/>

                <Input type="date"
                       :value="filterValues[f.name]?.to || f.data.to"
                       input-class="input-sm"
                       :min="f.data.from"
                       :max="f.data.max"
                       @action="action"
                       @update:modelValue="(...args) => onUpdateFilters(...args, f)"/>
              </template>

              <Select v-else-if="f?.data"
                      v-model="filterValues[f.name]"
                      :data="f.data"
                      input-class="input-sm"
                      @update:modelValue="(...args) => onUpdateFilters(...args, f)"/>

              <Input v-else
                     v-model="filterValues[f.name]"
                     :clear="true"
                     class="w-full"
                     input-class="input-sm"
                     :placeholder="f.placeholder ?? '...'"
                     @update:modelValue="(...args) => onUpdateFilters(...args, f)"/>
            </div>
          </th>
          <!--          <th v-for="f in getColumnFilters()">
                      <div v-if="f">

                        <template v-if="f?.type === 'date'">
                          <input type="date"
                                 name="filter"
                                 :value="f.data.from"
                                 :min="f.data.min"
                                 :max="f.data.to"
                                 @input="columnFilters($event, f)"
                                 autocomplete="off"/>
                          <input type="date"
                                 name="filter"
                                 :value="f.data.to"
                                 :min="f.data.from"
                                 :max="f.data.max"
                                 @input="columnFilters($event, f)"
                                 autocomplete="off"/>
                        </template>

                        <select v-else-if="f?.data"
                                @input="columnFilters($event, f)"
                                autocomplete="off">
                          <option v-for="o in f.data" :value="o.key" :selected="o.selected">{{ o.value }}</option>
                        </select>

                        <template v-else>
                          <Input
                              input-class="input-sm"
                              :placeholder="f.placeholder ?? '...'"
                              v-model="filterValues[f.name]"
                              :clear="true"
                              @update:modelValue="columnFilters($event, f)"/>

                          &lt;!&ndash;                <input type="text"
                                                 name="filter"
                                                 @input="columnFilters($event, f)"
                                                 :value="currentRoute['value']?.query?.[f.name] ?? filterValues?.[f.name]"
                                                 :placeholder="f.placeholder ?? '...'"
                                                 autocomplete="off">
                                          <i v-if="currentRoute['value']?.query?.[f.name] ?? filterValues?.[f.name]" class="fa fa-remove"
                                             @click="columnFilterClear(f.name)"/>&ndash;&gt;
                        </template>

                      </div>
                    </th>-->
        </tr>
        </thead>

        <tbody v-if="!data || loading">
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
            <tr v-for="(item, i) in category.data"
                @click="selectRow($event, item, category.route || route)"
                @dblclick="dblClickRow(item)"
                :class="{
                  'disabled' : item['@disabled'],
                  'deleted' : item['@deleted'],
                  'active': item['@active'],
                  'cursor-pointer': !item['@disabled']
                }"
                @contextmenu="buildContextMenu($event, category)">
              <component v-for="cell in cells(item, i)" :is="cell"/>
            </tr>
            </tbody>

            <draggable v-else-if="category.draggable ?? draggable"
                       :list="category.data"
                       item-key="id"
                       tag="tbody"
                       @end="sortable(category.data)">
              <template #item="{ element: item, index }">
                <tr :class="{
                  'disabled' : item['@disabled'],
                  'deleted' : item['@deleted'],
                  'active': item['@active']
                }"
                    @click="selectRow($event, item)"
                    @dblclick="dblClickRow(item)"
                    @contextmenu="buildContextMenu($event, item)">
                  <template v-for="cell in cells(item, index)">
                    <component :is="cell"
                               @action="action"
                               :model-value="modelValue"
                               @update:modelValue="updateModelValue"/>
                  </template>
                </tr>
              </template>
            </draggable>

            <tbody v-else>
            <tr v-for="(item, i) in category.data"
                @click="selectRow($event, item)"
                @dblclick="dblClickRow(item)"
                :class="{
                  'disabled' : item['@disabled'],
                  'deleted' : item['@deleted'],
                  'active': item['@active'],
                  'cursor-pointer': item.route
                }"
                @contextmenu="buildContextMenu($event, item)">
              <component v-for="cell in cells(item, i)" :is="cell"/>
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
        <Button class="btn-sm btn-gray"
                :disabled="!meta['pagination']['prev']"
                @click="pagination(meta['pagination']['prev'])">
          <i class="fa fa-angle-left fa-fw"/>
        </Button>
        <Button class="btn-sm btn-gray ml-1"
                :disabled="!meta['pagination']['next']"
                @click="pagination(meta['pagination']['next'])">
          <i class="fa fa-angle-right fa-fw"/>
        </Button>
      </div>
      <div class="app-panel__pagination-info" v-if="meta['pagination']['info']">
        {{ meta['pagination']['info'] }}
      </div>
    </div>

    <div v-if="$slots['bottom']">
      <slot name="bottom"/>
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
