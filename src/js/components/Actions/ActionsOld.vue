<script>
import Button from '../Form/Button.vue'

import('./Actions.css')

export default {
  //__isStatic: true,
  name: 'Actions',
  components: { Button },
  emits: ['action'],
  props: {
    data: Array,
    lang: Object,
    classes: Object,
    route: Object,
    icon: Object
  },

  data () {
    return {
      stay: this.$store.getters['Storage/get']('stay') || 0,
    }
  },

  methods: {
    click (event, action, stay) {
      const route = action.route || this?.route?.[action]
      let name = action.action || action

      this.$store.dispatch('set', { action })

      if (typeof name === 'object') {
        this.custom({ event, stay, action: name })
      }

      if (route) {
        if (route.close) {
          this.$emit('action', 'closeTab')
        }

        if (route.href) {
          window.open(route.href)
        } else if (route.path || route.name) {
          this.$emit('action', 'pushRouter', route)
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
      if (this.route['new']) {
        this.$emit('action', 'pushRouter', this.route['new'])
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
  <div v-if="data?.length" class="app-actions">

    <template v-for="i in data">
      <div v-if="i.data" class="app-actions__group">
        <Button v-for="ii in i.data.filter((j, kk) => kk === stay)"
                :icon="ii.icon"
                :class="i.class"
                :value="propLang(i) + ' + ' + ii.title"
                :loader="$store.getters.get('tabsLoading')"
                @click="click($event, i.action, stay)"
        >
          <template #icon>
            <i :class="i.icon"/>
            <i class="fa fa-plus fa-fw"/>
          </template>
        </Button>

        <Button class="app-actions__toggle" :class="i.class">
          <i class="fa fa-angle-down fa-fw"/>
        </Button>

        <div class="app-actions__save-buttons">
          <Button v-for="ii in i.data.filter((j, kk) => kk !== stay)"
                  :icon="ii.icon"
                  :class="i.class"
                  :value="ii.title"
                  @mousedown="click($event, i.action, ii.stay)">
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
              @click="click($event, i)"/>

    </template>

  </div>
</template>
