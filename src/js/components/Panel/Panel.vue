<template>
  <div v-if="propData && renderComponent" class="app-panel"
       :class="[$props.class, isPagination ? '' : 'app-panel__without-pagination']"
       :id="idPanel">
    <slot name="header"/>

    <div v-if="$slots.top || propFilter" class="flex justify-between px-2 grow-0">
      <div v-if="$slots.top" class="grow-0 pt-3 px-2" :class="{ 'pb-3': $slots.top }">
        <slot name="top"/>
      </div>
      <div v-if="propFilter === true" class="app-panel__filter pt-3 px-2 pb-3">
        <input type="text"
               name="filter"
               class="rounded"
               placeholder="filter ..."
               autocomplete="off"
               :class="{ 'active': currentRoute?.query?.filter }"
               :value="filterValue"
               @keyup="setFilter">
        <i class="fa fa-circle-xmark mr-2" @click="clearFilter"/>
      </div>
    </div>

    <div v-if="!propData" class="text-center p-5 w-full">
      <app-loader-icon/>
    </div>

    <div v-else class="app-panel__data" :class="dataClass">
      <table ref="data">

        <thead v-if="propColumns && propColumns.length">
        <tr class="app-panel__columns">
          <th v-for="(column, index) in propColumns" :style="{ width: column['width'] }"
              :class="{ 'app-panel__sortable': column['sort'] }">
            <div @click="columnSort(column)" :class="{ 'active': $route['query']['order'] === column.name }">
              <span>{{ column.label ?? column.name ?? '' }}</span>
              <i v-if="column.sort"
                 :class="[
                     $route['query']['order'] === column.name ?
                     ($route['query']['dir'] === 'desc' ?
                     'fa-sort-down' : 'fa-sort-up') : 'fa-sort'
                     ]"
                 class="fa fa-fw app-panel__column-sort"/>
              <div class="app-panel__splitter" :data-index="index"
                   @mouseenter="columnEnter"
                   @mousedown="columnDown"
                   @mouseout="columnOut"/>
            </div>
          </th>
        </tr>
        <tr v-if="hasColumnFilters()" class="app-panel__filters">
          <th v-for="f in getColumnFilters()">
            <div v-if="f">
              <template v-if="f?.type === 'date'">
                <input type="date"
                       name="filter"
                       :value="f.data.from"
                       :min="f.data.min"
                       :max="f.data.to"
                       @input="columnFilters($event, f)">
                <input type="date"
                       name="filter"
                       :value="f.data.to"
                       :min="f.data.from"
                       :max="f.data.max"
                       @input="columnFilters($event, f)">
              </template>
              <select v-else-if="f?.data"
                      @input="columnFilters($event, f)">
                <option v-for="o in f.data" :value="o.key" :selected="o.selected">{{ o.value }}</option>
              </select>
              <input v-else type="text" name="filter" @input="columnFilters($event, f)"
                     :value="$route?.query?.[f.name]" :placeholder="f.placeholder ?? '...'">
            </div>
          </th>
        </tr>
        </thead>

        <template v-if="propData.length && !propData[0]?.data">
          <tbody v-if="propRoute">
          <router-link v-for="item in propData" :to="{ name: propRoute, params: { id: item.id } }"
                       custom v-slot="{ navigate }">
            <tr @click="navigate" class="cursor-pointer" :class="{ 'disabled' : item.disabled }">
              <panel-cell
                  :columns="propColumns"
                  :category="propData"
                  :model-value="modelValue"
                  :item="item"
                  @action="action"
                  @update:modelValue="updateModelValue"/>
            </tr>
          </router-link>
          </tbody>

          <draggable v-else-if="propDraggable"
                     :list="propData"
                     item-key="id"
                     tag="tbody"
                     @end="sortable($event, propData)">
            <template #item="{ element: item }">
              <tr :class="{ 'disabled' : item.disabled }">
                <panel-cell :columns="propColumns"
                            :category="propData"
                            :model-value="modelValue"
                            :item="item"
                            @action="action"
                            @update:modelValue="updateModelValue"/>
              </tr>
            </template>
          </draggable>

          <tbody v-else>
          <tr v-for="item in propData"
              :class="{ 'disabled' : item.disabled, 'active': item['@active'] }"
              @click="selectRow(item, propData, $event)">
            <panel-cell
                :columns="propColumns"
                :category="propData"
                :model-value="modelValue"
                :item="item"
                @action="action"
                @update:modelValue="updateModelValue"/>
          </tr>
          </tbody>
        </template>

        <template v-else-if="propData.length">
          <template v-for="category in propData">
            <tbody v-if="category.name && category.data.length">
            <tr class="app-panel__category"
                :class="{ closed: category.closed }"
                @mousedown="toggleCategory(category)">
              <td :colspan="propColumns && propColumns.length || Object.values(category.data[0]).length">
              <span class="toggle">
                <i :class="[!category.closed ? 'fa-square-minus' : 'fa-square-plus']" class="far fa-fw mr-1"/>
                <span>{{ category.name }}</span>
                <span v-if="category.id" class="ml-1">({{ category.id }})</span>
              </span>
              </td>
            </tr>
            </tbody>

            <template v-if="category.data && !category.closed">

              <tbody v-if="propRoute">
              <router-link v-for="item in category.data" :to="{ name: propRoute, params: { id: item.id } }"
                           custom v-slot="{ navigate }">
                <tr @click="navigate" class="cursor-pointer" :class="{ 'disabled' : item.disabled }">
                  <panel-cell
                      :columns="propColumns"
                      :category="category"
                      :model-value="modelValue"
                      :item="item"
                      @action="action"
                      @update:modelValue="updateModelValue"/>
                </tr>
              </router-link>
              </tbody>

              <draggable v-else-if="category.draggable"
                         :list="category.data"
                         item-key="id"
                         tag="tbody"
                         @end="sortable($event, category)">
                <template #item="{ element: item }">
                  <tr :class="{ 'disabled' : item.disabled, 'active': item['@active'] }"
                      @click="selectRow(item, category.data, $event)">
                    <panel-cell
                        :columns="propColumns"
                        :category="category"
                        :model-value="modelValue"
                        :item="item"
                        @action="action"
                        @update:modelValue="updateModelValue"/>
                  </tr>
                </template>
              </draggable>

              <tbody v-else>
              <tr v-for="item in category.data"
                  :class="{ 'disabled' : item.disabled, 'active': item['@active'] }"
                  @click="selectRow(item, category.data, $event)">
                <panel-cell
                    :columns="propColumns"
                    :category="category"
                    :model-value="modelValue"
                    :item="item"
                    @action="action"
                    @update:modelValue="updateModelValue"/>
              </tr>
              </tbody>

            </template>
          </template>
        </template>

        <tbody v-else>
        <tr>
          <td class="!p-5 text-center" :colspan="propColumns.length">
            <div v-if="!propData?.length && loaded">
              {{ propMeta?.message }}
            </div>
            <div v-else>
              <app-loader-icon/>
            </div>
          </td>
        </tr>
        </tbody>

      </table>
      <div class="app-panel__data-mask" @mouseup="columnUp" @touchend="columnUp" @mousemove="columnMove" @touchmove="columnMove"/>
    </div>

    <panel-pagination v-if="isPagination" :data="propMeta['pagination']" @action="action"/>

  </div>
  <div v-else class="text-center p-5 w-full">
    <app-loader-icon/>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import PanelCell from './PanelCell'
