<script>
import Button from '../Form/Button.vue'

import('./ActionsButtons.css')

export default {
  __isStatic: true,
  name: 'ActionsButtons',
  components: { Button },
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
      let name = action.action || action

      this.$store.dispatch('set', { action })

      if (typeof name === 'object') {
        this.custom({ event, stay, action: name })
      }

      if (to) {
        if (to.close) {
          this.$emit('action', 'closeTab')
        }

        if (to.href) {
          window.open(to.href)
        } else if (to.path || to.name) {
          this.$emit('action', 'pushRouter', to)
        }
      } else if (this[name]) {
        this[name]({ event, stay, action })
      }
    },

    custom () {
      this.$emit('action', 'custom', ...arguments)
    },

    cancel () {
      this.$emit('action', 'cancel', ...arguments)
    },

    delete () {
      this.$emit('action', 'delete', ...arguments)
    },

    clear () {
      this.$emit('action', 'clear', ...arguments)
    },

    restore () {
      this.$emit('action', 'restore', ...arguments)
    },

    save ({ stay }) {
      this.isToggle = false
      this.stay = stay
      this.$store.dispatch('Storage/set', ['stay', stay])
      this.$emit('action', 'save', ...arguments)
    },

    copy () {
      this.$emit('action', 'copy', arguments)
    },

    view () {
      this.$emit('action', 'view', arguments)
    },

    new () {
      if (this.to['new']) {
        this.$emit('action', 'pushRouter', this.to['new'])
      } else {
        this.$emit('action', 'new', arguments)
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
        save: 'btn-green',
        delete: 'btn-red',
        restore: 'btn-blue',
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

<template>
  <div class="app-actions-buttons">

    <template v-for="i in data">
      <div v-if="i.data" class="relative">
        <Button v-for="ii in i.data.filter((j, kk) => kk === stay)"
                class="btn-green rounded-r-none"
                :icon="ii.icon"
                :value="propLang(i) + ' + ' + ii.title"
                :loader="$store.getters.get('tabsLoading')"
                @click="click($event, i.action, stay)"
        >
          <template #icon>
            <i :class="i.icon"/>
            <i class="fa fa-plus fa-fw"/>
          </template>
        </Button>

        <Button
            class="btn-green rounded-l-none relative app-actions-buttons__toggle"
            :icon="`fa fa-angle-down fa-fw leading-[0] transition` + (isToggle ? ' transform rotate-180' : '')"
            @click="isToggle=!isToggle"
        />

        <div v-show="isToggle" class="app-actions-buttons__save-buttons shadow">
          <Button v-for="ii in i.data.filter((j, kk) => kk !== stay)"
                  :icon="ii.icon"
                  :value="ii.title"
                  @mousedown.prevent="click($event, i.action, ii.stay)">
            <template #icon>
              <i :class="i.icon"/>
              <i class="fa fa-plus fa-fw"/>
            </template>
          </Button>
        </div>
      </div>

      <Button v-else
              :icon="propIcon(i)"
              :value="`<span>` + propLang(i) + `</span>`"
              :class="propClasses(i)"
              @click="click($event, i)"
      />

    </template>

  </div>
</template>
