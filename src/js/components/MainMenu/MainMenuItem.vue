<script setup>
import { getCurrentInstance } from 'vue'
import store from '../../store'

const instance = getCurrentInstance()
const props = defineProps(['data', 'level'])
const emit = defineEmits(['action'])

if (props['data']['values']) {
  const value = store.getters.get('Storage.root.' + props['data']['key'],
      props['data']['value'] ?? props['data']['values'][0]['value'])

  for (const i of props['data']['values']) {
    if (i['value'] === value) {
      Object.assign(props['data'], i)
    }
  }
}
</script>

<template>
  <li :data-level="level"
      @mouseenter="emit('action', 'onEnter', $event, data)"
      @mouseleave="emit('action', 'onOut', $event, data)"
      @click.stop="emit('action', 'onClick', $event, data)">

    <template v-if="data['prev'] !== undefined || data['next'] !== undefined">
      <div v-if="data['prev'] || data['next']" class="border-t py-1 !bg-inherit">
        <button type="button" class="-ml-2 btn-sm btn-gray"
                :class="{ 'pointer-events-none opacity-50': !data['prev'] }"
                @click.stop="emit('action', 'onNav', $event, data['prev'], instance.parent.props)">
          <i class="fa fa-angle-left fa-fw"/>
        </button>
        <span class="grow truncate text-center py-1.5 text-sm text-blue-400">
          {{ data['info'] }}
        </span>
        <button type="button" class="-mr-2 btn-sm btn-gray"
                :class="{ 'pointer-events-none opacity-50': !data['next'] }"
                @click.stop="emit('action', 'onNav', $event, data['next'], instance.parent.props)">
          <i class="fa fa-angle-right fa-fw"/>
        </button>
      </div>
    </template>

    <div v-else :data-tooltip="data['title']">
      <span :class="{ 'w-8': level > 1, 'mr-2': data['name'] }" class="grow-0 shrink-0 flex items-center">
        <i v-if="data['loading']"
           class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>

        <img v-else-if="/^https?:\/\/?/.test(data['icon'])" :src="data['icon']" class="block min-w-8 min-h-8 w-8 h-8"
             alt=""/>

        <i v-else-if="data['icon']" :class="data['icon']" class="fa-fw !leading-[0]"/>
      </span>

      <span :class="[level > 1 ? 'py-1.5' : 'py-2.5']" class="grow truncate">
        {{ data['name'] }}
      </span>

      <i v-if="data['locked']" class="fa fa-lock ml-1 text-sm text-rose-500"/>

      <span v-if="data['id'] !== undefined" class="text-sm opacity-70 ml-1" v-html="data['id']"/>

      <span v-if="data['data'] || data['url']" class="px-2 -mr-4 h-full inline-flex items-center">
        <i class="fa fa-fw w-5 !text-sm" :class="[ level === 1 ? 'fa-angle-down' : 'fa-angle-right']"/>
      </span>
    </div>

    <ul v-if="data['data']">
      <main-menu-item v-for="(i, k) in data['data']" :data="i" :key="k" :level="level + 1"
                      @action="(...args) => emit('action', ...args)"/>
    </ul>
  </li>
</template>
