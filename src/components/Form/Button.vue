<script>
import Field from './Field.vue'
import { h, renderSlot } from 'vue'

export default {
  __isStatic: true,
  name: 'Button',
  extends: Field,
  props: {
    icon: String,
    type: {
      default: 'button'
    },
    loader: Boolean
  },
  setup (props, { slots }) {
    return () => h('button', {
      type: props.type,
      class: ['btn-sm relative', props.class]
    }, [
      renderSlot(slots, 'icon'),
      props.icon && h('i', { class: ['fa fa-fw', props.icon] }),
      props.value && h('span', { innerHTML: props.value }),
      renderSlot(slots, 'default'),
      props.loader && h('span', {
        class: 'absolute !flex items-center justify-center left-0 top-0 h-full w-full bg-inherit',
        onClick (event) {
          event.preventDefault()
          event.stopPropagation()
          return false
        }
      }, [
        h('i', {
          class: 'inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin'
        })
      ])
    ])
  }
}
</script>
