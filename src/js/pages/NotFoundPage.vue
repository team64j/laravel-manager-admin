<script>
import { h } from 'vue'

export default {
  name: 'NotFoundPage',
  created () {
    this.$emit('action', 'setTab', {
      meta: { title: 'Page not found' },
      changed: false
    })
  },
  setup () {
    return () => h('div',
        { class: 'p-8' },
        h('h1',
            { class: 'text-2xl text-center', innerHTML: 'Page not found' }
        )
    )
  }
}
</script>
