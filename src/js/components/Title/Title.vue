<script>
import { h, reactive, Transition } from 'vue'
import router from '../../router'

export default {
  __isStatic: true,
  name: 'Title',
  props: {
    id: [String, Number],
    modelValue: String,
    title: String,
    icon: String,
    help: String
  },
  setup (props) {
    const route = router.currentRoute.value
    const value = props.modelValue ?? props.title ?? route?.meta?.['title']
    const id = props.id || route.params['id'] && parseInt(route.params['id'].toString()) || undefined
    const data = reactive({
      show: false
    })

    return () => {
      return value !== undefined && (h('div', {
        class: 'app-title w-full p-4'
      }, [
        h('h1', {
          class: 'app-title h4 m-0 whitespace-nowrap flex items-center'
        }, [
          (props.icon || route.meta['icon']) && h('i', {
            class: [
              'mr-2 mt-1 w-6 text-center text-gray-600 dark:text-gray-200 shrink-0',
              props.icon || route.meta['icon']
            ]
          }),
          h('span', {
            class: 'text-2xl h-8 font-bold truncate'
          }, value),
          id && h('span', {
            class: 'ml-2'
          }, `(${id})`),
          props.help && h('i', {
            class: 'far fa-question-circle ml-2 cursor-pointer text-gray-300 hover:opacity-80',
            onClick () {
              data.show = !data.show
            }
          })
        ]),
        props.help && h(Transition, {
          mode: 'in-out'
        }, {
          default: (() => data.show && h('div', {
            class: 'app-alert app-alert__blue mt-3',
            innerHTML: props.help
          }))
        })
      ]))
    }
  }
}
</script>
