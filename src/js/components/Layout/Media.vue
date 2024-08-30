<script>
import { h } from 'vue'

export default {
  __isStatic: true,
  name: 'Media',
  props: {
    data: Object,
    modelValue: [String, Object]
  },
  setup (props) {
    return () => h('div', {
      class: 'border'
    }, [
      ~props.data['type'].indexOf('image/') && h('img', {
        src: props.data['url'],
        class: 'w-auto h-auto max-w-full max-h-full'
      })
    ])
  }
}
</script>
