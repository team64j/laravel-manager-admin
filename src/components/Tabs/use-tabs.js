import { computed, watch } from 'vue'
import router from '@/router'
import session from '@/services/session'

export function useTabs (props, emit) {
  const tabs = computed(() => props.data ?? [])
  const storageKey = computed(() => `tabsActiveId.${props.id.toLowerCase()}`)
  const route = router.currentRoute

  const activeId = computed(() => {
    if (props.history) {
      if (typeof props.history === 'string') {
        const id = route.value.params?.[props.history]
        return tabs.value.find(tab => String(tab.id) === String(id))?.id
      }

      return tabs.value.find(tab => tab.route && router.parse(tab.route)?.path === route.value.path)?.id
    }

    const savedId = session.get(storageKey.value)
    if (savedId !== undefined && tabs.value.some(tab => tab.id === savedId)) {
      return savedId
    }

    // Migrate the previously stored position on first use.
    const oldIndex = savedId === undefined ? session.get(`tabs.${props.id.toLowerCase()}`, 0) : 0
    return (tabs.value[oldIndex] ?? tabs.value[0])?.id
  })

  watch([activeId, storageKey, () => props.history, () => session.get(storageKey.value)], ([id]) => {
    if (!props.history && id !== undefined && session.get(storageKey.value) !== id) {
      session.set(storageKey.value, id)
    }
  }, { immediate: true })

  function selectTab (id) {
    const tab = tabs.value.find(tab => tab.id === id)
    if (!tab) return

    if (!props.history) {
      session.set(storageKey.value, tab.id)
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