import PanelPagination from './PanelPagination'
import AppLoaderIcon from '../Layout/LoaderIcon.vue'

let filterTimer = 0

export default {
  //__isStatic: true,
  name: 'Panel',
  components: { draggable, PanelCell, PanelPagination, AppLoaderIcon },

  props: {
    currentRoute: Object,
    modelValue: null,
    data: {
      type: [null, Object],
      default: null
    },
    meta: {
      type: [null, Object],
      default: null
    },
    route: {
      type: String
    },
    id: {
      type: String
    },
    class: {
      type: [String, Array, Object]
    },
    dataClass: {
      type: [String, Array, Object]
    },
    rerender: {
      default: false
    },
    draggable: [Boolean, String],
    history: [Boolean, String],
    url: String,
    columns: Array,
    filter: Boolean,
    filters: Array
  },

  computed: {
    isPagination () {
      return !(!this.propMeta?.['pagination']?.['prev'] && !this.propMeta?.['pagination']?.['next'])
    }
  },

  data () {
    const id = this.id ?? `panel`

    this.keyStorage = 'panel.' + id.toLowerCase()

    return {
      propData: this.data || null,
      propMeta: this.meta || null,
      propDraggable: this.meta?.draggable || this.draggable,
      propColumns: this.columns || this.meta?.columns || null,
      propFilter: this.filter || this.meta?.filter || null,
      propFilters: this.filters || this.meta?.filters || null,
      propRoute: this.route || this?.meta?.route || null,
      propUrl: this.url ?? (this.$route?.['meta']?.url || (this.$route['path'])) ?? null,
      x: 0,
      idPanel: id,
      filterValue: null,
      columnSplitter: null,
      renderComponent: true,
      loaded: true
    }
  },

  watch: {
    data (data) {
      if (this.propUrl) {
        this.propData = data
      } else {
        this.setColumnsSettings()
      }

      if (data?.columns && !this.propColumns) {
        this.propColumns = data.columns
      }
    },
    meta (data) {
      this.propMeta = data
    },
    propData () {
      this.setColumnsSettings()
    },
  },

  created () {
    this.filterValue = this.currentRoute?.['query']?.['filter']

    if (this.url) {
      this.get()
    }

    this.setColumnsSettings()
  },

  updated () {
    this.filterValue = this.currentRoute?.['query']?.['filter']
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

      query = Object.assign(url.query, query || this.currentRoute?.['query'] || {})

      if (data) {
        this.propData = []
        this.loaded = false
      } else {
        if (this.propData !== undefined) {
          this.propData = null
        }
      }

      if (this.propMeta?.pagination) {
        this.propMeta.pagination = null
      }

      axios.get(path, {
        params: query
      }).then(({ data }) => {
        this.loaded = true
        this.propData = data.data || data.data?.data
        this.propMeta = data.meta
        this.propColumns = data.meta?.columns || data.data?.data?.data?.columns || this.propColumns
        this.propFilter = (data.meta?.hasOwnProperty('filter') && data?.meta.filter) ||
            (data.data?.data?.hasOwnProperty('filter') && data.data?.data?.filter) || this.propFilter
        this.propFilters = data.meta?.filters || data.data?.data?.filters || this.propFilters
        this.propRoute = data.meta?.route || data.data?.data?.route || this.propRoute
      })
    },

    setColumnsSettings () {
      const settings = this.$store.getters['Storage/get'](this.keyStorage, {})
      const closed = settings.closed ?? []
      const width = settings.width ?? {}

      if (Array.isArray(this.propData)) {
        this.propData.map(category => {
          if (category.data) {
            const index = closed.indexOf(category.id)
            category.closed = index > -1
          }
        })
      }

      if (this.propColumns) {
        this.propColumns.map((column, index) => {
          if (width[index]) {
            column.width = width[index]
          }
        })
      }
    },

    pagination (url) {
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

    toggleCategory (category) {
      category.closed = !category.closed

      let closed = this.$store.getters['Storage/get'](this.keyStorage, {})?.['closed'] ?? []
      let index = closed.indexOf(category.id)

      if (category.closed) {
        !(index > -1) && closed.push(category.id)
      } else {
        index > -1 && closed.splice(index, 1)
      }

      this.$store.dispatch('Storage/set', [this.keyStorage, { closed }])
    },

    columnEnter (event) {
      this.columnSplitter = event.target
      this.columnSplitter.style.height = this.$refs.data.scrollHeight - 1 + 'px'
    },

    columnOut (event) {
      if (!this.$el.classList.contains('app-panel__data-resize')) {
        this.columnSplitter = event.target
        this.columnSplitter.style.height = null
      }
    },

    columnUp (event, reset) {
      this.$el.classList.remove('app-panel__data-resize')
      this.$el.querySelectorAll('.app-panel__column-resize').forEach(el => el.classList.remove('app-panel__column-resize'))
      const th = this.columnSplitter.closest('th'),
          w = th.offsetWidth - parseInt(this.columnSplitter.style.marginRight),
          width = this.$store.getters['Storage/get'](this.keyStorage, {})?.['width'] ?? {},
          index = this.columnSplitter.dataset.index

      this.columnSplitter.style.marginRight = null
      this.columnSplitter.style.height = null

      if (reset) {
        if (th.dataset.width) {
          th.style.width = th.dataset.width
          delete th.dataset.width
        } else {
          th.style.width = null
        }
        width[index] && delete width[index]
      } else {
        if (!th.dataset.width) {
          th.dataset.width = th.style.width
        }
        th.style.width = w + 'px'
        width[index] = w + 'px'
      }

      this.$store.dispatch('Storage/set', [this.keyStorage, { width }])
      document.onselectstart = () => null
    },

    columnDown (event) {
      this.columnSplitter = event.target
      this.x = event.clientX
      this.$el.classList.add('app-panel__data-resize')
      this.columnSplitter.closest('th').classList.add('app-panel__column-resize')
      this.columnSplitter.style.height = this.$refs.data.offsetHeight + 'px'
      document.onselectstart = () => false
    },

    columnMove (event) {
      const x = this.x - event.clientX

      if (x > this.columnSplitter.parentElement.offsetWidth) {
        this.columnUp(event, true)
        document.onselectstart = () => false
      } else {
        this.columnSplitter.style.marginRight = x + 'px'
      }
    },

    columnSort (column) {
      if (!column.sort) {
        return
      }

      const dir = this.$route['query']['dir'] === 'asc' ? 'desc' : 'asc'

      if (this.propUrl) {
        const query = Object.assign({}, this.currentRoute['query'] || {})
        query['order'] = column['name']
        query['dir'] = dir

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
      } else {
        this.$emit('action', 'sort', column['name'], dir)
      }
    },

    getFilter (filter) {
      if (this.propUrl) {
        if (!filter || filter.length > 1) {
          const url = this.$router.resolve('?filter=' + filter)

          if (this.history) {
            if (this.rerender) {
                this.$emit(
                    'action',
                    'pushRouter',
                    url
                )
            } else {
              this.$router.push(url).then(() => this.get(null, []))
            }
          } else {
            this.get(url.query)
          }
        }
      } else {
        this.$emit('action', 'filter', filter)
      }
    },

    setFilter (event) {
      clearTimeout(filterTimer)
      const filter = event.target.value.toLowerCase()

      if (filter) {
        event.target.classList.add('active')
      } else {
        event.target.classList.remove('active')
      }

      filterTimer = setTimeout(() => {
        this.getFilter(filter)
      }, 300)
    },

    clearFilter (event) {
      const filterElement = event.target.previousElementSibling
      if (filterElement.value) {
        filterElement.value = ''
        filterElement.classList.remove('active')
        this.getFilter('')
      }
    },

    columnFilters (event, filter) {
      clearTimeout(filterTimer)
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
        filterTimer = setTimeout(() => {
          const query = Object.assign({}, this.currentRoute['query'] || {})
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

      //this.$emit('action', 'filters', value, name)
    },

    getColumnFilters () {
      const filters = []

      if (this.propFilters) {
        if (Array.isArray(this.propFilters)) {
          const keys = this.propFilters.map(i => i.name || i)
          const values = this.propFilters.map(i => typeof i === 'object' ? i : { name: i })
          this.propFilters = Object.fromEntries(keys.map((_, i) => [keys[i], values[i]]))
        }

        for (const i of this.propColumns) {
          if (this.propFilters[i.name]) {
            if (typeof this.propFilters[i.name] == 'boolean') {
              this.propFilters[i.name] = {
                name: i.name
              }
            }

            filters.push(this.propFilters[i.name])
          } else {
            filters.push(null)
          }
        }
      } else if (this.propColumns) {
        for (const i of this.propColumns) {
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

    hasColumnFilters () {
      return this.propColumns.some(i => i.filter) || this.propFilters
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

    selectRow (item, data, event) {
      const active = item['@active']

      if (!event.ctrlKey) {
        this.propData.map(i => {
          if (i.data) {
            i.data.map(j => j['@active'] = false)
          } else {
            i['@active'] = false
          }
        })
      }

      item['@active'] = active ? false : !item['@active']

      this.$emit('action', 'panelSelectRow', data.filter(i => i['@active']))
    }
  }
}
</script>

<!--<style scoped>
.app-panel {
  @apply flex flex-col grow mx-4 mb-4 rounded shadow bg-white dark:bg-gray-700 overflow-auto
}
.app-panel__data {
  @apply grow overflow-auto
}
.app-panel__without-pagination .app-panel__data {
  @apply pb-4
}
.app-panel__data table {
  @apply w-full
}
.app-panel__data thead {
  @apply sticky top-0 z-10
}
.app-panel__data thead tr.app-panel__columns th, .app-panel__data thead tr.app-panel__filters th {
  @apply bg-slate-100 dark:bg-slate-700
}
.app-panel__data thead tr.app-panel__columns th > div {
  @apply relative inline-flex px-3 py-2 w-full h-full justify-center items-center
}
.app-panel__data thead tr.app-panel__columns th:first-child > div {
  @apply pl-6
}
.app-panel__data thead tr.app-panel__columns th:last-child > div {
  @apply pr-6
}
.app-panel__data thead tr.app-panel__columns th.app-panel__sortable > div {
  @apply pr-8 hover:bg-slate-200 dark:hover:bg-gray-600 cursor-pointer
}
.app-panel__data thead th .app-panel__splitter {
  @apply absolute z-10 top-0 -right-[1px] bottom-0 w-[2px] bg-gray-50/50 dark:bg-gray-700 dark:hover:bg-gray-600 hover:cursor-col-resize hidden md:block
}
.app-panel__data thead th .app-panel__splitter::before {
  @apply relative block h-full w-2 -ml-1 cursor-col-resize;
  content: "";
}
.app-panel__data thead th.app-panel__column-resize .app-panel__splitter {
  @apply h-full bg-blue-500
}
.app-panel__data thead .app-panel__column-sort {
  @apply absolute right-2 cursor-pointer
}
.app-panel__data thead th .active .app-panel__column-sort, .app-panel__data thead th:hover .app-panel__column-sort {
  @apply text-blue-500
}
.app-panel__data thead th {
  @apply h-0 p-0 first:pl-4 last:pr-4
}
.app-panel__data thead tr.app-panel__filters th {
  @apply border-t dark:border-gray-700
}
.app-panel__data thead tr.app-panel__filters th > div {
  @apply flex py-1
}
.app-panel__data thead tr.app-panel__filters select, .app-panel__data thead tr.app-panel__filters input {
  @apply py-0 px-2 mx-0.5 focus:z-10 relative h-6 border-0 focus:ring-2 bg-white dark:text-gray-100 dark:bg-gray-700
}
.app-panel__data thead tr.app-panel__filters select {
  @apply pr-6
}
.app-panel__data .actions {
  @apply text-center whitespace-nowrap
}
.app-panel__data .actions i {
  @apply mx-1 cursor-pointer
}
.app-panel__data .app-panel__data-mask {
  @apply hidden absolute z-10 left-0 top-0 right-0 bottom-0
}
.app-panel__data-resize .app-panel__data .app-panel__data-mask {
  @apply block cursor-col-resize
}
.app-panel__data tbody tr:not(.app-panel__category):not(.disabled) {
  @apply even:bg-gray-400/5 hover:bg-gray-500/10 dark:hover:bg-gray-300/10
}
.app-panel__data tbody tr:not(.app-panel__category).active {
  @apply !bg-blue-500/20 dark:!bg-blue-500/20
}
.app-panel .app-panel__filter {
  @apply grow md:grow-0 relative inline-flex items-center
}
.app-panel .app-panel__filter input {
  @apply h-8 pl-2 pr-5 w-full md:w-96 text-sm
}
.app-panel .app-panel__filter input + i {
  @apply absolute right-2 cursor-pointer opacity-0 invisible text-gray-300 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-600 transition
}
.app-panel .app-panel__filter input.active + i {
  @apply opacity-100 visible
}
</style>

<style>
.app-panel .app-panel__data tbody tr td .icon {
  @apply relative
}
.app-panel .app-panel__data tbody tr td .icon > i.fa-lock {
  @apply absolute -right-0.5 -bottom-0.5 text-rose-600 text-xs
}
.app-panel .app-panel__draggable-handle {
  @apply cursor-grab
}
.app-panel .sortable-chosen .app-panel__draggable-handle {
  @apply cursor-grabbing
}
.app-panel .app-panel__category {
  @apply cursor-pointer hover:text-blue-500
}
.app-panel .app-panel__category td {
  @apply px-4 pt-3 pb-1 border-b-2 font-bold
}
.app-panel tbody tr.disabled {
  @apply even:bg-rose-400/10 bg-rose-400/20 hover:bg-rose-600/10 dark:hover:bg-rose-600/10
}
</style>-->
