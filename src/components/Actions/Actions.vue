<script setup>
import('./Actions.css')
import { computed } from 'vue'
import store from '../../store'
import Button from '../Form/Button.vue'

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

  emit('action', 'submit', { ...params, stay })
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
                :icon="j.icon"
                :class="i.class"
                :value="i.title + ' + ' + j.title"
                :loader="store.getters.get('tabsLoading')"
                @click="click(i, j.stay)"/>

        <Button class="app-actions__toggle" :class="i.class" @mousedown="clickGroup">
          <i class="fa fa-angle-down fa-fw"/>
        </Button>

        <div class="app-actions__save-buttons">
          <Button v-for="j in i.data.filter((j, k) => k !== stay)"
                  :icon="j.icon"
                  :class="i.class"
                  :value="j.title"
                  :loader="store.getters.get('tabsLoading')"
                  @mousedown="() => click(i, j.stay)">
            <template #icon>
              <i :class="i.icon"/>
              <i class="fa fa-plus fa-fw"/>
            </template>
          </Button>
        </div>
      </div>

      <Button v-else
              :icon="i.icon"
              :class="i.class"
              :value="'<span>' + i.title + '</span>'"
              @click="click(i)"/>
    </template>
  </div>
</template>
