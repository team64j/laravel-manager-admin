<template>
  <div class="app-actions-buttons">

    <template v-for="i in data">
      <div v-if="i.data" class="relative">
        <button v-for="ii in i.data.filter((j, kk) => kk === stay)"
                @click="click($event, i.action, stay)"
                class="btn-sm btn-green rounded-r-none">
          <i :class="i.icon"/>
          <i class="fa fa-plus fa-fw"/>
          <i :class="ii.icon"/>
          <span>{{ propLang(i) + ' + ' + ii.title }}</span>
          <i v-if="$store.getters['GlobalTabs/isLoading']"
             class="btn-sm btn-green cursor-progress absolute flex items-center justify-center left-0 top-0 h-full w-full z-10"
             @click.prevent.stop="() => false">
            <app-loader-icon/>
          </i>
        </button>
        <button type="button" class="btn-sm btn-green rounded-l-none relative app-actions-buttons__toggle" @click="isToggle=!isToggle"
                @blur="isToggle=false">
          <i class="fa fa-angle-down fa-fw leading-[0] transition" :class="{ 'transform rotate-180': isToggle }"/>
        </button>
        <div v-show="isToggle" class="app-actions-buttons__save-buttons shadow">
          <button v-for="ii in i.data.filter((j, kk) => kk !== stay)"
                  @mousedown.prevent="click($event, i.action, ii.stay)"
                  class="btn-sm">
            <i class="fa fa-plus fa-fw"/>
            <i :class="ii.icon"/>
            <span>{{ ii.title }}</span>
          </button>
        </div>
      </div>

      <button
          v-else
          type="button"
          class="btn-sm mx-0.5"
          :class="propClasses(i)"
          @click="click($event, i)"
          :data-action="i?.action || i">
        <i class="fa fa-fw" :class="propIcon(i)"/>
        <span>{{ propLang(i) }}</span>
      </button>
    </template>

  </div>
</template>

<script>
import AppLoaderIcon from './LoaderIcon.vue'

export default {
  __isStatic: true,
  name: 'LayoutActionsButtons',
  components: { AppLoaderIcon },
  emits: ['action'],
  props: {
    data: {
      type: Array,
      default: ['cancel', 'delete', 'restore', 'copy', 'view', 'save']
    },
    lang: Object,
    classes: Object,
    to: Object,
    icon: Object
  },

  data () {
    return {
      isToggle: false,
      stay: this.$store.getters['Storage/get']('stay') || 0,
    }
  },

  methods: {
    click (event, action, stay) {
      const to = action.to || this?.to?.[action]
      action = action.action || action

      this.$store.dispatch('set', { action })

      if (to) {
        if (to.close) {
          this.$emit('action', 'closeTab')
        }

        if (to.href) {
          window.open(to.href)
        } else {
          this.$emit('action', 'pushRouter', to)
        }
      } else if (this[action]) {
        this[action](event, stay)
      }
    },

    cancel (event) {
      this.$emit('action', 'cancel', event)
    },

    delete (event) {
      this.$emit('action', 'delete', event)
    },

    clear (event) {
      this.$emit('action', 'clear', event)
    },

    restore (event) {
      this.$emit('action', 'restore', event)
    },

    save (event, stay) {
      this.isToggle = false
      this.stay = stay
      this.$store.dispatch('Storage/set', ['stay', stay])
      this.$emit('action', 'save', stay)
    },

    copy (event) {
      this.$emit('action', 'copy', event)
    },

    view (event) {
      this.$emit('action', 'view', event)
    },

    new (event) {
      if (this.to['new']) {
        this.$emit('action', 'pushRouter', this.to['new'])
      } else {
        this.$emit('action', 'new', event)
      }
    },

    propLang (i) {
      let value = ''
      let action = i

      if (typeof i === 'object') {
        value = i.title
        action = i.action
      }

      return value || this?.lang?.[action] || ''
    },

    propClasses (i) {
      const defaults = {
        delete: 'btn-red',
        save: 'btn-green'
      }

      let value = ''
      let action = i

      if (typeof i === 'object') {
        value = i.class
        action = i.action
      }

      return value || this?.classes?.[action] || defaults[action] || ''
    },

    propIcon (i) {
      let value = ''
      let action = i

      if (typeof i === 'object') {
        value = i.icon
        action = i.action
      }

      return value || this?.icon?.[action] || ''
    }
  }
}
</script>

<style scoped>
.app-actions-buttons {
  @apply fixed z-10 flex rounded-b bg-white/60 dark:bg-gray-700/60 p-2 right-4
}
.app-actions-buttons > button, .app-actions-buttons > div {
  @apply inline-flex mx-0.5
}
.app-actions-buttons button:not(.app-actions-buttons__toggle) > i.fa {
  @apply md:hidden
}
.app-actions-buttons button span {
  @apply hidden md:inline-block px-1
}
.app-actions-buttons button.app-actions-buttons__toggle::before {
  @apply block absolute left-[-1px] top-[10%] h-[80%] w-[1px] bg-white/20;
  content: "";
}
.app-actions-buttons .app-actions-buttons__save-buttons {
  @apply absolute left-0 top-full mt-0.5 w-full flex flex-col opacity-100 visible transition
}
.app-actions-buttons .app-actions-buttons__save-buttons button {
  @apply border-t-0 rounded-none first:rounded-t last:rounded-b
}
</style>
