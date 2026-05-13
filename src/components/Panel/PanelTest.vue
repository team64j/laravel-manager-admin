<script setup>
import { computed, getCurrentInstance, onMounted, reactive, toRaw } from 'vue'
import { uniqId } from '@/utils'
import store from '@/store'
import Button from '@/components/Button/Button.vue'
import Input from '@/components/Input/Input.vue'
import Select from '@/components/Select/Select.vue'
import { getValue } from '@/composables'
import router from '@/router'

const currentInstance = getCurrentInstance()

defineOptions({
  name: 'PanelTest',
  __isStatic: true,
})

const $props = defineProps({
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
  dataKey: {
    type: String,
    default: 'data',
  },
})

const $emit = defineEmits(['action', 'update:modelValue', 'update:props'])

const $model = computed({
  get () {
    return $props.modelValue
  },
  set (value) {
    $emit('update:modelValue', value, currentInstance)
  },
})

const key = `panel.` + $props.id.toLowerCase()

const $data = reactive({
  loading: false,
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
})

const filters = computed(() => {
  const filters = []

  for (const column of $props.columns) {
    const filter = $props.filters.find(i => i.name === column.name)

    if (filter || column.filter) {
      filters.push(filter || {})
    } else {
      filters.push(null)
    }
  }

  return filters
})

const columns = computed(() => {
  if ($props.columns.length) {
    return toRaw($props.columns)
  }

  return $props.data[0][$props.dataKey][0].length || $props.data[0].length
})

const propUrl = computed(() => $props.url ?? $props.currentRoute['path'] ?? null)

function pagination (url) {
  if (propUrl) {
    loadData(Object.assign({}, router.parse(propUrl), { query: router.parse(url).query }))
  } else {
    $emit('action', 'pagination', ...arguments)
  }
}

function getData (query, params) {
  $data.loading = true
  const route = router.parse($props.currentRoute?.['meta']?.['url'] || propUrl)
  query = Object.assign(route.query, $props.currentRoute?.query || {}, query)

  $emit('update:props', {
    data: params,
    meta: params ? Object.assign({}, { ...$props.meta }) : {},
  }, this)

  // if (this.$refs.data) {
  //   this.$refs.data.style.height = this.$refs.data.offsetHeight + 'px'
  // }

  // currentInstance.$el.querySelectorAll('thead > tr > th').forEach(i => {
  //   i.style.maxWidth = i.clientWidth + 'px'
  //   i.style.minWidth = i.clientWidth + 'px'
  // })

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

    // if (this.$refs.data) {
    //   this.$refs.data.style.overflow = null
    // }
    //
    // this.$el.querySelectorAll('thead > tr > th').forEach(i => {
    //   i.style.maxWidth = null
    //   i.style.minWidth = null
    // })

    $emit('update:props', props)

    // this.$el.querySelector('.app-panel__data').style.height = null
  }).finally(() => {
    $data.loading = false
  })
}

function loadData (route, props) {
  if ($props.history) {
    if ($props.rerender) {
      $emit(
          'action',
          'pushRouter',
          route,
      )
    } else {
      router.to(route)
      getData(route.query, [])

      // if (props) {
      //   this.$emit('update:props', props, this)
      // }
    }
  } else {
    getData(route.query, [])
  }
}

onMounted(() => {
  if (currentInstance.vnode.el.parentElement.classList.contains('app-tabs__page')) {
    currentInstance.vnode.el.parentElement.childElementCount === 1 &&
    currentInstance.vnode.el.parentElement.classList.add('!p-0')
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
        <thead class="bg-slate-100 dark:bg-gray-600 sticky top-0">
        <tr v-if="$props.columns">
          <th v-for="column in $props.columns" class="font-bold border-l first:border-0 border-opacity-5"
              :style="column?.style">
            <div v-if="column.label" class="relative truncate px-5 py-1" :style="{ minWidth: column.width }">
              {{ column.label }}
            </div>
          </th>
        </tr>
        <tr v-if="filters">
          <td v-for="filter in filters" class="border-l first:border-0 border-opacity-5">
            <template v-if="filter">
              <Select v-if="filter.data" v-bind="filter" v-model="$data.filterModel[filter.name]"
                      input-class="input-sm"/>
              <Input v-else v-bind="filter" v-model="$data.filterModel[filter.name]"
                     input-class="input-sm"/>
            </template>
          </td>
        </tr>
        </thead>

        <template v-if="$props.data.length" v-for="category in ($props.data[0]?.[$props.dataKey] ? $props.data : [{
          data: $props.data,
          route: $props.route,
          draggable: $props.draggable
        }])">
          <tbody v-if="category.name && category[$props.dataKey].length">
          <tr class="even:bg-blue-600/10">
            <td :colspan="columns.length" class="p-2 first:pl-6 last:pr-6">
              <i v-if="(category.id ?? category.key)"
                 :class="[1 ? 'fa-square-minus' : 'fa-square-plus']"
                 class="far fa-fw mr-1"/>
              <span>{{ category.name }}</span>
              <span v-if="category.id" class="ml-1">({{ category.id }})</span>
            </td>
          </tr>
          </tbody>

          <tbody v-if="category[$props.dataKey].length || category.length">
          <tr v-for="(item, i) in (category[$props.dataKey] || category)"
              class="even:bg-gray-400/5 hover:bg-blue-700/20">
            <td v-for="ceil in columns" class="p-2 first:pl-6 last:pr-6">
              <component v-if="item[ceil.name]?.component"
                         :is="item[ceil.name].component"
                         v-bind="{ ...item[ceil.name].attrs, modelValue: getValue(item[ceil.name].model, $props.modelValue) }"
              />
              <div v-else-if="ceil.values && ceil.values[item[ceil.name]]" v-html="ceil.values[item[ceil.name]]"/>
              <template v-else>
                {{ item[ceil.name] }}
              </template>
            </td>
          </tr>
          </tbody>
        </template>

        <tbody v-else>
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

    <div v-if="$props.meta?.['pagination']['prev'] || $props.meta?.['pagination']['next']" class="flex p-3">
      <div class="grow">
        <Button class="btn-sm btn-gray"
                :disabled="!$props.meta['pagination']['prev']"
                @click="pagination($props.meta['pagination']['prev'])">
          <i class="fa fa-angle-left fa-fw"/>
        </Button>
        <Button class="btn-sm btn-gray ml-1"
                :disabled="!$props.meta['pagination']['next']"
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