import { computed, ref, watch } from 'vue'
import router from '@/router'
import session from '@/services/session'

export function useTabs (props, emit) {
  const tabs = computed(() => props.data ?? [])
  const storageKey = computed(() => `tabsActiveId.${props.id.toLowerCase()}`)
  const route = router.currentRoute
  const persist = computed(() => Boolean(props.hiddenTabs && !props.history))

  const localId = ref(null)

  function firstId () {
    return tabs.value[0]?.id
  }

  const activeId = computed(() => {
    if (props.history) {
      if (typeof props.history === 'string') {
        const id = route.value.params?.[props.history]
        return tabs.value.find(tab => String(tab.id) === String(id))?.id
      }

      return tabs.value.find(tab => tab.route && router.parse(tab.route)?.path === route.value.path)?.id
    }

    if (persist.value) {
      const savedId = session.get(storageKey.value)
      if (savedId !== undefined && tabs.value.some(tab => tab.id === savedId)) {
        return savedId
      }
    }

    return tabs.value.some(tab => tab.id === localId.value) ? localId.value : firstId()
  })

  if (persist.value && session.get(storageKey.value) === undefined) {
    // Migrate the previously stored position on first use.
    const oldIndex = session.get(`tabs.${props.id.toLowerCase()}`, 0)
    const migratedId = (tabs.value[oldIndex] ?? tabs.value[0])?.id
    if (migratedId !== undefined) session.set(storageKey.value, migratedId)
  }

  watch([activeId, storageKey, persist], ([id]) => {
    if (persist.value && id !== undefined && session.get(storageKey.value) !== id) {
      session.set(storageKey.value, id)
    }
  }, { immediate: true })

  watch(tabs, (value) => {
    if (props.history) return

    if (persist.value) {
      const savedId = session.get(storageKey.value)
      if (savedId !== undefined && !value.some(tab => tab.id === savedId)) {
        const nextId = value[0]?.id
        if (nextId !== undefined) session.set(storageKey.value, nextId)
      }
    } else if (!value.some(tab => tab.id === localId.value)) {
      localId.value = firstId()
    }
  }, { deep: true })

  function selectTab (id) {
    const tab = tabs.value.find(tab => tab.id === id)
    if (!tab) return

    if (!props.history) {
      if (persist.value) {
        session.set(storageKey.value, tab.id)
      } else {
        localId.value = tab.id
      }
    } else if (typeof props.history === 'string') {
      emit('action', 'pushRouter', {
        params: { [props.history]: tab.id },
        meta: { group: true }
      })
    } else if (tab.route) {
      const target = router.parse(tab.route)
      emit('action', 'pushRouter', {
        ...target,
        meta: { ...target.meta, group: true }
      })
    }
  }

  return { tabs, activeId, selectTab }
}
