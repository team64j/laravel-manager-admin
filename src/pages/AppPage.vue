<script setup>
import { getCurrentInstance, onMounted, reactive, ref, watch } from 'vue'
import { action } from '@/composables'
import { isNumber } from '@/utils'
import router from '@/router'
import store from '@/store'
import GlobalComponent from '@/components/GlobalComponent/GlobalComponent.vue'

defineOptions({
  name: 'AppPage'
})

const currentInstance = getCurrentInstance()

const emit = defineEmits(['action'])

const $props = defineProps({
  currentRoute: {
    type: Object,
    default: router.currentRoute.value
  }
})

const $data = reactive({
  url: null,
  data: null,
  meta: null,
  layout: null,
  errors: null,
  currentRoute: $props.currentRoute
})

const loaded = ref(false)

function _action () {
  return action.call(currentInstance, ...arguments)
}

function submit ({ action, method, route } = {}, changed = false) {
  if (route) {
    route = router.parse(route)
  } else {
    route = $props.currentRoute
  }

  const url = route?.['meta']?.['url'] ? route['meta']['url'] : route?.['path']
  const isNumericId = isNumber(route['params']['id'])
  const stay = store.getters.get('Storage.stay')

  if (route?.['meta']?.['method']) {
    method ??= route['meta']['method'].toLowerCase()
  }

  if (action === 'cancel') {
    emit('action', 'closeTab')
    return
  } else if (action === 'save') {
    method ??= isNumericId ? 'patch' : 'post'
    action = isNumericId ? 'update' : 'create'
  } else if (action === 'delete') {
    method ??= 'delete'
  } else {
    method ??= 'get'
    action ??= 'read'
  }

  if ($data.data) {
    emit('action', 'setTab', {
      key: currentInstance.vnode.key,
      loading: true
    })
  } else {
    emit('action', 'setTab', {
      key: currentInstance.vnode.key,
      loading: true,
      meta: {
        title: $data.meta?.['title'] ?? route?.['meta']?.['title'] !== undefined ? route['meta']['title'] : undefined
      }
    })
  }

  $data.errors = null

  for (const i in $data.layout) {
    if ($data.layout[i].slots) {
      for (const o in $data.layout[i].slots) {
        if ($data.layout[i].slots[o]?.attrs?.url) {
          delete $data.layout[i].slots[o]
        }
      }
    }
  }

  axios({
    method,
    url,
    params: route.query,
    data: Object.assign({}, $data.data, route.query)
  }).
      then(r => {
        emit('action', 'setTab', {
          key: currentInstance.vnode.key,
          changed: false
        })

        if (r.data) {
          if (r.data?.['meta']?.['redirect']) {
            location.href = r.data['meta']['redirect']
            return
          }

          if (r.data?.['meta']?.['reload']) {
            location.reload()
            return
          }

          if (r.data?.['meta']?.['exit']) {
            emit('action', 'closeTab')
            return
          }

          if (r.data?.['data']?.['id'] !== undefined && $props.currentRoute?.['params']?.['id'] !== undefined &&
              r.data['data']['id'].toString() !== $props.currentRoute['params']['id'].toString()) {
            emit('action', 'replaceTab', router.parse({ params: { id: r.data['data']['id'] } }))
            return
          }

          store.dispatch('set', {
            action,
            data: r.data['data']?.['attributes'] ? r.data['data'] : {
              id: r.data['data']['id'],
              attributes: r.data['data']
            },
            route: $props.currentRoute['path'],
            actionUpdate: Date.now()
          })

          if (action !== 'read') {
            if (stay === 0) {
              emit('action', 'closeTab')
              return
            } else if (stay === 1) {
              emit('action', 'closeTab')
              router.to({ params: { id: 0 } })
              return
            }
          }

          Object.assign($data, {
            url: r.request.responseURL,
            data: r.data['data'],
            meta: r.data['meta'],
            layout: r.data['layout'],
            errors: r.data['errors'],
            currentRoute: $props.currentRoute
          })

          const meta = {}
          const tab = Array.isArray($data.layout) && $data.layout.find(i => i.component === 'AppGlobalTab')

          if (tab) {
            Object.assign(meta, tab.attrs)
          } else {
            if (r.data['meta']?.['title'] !== undefined) {
              meta['title'] = r.data['meta']['title']
            } else if (r.data['data']?.['title'] !== undefined) {
              meta['title'] = r.data['data']['title']
            }

            if (r.data['meta']?.['icon'] !== undefined) {
              meta['icon'] = r.data['meta']['icon']
            } else if (r.data['data']?.['icon'] !== undefined) {
              meta['icon'] = r.data['data']['icon']
            }
          }

          if (Object.values(meta).length) {
            emit('action', 'setTab', {
              key: currentInstance.vnode.key,
              meta
            })
          }

          loaded.value = true
        }
      }).catch(({ response }) => {
    if (response?.data.errors) {
      $data.errors = response.data.errors
    } else if (response?.status >= 400) {
      emit('action', 'closeTab')
    }
  }).finally(() => {
    emit('action', 'setTab', {
      key: currentInstance.vnode.key,
      changed,
      loading: false
    })
  })
}

function inputReloadQuery (value, instance) {
  const ctx = instance.ctx || instance

  const route = router.parse({
    query: Object.assign({}, $props.currentRoute['query'], { [ctx.emitInputKey ?? ctx._.vnode.key]: value })
  })
  emit('action', 'pushRouter', route, () => submit({}, true))
}

function inputChangeQuery (value, instance) {
  const ctx = instance.ctx || instance

  const route = router.parse({
    query: Object.assign({}, $props.currentRoute['query'], { [ctx.emitInputKey ?? ctx._.vnode.key]: value })
  })
  emit('action', 'pushRouter', route, () => submit({}, true))
}

function updateModelValue () {
  emit('action', 'setTab', {
    changed: true
  })
}

watch(
    () => $props.currentRoute?.['path'],
    () => $props.currentRoute['meta']['group'] && submit()
)

onMounted(submit)

defineExpose({
  submit,
  inputChangeQuery,
  inputReloadQuery
})
</script>

<template>
  <div class="app-page__default w-full h-full flex flex-col overflow-auto">
    <global-component v-if="loaded" v-bind="$data" @action="_action" @update:modelValue="updateModelValue"/>
    <div v-else class="flex items-center justify-center grow">
      <div
          class="inline-block rounded-full border-4 border-slate-200 border-r-blue-500 dark:border-white/20 dark:border-r-blue-500 h-20 w-20 animate-spin transition duration-500"/>
    </div>
  </div>
</template>
