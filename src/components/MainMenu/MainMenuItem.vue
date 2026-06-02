<script setup>
import { getCurrentInstance } from 'vue'
import local from '@/services/local'
import Button from '@/components/Button/Button.vue'

const currentInstance = getCurrentInstance()
const $props = defineProps(['data', 'level'])

if ($props.data['values']) {
  const value = local.get('root.' + $props.data['key'], $props.data['value'] ?? $props.data['values'][0]['value'])

  for (const i of $props['data']['values']) {
    if (i['value'] === value) {
      Object.assign($props['data'], i)
      local.set('root.' + $props['data']['key'], i['value'])
    }
  }
}
</script>

<template>
  <li :data-level="$props.level"
      :class="{
        'sticky bottom-0 mt-auto !bg-inherit': $props.data['prev'] || $props.data['next'],
        'app-main-menu__filter': $props.data['filter'] !== undefined
      }"
      @mouseleave="$emit('action', 'onOut', $event, $props)"
      @mouseenter="$emit('action', 'onEnter', $event, $props)">

    <div v-if="$props.data['prev'] || $props.data['next']" class="py-1 !bg-inherit" @click.stop="">
      <Button type="button" class="-ml-2 btn-sm btn-gray"
              :disabled="!$props.data['prev']"
              @click.stop="$emit('action', 'onNav', $event, $props.data['prev'], currentInstance.parent.props)">
        <i class="fa fa-angle-left fa-fw"/>
      </Button>
      <span class="grow truncate text-center py-1.5 text-sm text-blue-400">
        {{ $props.data['info'] }}
      </span>
      <Button type="button" class="-mr-2 btn-sm btn-gray"
              :disabled="!$props.data['next']"
              @click.stop="$emit('action', 'onNav', $event, $props.data['next'], currentInstance.parent.props)">
        <i class="fa fa-angle-right fa-fw"/>
      </Button>
    </div>

    <div v-else-if="$props.data['filter'] !== undefined" class="py-1 !px-2 relative" @click.stop="">
      <input
          type="text"
          name="filter"
          class="px-2 pr-4 py-0.5 h-7"
          placeholder="..."
          autocomplete="off"
          autofocus
          :value="$props.data['filter']"
          @input="$emit('action', 'onFilterInput', $event, currentInstance.parent.props)"/>

      <i class="fa fa-remove absolute right-4 hover:text-rose-600" :class="{ 'hidden': !$props.data['filter'] }"
         @click="$emit('action', 'onFilterClear', $event, currentInstance.parent.props)"/>
    </div>

    <div v-else :data-tooltip="$props.data['title']" @click.stop="$emit('action', 'onClick', $event, $props)">
      <span :class="{ 'w-8': $props.level > 1, 'lg:mr-2': $props.data['name'] && $props.level === 1 }"
            class="grow-0 shrink-0 flex items-center">
        <i v-if="$props.data['loading']"
           class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>

        <img v-else-if="/^https?:\/\/?/.test($props.data['icon'])" :src="$props.data['icon']"
             class="block min-w-8 min-h-8 w-8 h-8 -mx-1.5 lg:-mx-2"
             alt=""/>

        <i v-else-if="$props.data['icon']" :class="$props.data['icon']" class="fa-fw !leading-[0]"/>
      </span>

      <span :class="[$props.level > 1 ? 'py-1.5' : 'hidden lg:!block']" class="grow truncate">
        {{ $props.data['name'] }}
      </span>

      <i v-if="$props.data['locked']" class="fa fa-lock ml-1 text-sm text-rose-500"/>

      <span v-if="$props.data['id'] !== undefined" class="text-sm opacity-70 ml-1" v-html="$props.data['id']"/>

      <span v-if="$props.data['data'] || $props.data['url']" :class="[$props.level > 1 ? 'inline-flex' : 'hidden lg:!inline-flex']"
            class="px-2 -mr-4 h-full items-center opacity-50 app-main-menu__toggle">
        <i class="fa fa-fw w-5 !text-sm pointer-events-none"
           :class="[ $props.level === 1 ? 'fa-angle-down' : 'fa-angle-right']"/>
      </span>
    </div>

    <ul v-if="$props.data['data']">
      <li v-if="$props.level > 1" :data-level="$props.level + 1" class="lg:!hidden sticky top-0 !bg-inherit"
          @click.stop="() => data['data'] = null">
        <div class="!bg-inherit -mt-1">
          <span class="grow py-1.5 text-center">
            <i class="fa fa-arrow-left"/>&nbsp;
          </span>
        </div>
      </li>
      <main-menu-item v-for="(i, k) in $props.data['data']" :data="i" :key="k" :level="$props.level + 1"
                      @action="(...args) => $emit('action', ...args)"/>
    </ul>
  </li>
</template>
