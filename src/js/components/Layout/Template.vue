<script>
import { h } from 'vue'

export default {
  __isStatic: true,
  name: 'Template',
  props: ['class'],
  setup (props, { slots }) {
    return () => h('div', { class: props.class }, slots)
  }
}
</script>
