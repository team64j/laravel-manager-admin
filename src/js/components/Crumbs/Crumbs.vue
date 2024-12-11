<script>
import { h } from 'vue'
import { RouterLink } from 'vue-router'

export default {
  __isStatic: true,
  name: 'Crumbs',
  props: {
    data: Array
  },
  setup (props) {
    return () => h('div',
        {
          class: 'app-crumbs flex items-center px-2 py-1 text-sm bg-slate-50 dark:bg-gray-750'
        },
        props.data.map(i => [
              i.to ? h(RouterLink, {
                class: 'app-crumbs__item truncate max-w-48 hover:opacity-80',
                title: i.title,
                to: i.to,
                'data-tooltip': i.tooltip,
                innerHTML: i.name ?? i.title
              }) : h('div', {
                class: 'app-crumbs__item truncate max-w-48 hover:opacity-80',
                title: i.title,
                'data-tooltip': i.tooltip,
                innerHTML: i.name ?? i.title
              }),
              h('i',
                  {
                    class: 'fa fa-angle-right opacity-60 leading-[0] mx-4 last-of-type:hidden',
                    style: { fontSize: '70%' }
                  }
              )
            ]
        ))
  }
}
</script>
