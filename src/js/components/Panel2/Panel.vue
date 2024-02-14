<script>
import { h, reactive } from 'vue'
import draggable from 'vuedraggable'

export default {
  components: { draggable },
  __isStatic: true,
  name: 'Panel',
  emits: ['action', 'update:props', 'update:modelValue'],
  props: {
    id: {
      type: String,
      default: 'v-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
    },
    data: {
      type: Array,
      default: []
    },
    meta: Object,
    modelValue: null,
    columns: {
      type: Array,
      default: (props) => props?.meta?.columns ?? []
    },
    filters: {
      type: Array,
      default: (props) => props?.meta?.filters ?? []
    },
    url: String,
    route: {
      type: String,
      default: (props) => props?.meta?.route
    },
    draggable: {
      type: [Boolean, String],
      default: (props) => props?.meta?.draggable
    },
    history: [Boolean, String],
    rerender: Boolean
  },
  data () {
    const key = `panel.` + this.id.toLowerCase()

    return {
      keyStorage: key,
      propUrl: this.url ?? (this.$route?.['meta']?.url || (this.$route['path'])) ?? null,
      filterTimer: 0,
      settings: this.$store.getters.get(`Session.${key}`, {})
    }
  },
  mounted () {
    if (this.url) {
      this.get()
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
    get (query, data) {
      const url = this.$router.resolve(this.propUrl)
      const path = this.propUrl.split('?')[0]
      query = Object.assign(url.query, query || this.$route?.['query'] || {})

      this.$emit('update:props', {
        data: data,
        meta: data ? Object.assign({}, { pagination: this.meta['pagination'] }) : {}
      }, this)

      axios.get(path, {
        params: query
      }).then(({ data }) => {
        if (data.meta?.columns) {
          data.columns = data.meta.columns
        }

        if (data.meta?.filters) {
          data.filters = data.meta.filters
        }

        this.$emit('update:props', data)
      })
    },
    cells (item) {
      const items = []

      if (this.columns?.length) {
        for (const i in this.columns) {
          const style = this.columns[i].style

          if (style?.width) {
            delete style.width
          }

          items.push(h('td', {
            style,
            class: 'px-2 py-1 first:pl-6 last:pr-6'
          }, this.value(item, this.columns[i])))
        }
      } else {
        for (const i in item) {
          const style = item[i].style

          if (style?.width) {
            delete style.width
          }

          items.push(h(`td`, {
            style,
            class: 'px-2 py-1 first:pl-6 last:pr-6',
            innerHTML: item[i]
          }))
        }
      }

      return items
    },
    value (item, column) {
      const key = column.key ?? column.name

      if (/\./.test(key)) {
        return this.findValue(key.split('.'), item)
      }

      if (item[key]?.component) {
        return h(
            this.getComponent(item[key]),
            this.getComponentAttributes(item[key])
        )
      }

      const slots = []

      if (column.values) {
        slots.push(this.columnValues(item, column))
      } else if (column.actions) {
        for (const i in column.actions) {
          slots.push(h(`i`, {
            class: `mx-1 opacity-60 hover:opacity-80 ` + column.actions[i].icon,
            'data-tooltip': column.actions[i].help,
            onClick (event) {
              event.preventDefault()
              this.action(i, item, column.values ? item[i] : column)
            }
          }))
        }
      } else if ((item[key] ?? column) !== undefined) {
        if (item[key]) {
          slots.push(h(`span`, item[key]))
        } else if (column.icon) {
          slots.push(h(`i`, {
            class: column.icon
          }))
        }

        if (item[key + `.help`]) {
          slots.push(h(`i`, {
            class: `app-help`,
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
              if (item[i].toString() === j.toString()) {
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
      let value = ''

      if (!data) {
        return value
      }

      keys.forEach((key, index) => {
        if (data[key] !== undefined) {
          if (keys[index + 1]) {
            keys.shift()
            value = this.findValue(keys, data[key])
          } else {
            value = data[key] ?? ''
          }
        }
      })

      return value
    },
    getComponent (data) {
      return this.$root.$.appContext.components[data.component]
    },
    getComponentAttributes (data) {
      const attrs = reactive({ ...(data.attrs || {}) })
      attrs.key = data.model

      if (this.modelValue[data.model] !== undefined) {
        attrs.modelValue = this.modelValue[data.model]
      } else {
        attrs.modelValue = this.modelValue
      }

      attrs['onAction'] = (...args) => this.$emit('action', ...args)
      attrs['onUpdate:modelValue'] = (...args) => this.$emit('update:modelValue', ...args)

      return attrs
    },
    sortable (event, data) {
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
    toggleCategory (category) {
      if (!this.settings.closed) {
        this.settings.closed = []
      }

      let index = this.settings.closed.indexOf(category.id)

      if (index > -1) {
        this.settings.closed.splice(index, 1)
      } else {
        this.settings.closed.push(category.id)
      }

      this.$store.dispatch('set', { ['Session.' + this.keyStorage]: { closed: this.settings.closed } })
    },
    hasClosedCategory (category) {
      return this.settings?.closed?.includes(category.id)
    },
    pagination (url) {
      url = url.split('?')[1] ?? ''

      if (this.propUrl) {
        url = this.$router.resolve('?' + url)
        if (this.history) {
          if (this.rerender) {
            this.$emit(
                'action',
                'pushRouter',
                url
            )
          } else {
            this.$router.push(url).then(() => this.get(url.query, []))
          }
        } else {
          this.get(url.query, [])
        }
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
      }

      if (this.propUrl) {
        this.filterTimer = setTimeout(() => {
          const query = Object.assign({}, this.$route['query'] || {})
          if (value !== '') {
            query[name] = value
          } else {
            delete query[name]
          }

          delete query['page']

          if (this.history) {
            if (this.rerender) {
              this.$emit(
                  'action',
                  'pushRouter',
                  { query }
              )
            } else {
              this.$router.push({ query }).then(() => this.get(null, []))
            }
          } else {
            this.get(query)
          }
        }, delay)
      }
    },
    columnFilterClear () {
      if (this.propUrl) {
        if (this.history) {
          if (this.rerender) {
            this.$emit(
                'action',
                'pushRouter',
                { query: {} }
            )
          } else {
            this.$router.push({ query: {} }).then(() => this.get(null, []))
          }
        } else {
          this.get({})
        }
      }
    }
  }
}
</script>

<template>
  <div class="app-panel overflow-hidden flex flex-col grow mx-4 mb-4 rounded bg-white dark:bg-gray-750">
    <div v-if="data" class="app-panel__data grow overflow-auto">
      <table class="w-full" ref="table" :class="{ 'min-h-full': !data.length }">
        <thead v-if="columns?.length" class="sticky top-0 z-10 bg-slate-100 dark:bg-gray-600">
        <tr>
          <template v-for="column in columns">
            <th :style="{ width: column.width }">
              <div class="px-2 py-1 first:pl-6 last:pr-6 truncate" :style="{ minWidth: column.width }">
                {{ column.label ?? column.name ?? column.key ?? '' }}
              </div>
            </th>
          </template>
        </tr>
        <tr v-if="this.filters" class="app-panel__filters">
          <th v-for="f in getColumnFilters()">
            <div v-if="f" class="relative flex">

              <template v-if="f?.type === 'date'">
                <input type="date"
                       name="filter"
                       class="py-0 px-1 mx-0.5 h-6 border-none font-normal focus:ring-2"
                       :value="f.data.from"
                       :min="f.data.min"
                       :max="f.data.to"
                       @input="columnFilters($event, f)"
                       autocomplete="off">
                <input type="date"
                       name="filter"
                       class="py-0 px-1 mx-0.5 h-6 border-none font-normal focus:ring-2"
                       :value="f.data.to"
                       :min="f.data.from"
                       :max="f.data.max"
                       @input="columnFilters($event, f)"
                       autocomplete="off">
              </template>

              <select v-else-if="f?.data"
                      @input="columnFilters($event, f)"
                      class="py-0 pl-1 pr-6 mx-0.5 h-6 border-none font-normal focus:ring-2"
                      autocomplete="off">
                <option v-for="o in f.data" :value="o.key" :selected="o.selected">{{ o.value }}</option>
              </select>

              <template v-else>
                <input type="text"
                       name="filter"
                       class="py-0 pl-1 pr-6 mx-0.5 h-6 border-none font-normal focus:ring-2"
                       @input="columnFilters($event, f)"
                       :value="$route?.query?.[f.name]" :placeholder="f.placeholder ?? '...'"
                       autocomplete="off">
                <i v-if="$route?.query?.[f.name]"
                   class="fa fa-remove absolute top-1 right-2 text-rose-600 cursor-pointer"
                   @click="columnFilterClear()"/>
              </template>

            </div>
          </th>
        </tr>
        </thead>

        <tbody v-if="!data.length">
        <tr>
          <td :colspan="columns?.length || 1" class="text-center p-5">
            <div v-if="meta?.['message']">
              {{ meta?.['message'] }}
            </div>
            <i v-else
               class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
          </td>
        </tr>
        </tbody>

        <template v-for="category in (data[0]?.data ? data : [{ data, route, draggable }])">
          <tbody v-if="category.name && category.data.length">
          <tr class="app-panel__category" :class="{ closed: hasClosedCategory(category) }"
              @mousedown="toggleCategory(category)">
            <td :colspan="columns?.length || Object.values(category.data[0]).length">
              <span class="toggle">
                <i :class="[!hasClosedCategory(category) ? 'fa-square-minus' : 'fa-square-plus']"
                   class="far fa-fw mr-1"/>
                <span>{{ category.name }}</span>
                <span v-if="category.id" class="ml-1">({{ category.id }})</span>
              </span>
            </td>
          </tr>
          </tbody>

          <template v-if="category.data && !hasClosedCategory(category)">
            <tbody v-if="category.route || route">
            <router-link v-for="item in category.data"
                         :to="{ name: category.route || route, params: { id: item.id } }"
                         custom v-slot="{ navigate }">
              <tr @click="navigate" class="cursor-pointer hover:bg-blue-600/10 even:bg-slate-400/5"
                  :class="{ 'disabled' : item.disabled }">
                <template v-for="cell in cells(item)">
                  <component :is="cell"/>
                </template>
              </tr>
            </router-link>
            </tbody>

            <draggable v-else-if="category.draggable ?? draggable"
                       :list="category.data"
                       item-key="id"
                       tag="tbody"
                       @end="sortable($event, category.data)">
              <template #item="{ element: item }">
                <tr class="hover:bg-blue-600/10 even:bg-slate-400/5" :class="{ 'disabled' : item.disabled }">
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
            <tr v-for="item in category.data" class="hover:bg-blue-600/10 even:bg-slate-400/5">
              <template v-for="cell in cells(item)">
                <component :is="cell"/>
              </template>
            </tr>
            </tbody>
          </template>
        </template>

      </table>
    </div>

    <div v-else class="flex grow items-center justify-center text-center p-5 w-full">
      <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
    </div>

    <div v-if="meta?.['pagination']?.['prev'] || meta?.['pagination']?.['next']"
         class="app-panel__pagination p-4 grow-0 flex flex-row flex-wrap items-center select-none">
      <div class="basis-auto grow">
        <a :class="{ 'pointer-events-none opacity-50' : !meta['pagination']['prev'] }"
           class="btn-sm btn-gray transition"
           @click="pagination(meta['pagination']['prev'])">
          <i class="fa fa-angle-left fa-fw leading-[0]"/>
        </a>
        <a :class="{ 'pointer-events-none opacity-50' : !meta['pagination']['next'] }"
           class="btn-sm btn-gray ml-1 transition"
           @click="pagination(meta['pagination']['next'])">
          <i class="fa fa-angle-right fa-fw leading-[0]"/>
        </a>
      </div>
      <div class="basis-auto grow-0 whitespace-nowrap" v-if="meta['pagination']['info']">
        {{ meta['pagination']['info'] }}
      </div>
    </div>

  </div>
</template>
