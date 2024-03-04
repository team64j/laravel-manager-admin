<script>
import AppLoaderIcon from '../Layout/LoaderIcon.vue'

export default {
  name: 'TreeMenuItem',
  components: { AppLoaderIcon },
  props: ['icon', 'loader', 'click', 'position', 'actions', 'settings'],
  data () {
    return {
      active: false,
      loading: false
    }
  },
  methods: {
    blur () {
      this.$nextTick(() => this.active = false)
    },
    check (action) {
      if (this.settings[action.key] !== undefined) {
        if (Array.isArray(this.settings[action.key])) {
          return ~this.settings[action.key].indexOf(action.value)
        } else {
          return this.settings[action.key] === action.value
        }
      }

      return false
    },
    clickItem () {
      this.active = !this.active

      if (this.click) {
        this.$emit('action', `menu${this.click.charAt(0).toUpperCase() + this.click.slice(1)}`)
      }
    },
    clickAction (action) {
      this.active = !this.active

      if (action.toggle) {
        if (Array.isArray(this.settings[action.key])) {
          const index = this.settings[action.key].indexOf(action.value)
          if (~index) {
            this.settings[action.key].splice(index, 1)
          } else {
            this.settings[action.key].push(action.value)
          }
        } else {
          this.settings[action.key] = action.value
        }
        this.$emit('action', 'menuUpdate')
      }
    }
  }
}
</script>

<template>
  <div class="app-tree__menu-item">
    <button
        type="button"
        v-if="icon"
        class="app-tree__menu__item"
        @mousedown="clickItem"
        @blur="blur">
      <template v-if="loader">
        <app-loader-icon v-if="loading" class="inline-flex"/>
        <i v-else :class="icon" class="fa-fw"/>
      </template>
      <i v-else :class="icon" class="fa-fw"/>
    </button>

    <transition>
      <div v-if="active && actions" class="app-tree__context-menu"
           :class="[position !== 'right' ? 'left-0' : 'right-0']">
        <template v-for="action in actions">
          <div v-if="action.title && Object.values(action).length === 1" class="app-tree__context-menu__header">
            {{ action.title }}
          </div>
          <div v-else-if="action.split" class="app-tree__context-menu__split"/>
          <div v-else class="app-tree__context-menu__item" @mousedown="clickAction(action)">
            <i v-if="check(action)" class="fa fa-check w-4"/>
            <i v-else class="fa w-4"/>
            {{ action.title }}
          </div>
        </template>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.app-tree__menu-item {
  @apply relative
}
.app-tree__menu-item button {
  @apply flex justify-center items-center w-6 h-6 mx-0.5 p-0 border-0
}
.app-tree__menu-item .app-tree__context-menu {
  @apply absolute top-full left-auto m-1
}
</style>
