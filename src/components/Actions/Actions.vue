<script setup>
import { computed } from 'vue'
import store from '@/store'
import Button from '@/components/Button/Button.vue'

defineOptions({
  name: 'Actions',
  __isStatic: true
})

const props = defineProps({
  data: Array
})

const emit = defineEmits(['action'])

const stay = computed(() => store.getters['Storage/get']('stay') || 0)

function click (params, stay) {
  if (params.to) {
    if (params.to.href) {
      window.open(params.to.href)
    } else if (params.to.path) {
      emit('action', 'pushRouter', params.to)
    }

    if (params.to.close) {
      emit('action', 'closeTab')
    }

    return
  }

  params = params.action ?? { action: params }

  if (typeof params === 'string') {
    params = {
      action: params
    }
  }

  if (stay !== undefined) {
    store.dispatch('Storage/set', ['stay', stay])
  }

  emit('action', 'submit', { ...params })
}

function clickGroup (event) {
  if (event.currentTarget === document.activeElement) {
    event.currentTarget.blur()
    event.preventDefault()
  }
}
</script>

<template>
  <div v-if="props.data.length" class="app-actions">
    <template v-for="i in props.data">
      <div v-if="i.data" class="app-actions__group">
        <Button v-for="j in i.data.filter((j, k) => k === stay)"
                class="btn-sm"
                :icon="j.icon"
                :class="i.class"
                :value="i.title + ' + ' + j.title"
                :loading="store.getters.get('tabsLoading')"
                @click="click(i, j.stay)"/>

        <Button class="btn-sm app-actions__toggle"
                :class="i.class"
                icon="fa fa-angle-down fa-fw"
                @mousedown="clickGroup"/>

        <div class="app-actions__save-buttons">
          <Button v-for="j in i.data.filter((j, k) => k !== stay)"
                  class="btn-sm justify-start"
                  :icon="j.icon"
                  :class="i.class"
                  :value="j.title"
                  :loading="store.getters.get('tabsLoading')"
                  @mousedown="() => click(i, j.stay)">
            <template #icon>
              <i :class="i.icon"/>
              <i class="fa fa-plus fa-fw"/>
            </template>
          </Button>
        </div>
      </div>

      <Button v-else
              class="btn-sm"
              :icon="i.icon"
              :class="i.class"
              :value="'<span>' + i.title + '</span>'"
              @click="click(i)"/>
    </template>
  </div>
</template>

<style>
.app-actions {
  @apply fixed z-20 flex rounded-b bg-white/60 dark:bg-gray-750/60 p-2 right-2
}
.app-actions > button, .app-actions > div {
  @apply inline-flex mx-0.5
}
.app-actions button:not(.app-actions__toggle) > i.fa {
  @apply md:hidden
}
.app-actions button span {
  @apply hidden md:inline-block px-1
}
.app-actions .app-actions__group {
  @apply relative
}
.app-actions .app-actions__group > button {
  @apply rounded-r-none last-of-type:rounded-r last-of-type:rounded-l-none
}
.app-actions .app-actions__toggle:not(:focus):not(:hover) {
  @apply border-l border-l-white/20
}
.app-actions .app-actions__toggle > i {
  @apply transition
}
.app-actions .app-actions__toggle:focus > i {
  @apply rotate-180
}
.app-actions .app-actions__save-buttons {
  @apply absolute left-0 top-full mt-0.5 w-full flex flex-col opacity-0 invisible shadow transition
}
.app-actions .app-actions__toggle:focus ~ .app-actions__save-buttons {
  @apply opacity-100 visible
}
.app-actions .app-actions__save-buttons button {
  @apply border-t-0 rounded-none first:rounded-t last:rounded-b
}
</style>
