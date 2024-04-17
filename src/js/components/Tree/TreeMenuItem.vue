<script setup>
import { nextTick, reactive } from 'vue'
import AppLoaderIcon from '../Layout/LoaderIcon.vue'
import router from '../../router'

const $props = defineProps(['icon', 'loader', 'click', 'to', 'position', 'actions', 'settings'])

const $emit = defineEmits(['action'])

const $data = reactive({
  active: false,
  loading: false
})

function onBlurButton () {
  nextTick(() => $data.active = false)
}

function onClickButton () {
  $data.active = !$data.active

  if ($props.click) {
    $emit('action', `menu${$props.click.charAt(0).toUpperCase() + $props.click.slice(1)}`)
  } else if ($props.to) {
    router.to($props.to)
  }
}

function hasActiveItem (action) {
  if ($props.settings[action.key] !== undefined) {
    if (Array.isArray($props.settings[action.key])) {
      return ~$props.settings[action.key].indexOf(action.value)
    } else {
      return $props.settings[action.key] === action.value
    }
  }

  return false
}

function onClickItem (action) {
  $data.active = !$data.active

  if (action.toggle) {
    if (Array.isArray($props.settings[action.key])) {
      const index = $props.settings[action.key].indexOf(action.value)
      if (~index) {
        $props.settings[action.key].splice(index, 1)
      } else {
        $props.settings[action.key].push(action.value)
      }
    } else {
      $props.settings[action.key] = action.value
    }
    $emit('action', 'menuUpdate')
  }
}
</script>

<template>
  <div class="app-tree__menu-item">
    <button
        type="button"
        v-if="icon"
        class="app-tree__menu__item"
        @mousedown="onClickButton"
        @blur="onBlurButton">
      <template v-if="loader">
        <app-loader-icon v-if="$data.loading" class="inline-flex"/>
        <i v-else :class="icon" class="fa-fw"/>
      </template>
      <i v-else :class="icon" class="fa-fw"/>
    </button>

    <transition>
      <div v-if="$data.active && actions" class="app-tree__context-menu"
           :class="`app-tree__context-menu__position-`+position">
        <template v-for="action in actions">
          <div v-if="action.title && Object.values(action).length === 1" class="app-tree__context-menu__header">
            {{ action.title }}
          </div>
          <div v-else-if="action.split" class="app-tree__context-menu__split"/>
          <div v-else class="app-tree__context-menu__item" @mousedown="onClickItem(action)">
            <i v-if="hasActiveItem(action)" class="fa fa-check w-4"/>
            <i v-else class="fa w-4"/>
            {{ action.title }}
          </div>
        </template>
      </div>
    </transition>
  </div>
</template>
