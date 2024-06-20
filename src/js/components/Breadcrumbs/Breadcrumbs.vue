<script>
import { h } from 'vue'
import { RouterLink } from 'vue-router'

export default {
  __isStatic: true,
  name: 'Breadcrumbs',
  props: {
    data: Array
  },
  setup (props) {
    const slots = []

    props.data.forEach(i => {
      if (i.to) {
        slots.push(h(RouterLink, {
          class: 'app-breadcrumbs__item truncate max-w-48 hover:opacity-80',
          title: i.title,
          to: i.to,
          'data-tooltip': i.tooltip,
          innerHTML: i.name ?? i.title
        }))
      } else {
        slots.push(h('div', {
          class: 'app-breadcrumbs__item truncate max-w-48 hover:opacity-80',
          title: i.title,
          'data-tooltip': i.tooltip,
          innerHTML: i.name ?? i.title
        }))
      }
      slots.push(h('i',
          { class: 'fa fa-angle-right opacity-60 leading-[0] mx-4 last-of-type:hidden', style: { fontSize: '70%' } }))
    })

    return () => h('div', { class: 'app-breadcrumbs flex items-center px-2 py-1 text-sm' }, slots)
  }
}
</script>
