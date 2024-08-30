<script>
import { compile, h } from 'vue'

export default {
  __isStatic: true,
  name: 'RenderString',
  props: {
    string: {
      required: true,
      type: String
    }
  },
  setup (props) {
    return () => h(
        compile(
            props.string.replace(/href=/g, 'to=').
                replace(/<a(.*?)>/g, '<router-link$1>').
                replace(/(<\/a>)/g, '</router-link>')
        )
    )
  }
}
</script>
