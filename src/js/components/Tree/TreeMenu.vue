<template>
  <div class="app-tree__menu">
    <div class="flex items-center grow">
      <template v-for="a in actions.filter(i => i.position === 'left' || !i.position)">
        <tree-menu-item
            v-bind="a"
            :settings="settings"
            :loading="loading"
            @action="action"/>
      </template>
    </div>
    <div class="flex items-center">
      <template v-for="a in actions.filter(i => i.position === 'right')">
        <tree-menu-item
            v-bind="a"
            :settings="settings"
            :loading="loading"
            @action="action"/>
      </template>
    </div>
  </div>
</template>

<script>
import TreeMenuItem from '../../components/Tree/TreeMenuItem.vue'

export default {
  name: 'TreeMenu',
  components: { TreeMenuItem },

  props: {
    actions: Array,
    settings: Object,
    loading: Boolean
  },

  methods: {
    action () {
      if (typeof this[arguments[0]] === 'function') {
        this[arguments[0]](...Array.from(arguments).splice(1))
      } else {
        this.$emit('action', ...arguments)
      }
    },

    reload () {

    }
  }
}
</script>
