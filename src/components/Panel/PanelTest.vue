<script setup>
import { computed, getCurrentInstance, onMounted, reactive, shallowRef, toRaw, watch } from 'vue'
import { uniqId } from '@/utils'
import store from '@/store'
import Button from '@/components/Button/Button.vue'
import Input from '@/components/Input/Input.vue'
import Select from '@/components/Select/Select.vue'
import router from '@/router'
import draggable from 'vuedraggable'
import PanelRow from '@/components/Panel/PanelRow.vue'

const currentInstance = getCurrentInstance()

defineOptions({
  name: 'Panel',
  __isStatic: true
})

const $props = defineProps({
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
  currentRoute: Object,
  dataKey: {
    type: String,
    default: 'data'
  }
})

const $emit = defineEmits(['action', 'update:modelValue', 'update:props'])

const key = `panel.` + $props.id.toLowerCase()

const $data = reactive({
  keyStorage: key,
  filterTimer: 0,
  filterModel: { ...$props.currentRoute.query },
  settings: store.getters.get(`Session.${key}`, {}),
  idContextMenu: null,
  showContextMenu: false,
  dataContextMenu: [],
  classContextMenu: null,
  propView: $props.view,
  sorting: {},
  draggable: {
    type: [Boolean, String],
    default: props => props?.meta?.draggable
  }
})

const loaded = shallowRef(true)

const columns = computed(() => {
  const columns = $props?.meta?.columns || $props.columns || {}

  if (columns.length) {
    return toRaw(columns).map(i => {
      i.key = i.key || i.name
      return i
    })
  } else if ($props.data[0]) {
    return Object.entries($props.data[0]).map(i => ({ key: i[0] }))
  }

  return []

  //return $props.data?.[0][$props.dataKey][0].length || $props.data?.[0].length
})

const filters = computed(() => {
  const filters = []

  for (const column of columns.value) {
    const filter = ($props?.meta?.filters ?? []).find(i => i.name === column.name)

    if (filter || column.filter) {
      filters.push(toRaw(filter || { name: column.name }))
    } else {
      filters.push(null)
    }
  }

  return filters
})

const propUrl = computed(() => $props.url ?? $props.currentRoute['path'] ?? null)

const rowProps = computed(() => ({
  columns: columns.value,
  modelValue: $props.modelValue,
  route: $props.route
}))

function pagination (url) {
  if (propUrl.value) {
    loadData(Object.assign({}, router.parse(propUrl.value), { query: router.parse(url).query }))
  } else {
    $emit('action', 'pagination', ...arguments)
  }
}

function getData (query, params) {
  loaded.value = false
  const route = router.parse($props.currentRoute?.['meta']?.['url'] || propUrl.value)
  query = Object.assign(route.query, $data.filterModel, query)

  $emit('update:props', {
    data: params,
    meta: params ? Object.assign({}, { ...$props.meta }) : {}
  }, this)
  axios({
    method: route?.['meta']?.['method']?.toLowerCase() ?? 'get',
    url: route.path,
    params: query,
    data: Object.assign({}, query)
  }).then(({ data }) => {
    $emit('update:props', { ...data })
  }).finally(() => {
    loaded.value = true
  })
}

function loadData (route, props) {
  if ($props.history) {
    if ($props.rerender) {
      $emit(
          'action',
          'pushRouter',
          route
      )
    } else {
      router.to(route)
      getData(route.query, [])
    }
  } else {
    getData(route.query, [])
  }
}

let filterTimer = 0

function onChangeFilter (value, key) {
  clearTimeout(filterTimer)

  filterTimer = setTimeout(() => {
    if (value === '' || value === null) {
      delete $data.filterModel[key]
    } else {
      $data.filterModel[key] = value
    }

    delete $data.filterModel['page']

    loadData(router.parse({ query: $data.filterModel }))
  }, 300)
}

