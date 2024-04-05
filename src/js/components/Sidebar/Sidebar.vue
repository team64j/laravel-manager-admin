<script>
import Component from '../Layout/Component.vue'
import { h } from 'vue'

import ('./Sidebar.css')

export default {
  name: 'Sidebar',
  components: { Component },
  props: {
    layout: [Object, Array]
  },
  methods: {
    action () {
      if (typeof this[arguments[0]] === 'function') {
        this[arguments[0]](...Array.from(arguments).splice(1))
      } else {
        this.$emit('action', ...arguments)
      }
    }
  },
  setup () {
    return function () {
      return h('div', {
            class: 'app-sidebar'
          }, [
            h(Component, {
              layout: this.layout,
              class: 'w-full h-full',
              onAction: this.action
            })
          ]
      )
    }
  }
}
</script>
