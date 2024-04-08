<script>
import { h } from 'vue'

export default {
  __isStatic: true,
  name: 'LayoutTemplate',
  props: ['class'],
  setup (props) {
    return function () {
      return h('div', { class: props.class }, this.$slots)
    }
  }
}
</script>