function hasClosedCategory (category) {
  return category['@closed'] || $data.settings?.['closed']?.includes(category['id'] ?? category['key'])
}

function onClickCategoryRow (category) {
  const key = category['id'] ?? category['key']

  if (!key) {
    return
  }

  if (!$data.settings['closed']) {
    $data.settings['closed'] = []
  }

  let index = $data.settings['closed'].indexOf(key)

  if (index > -1) {
    $data.settings['closed'].splice(index, 1)
  } else {
    $data.settings['closed'].push(key)
  }

  store.dispatch('set', { ['Session.' + $data.keyStorage]: { closed: $data.settings['closed'] } })
}

function onClickRow (item, route) {
  if (item['@disabled'] || $props.draggable) {
    return
  }

  if (!route) {
    if (item['@route']) {
      route = { path: item['@route'] }
    } else if ($props.route) {
      route = typeof $props.route === 'object' ? toRaw($props.route) : { path: $props.route }
    }
  }

  if (route) {
    $emit(
        'action',
        'pushRouter',
        {
          ...route,
          params: item
        }
    )
  }

  const active = item['@active']

  $props.data.forEach(i => {
    if (i['@active']) {
      delete i['@active']
    }

    (i[$props.dataKey] || []).forEach(j => {
      if (j['@active']) {
        delete j['@active']
      }
    })
  })

  item['@active'] = route ? true : !active
}

function onSortableEnd (data, key) {
  if (typeof key !== 'string') {
    return
  }

  let counter = $props.meta?.pagination?.['current'] > 1
      ? ($props.meta.pagination['current'] - 1) * $props.meta.pagination['per']
      : 0

  for (const i in data) {
    if (data[i][key] !== undefined) {
      data[i][key] = counter++
    }
  }
}

onMounted(() => {
  if (currentInstance.vnode.el.parentElement.classList.contains('app-tabs__page')) {
    currentInstance.vnode.el.parentElement.childElementCount === 1 &&
    currentInstance.vnode.el.parentElement.classList.add('!p-0')
  }

  if ($props.history) {
    watch(
        () => router.currentRoute.value,
        (a, b) => {
          a['path'] === b['path'] &&
          a['query'][$props.history] !== b['query'][$props.history] &&
          getData(a['query'], [])
        },
        { deep: true }
    )
  }

  if ($props.url) {
    getData()
  }
})
</script>

<template>
  <div class="app-panel overflow-hidden flex flex-col grow"
       :class="{ ['app-panel__view-' + $data.propView]: $data.propView }">
    <div v-if="$slots['top']">
      <slot name="top"/>
    </div>

    <div v-if="$props.data" class="grow overflow-auto rounded">
      <table class="w-full">
        <colgroup>
          <col v-for="column in columns" :style="{ width: column.width }"/>
        </colgroup>

        <thead v-if="columns.some(i => i.label)"
               class="bg-slate-100 dark:bg-gray-600 sticky top-0 z-20">
        <tr v-if="columns">
          <th v-for="column in columns" class="font-bold border-l first:border-0 border-opacity-5"
              :style="column?.style">
            <div v-if="column.label" class="relative truncate px-5 py-1">
              {{ column.label }}
            </div>
          </th>
        </tr>
        <tr v-if="filters">
          <td v-for="filter in filters" class="border-l first:border-0 border-opacity-5">
            <template v-if="filter">
              <div v-if="filter.type === 'date'" class="flex">
                <Input v-bind="filter" v-model="$data.filterModel[filter.name]"
                       input-class="input-sm" @update:model-value="onChangeFilter($event, filter.name)"/>
                <Input v-bind="filter" v-model="$data.filterModel[filter.name]"
                       input-class="input-sm" @update:model-value="onChangeFilter($event, filter.name)"/>
              </div>
              <Select v-else-if="filter.data" v-bind="filter" v-model="$data.filterModel[filter.name]"
                      input-class="input-sm" @update:model-value="onChangeFilter($event, filter.name)"/>
              <Input v-else v-bind="filter" v-model="$data.filterModel[filter.name]" :clear="true"
                     input-class="input-sm" @update:model-value="onChangeFilter($event, filter.name)"/>
            </template>
          </td>
        </tr>
        </thead>

        <template
            v-if="$props.data.length && loaded"
            v-for="category in ($props.data[0]?.[$props.dataKey] ? $props.data : [{
              data: $props.data,
              route: $props.route,
              draggable: $props.draggable
            }])">
          <tbody v-if="category.name && category[$props.dataKey].length">
          <tr class="even:bg-blue-600/10" @dblclick.stop="onClickCategoryRow(category)">
            <td :colspan="columns.length"
                class="p-2 px-5 border-b-2 font-bold"
                :class="{ 'cursor-pointer hover:bg-blue-600/20 hover:text-blue-500': category.id ?? category.key }">
              <i v-if="(category.id ?? category.key)"
                 :class="[!hasClosedCategory(category) ? 'fa-square-minus' : 'fa-square-plus']"
                 class="far fa-fw mr-1 cursor-pointer"
                 @mousedown="onClickCategoryRow(category)"/>
              <span>{{ category.name }}</span>
              <span v-if="category.id" class="ml-1">({{ category.id }})</span>
            </td>
          </tr>
          </tbody>

          <template v-if="(category.length || category[$props.dataKey].length) && !hasClosedCategory(category)">
            <draggable v-if="category.draggable ?? $props.draggable"
                       :list="category[$props.dataKey] || category"
                       item-key="id"
                       tag="tbody"
                       @end="onSortableEnd(category[$props.dataKey] || category, category.draggable ?? $props.draggable)">
              <template #item="{ element, index }">
                <panel-row :item="element" :index="index" v-bind="rowProps" @on-click-row="onClickRow"/>
              </template>
            </draggable>

            <tbody v-else>
            <template v-for="item in (category[$props.dataKey] || category)">
              <panel-row :item="item" v-bind="rowProps" @on-click-row="onClickRow"/>
            </template>
            </tbody>
          </template>

        </template>

        <tbody v-else-if="!loaded">
        <tr>
          <td :colspan="columns.length">
            <div class="flex items-center justify-center text-center p-5 w-full">
              <i class="inline-block rounded-full border-2 border-slate-200 border-r-blue-500 dark:border-white/20 dark:border-r-blue-500 h-5 w-5 animate-spin"/>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="flex items-center justify-center text-center p-5 w-full">
      <i class="inline-block rounded-full border-2 border-slate-200 border-r-blue-500 dark:border-white/20 dark:border-r-blue-500 h-5 w-5 animate-spin"/>
    </div>

    <div v-if="$props.meta?.['pagination']?.['prev'] || $props.meta?.['pagination']?.['next']" class="flex p-3">
      <div class="grow">
        <Button class="btn-sm btn-gray"
                :disabled="!$props.meta['pagination']['prev']"
                :class="{ '!opacity-50': !$props.meta['pagination']['prev'] }"
                @click="pagination($props.meta['pagination']['prev'])">
          <i class="fa fa-angle-left fa-fw"/>
        </Button>
        <Button class="btn-sm btn-gray ml-1"
                :disabled="!$props.meta['pagination']['next']"
                :class="{ '!opacity-50': !$props.meta['pagination']['next'] }"
                @click="pagination($props.meta['pagination']['next'])">
          <i class="fa fa-angle-right fa-fw"/>
        </Button>
      </div>
      <div v-if="$props.meta['pagination']['info']" class="pr-2">
        {{ $props.meta['pagination']['info'] }}
      </div>
    </div>

    <div v-if="$slots['bottom']">
      <slot name="bottom"/>
    </div>
  </div>
</template>

<style scoped>

</style>

<style>
.app-tabs__page > .app-panel {
  @apply h-full
}
</style>