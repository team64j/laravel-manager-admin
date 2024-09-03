<script>
import('./Actions.css')
import { h } from 'vue'
import store from '../../store'
import Button from '../Form/Button.vue'

export default {
  __isStatic: true,
  name: 'Actions',
  components: { Button },
  emits: ['action'],
  props: {
    data: Array
  },
  setup (props, { emit }) {
    function click (params, stay) {
      if (params.to) {
        if (params.to.href) {
          window.open(params.to.href)
        } else if (params.to.path) {
          emit('action', 'pushRouter', params.to)
        }

        if (params.to.close) {
          emit('action', 'closeTab')
        }

        return
      }

      params = params.action ?? { action: params }

      if (typeof params === 'string') {
        params = {
          action: params
        }
      }

      if (stay !== undefined) {
        store.dispatch('Storage/set', ['stay', stay])
      }

      emit('action', 'submit', { ...params, stay })
    }

    return props.data.length && (() => {
      const stay = store.getters['Storage/get']('stay') || 0

      return h('div', {
        class: 'app-actions'
      }, props.data.map(i => {
        if (i.data) {
          return h('div', {
                class: 'app-actions__group'
              },
              [].concat(i.data.filter((j, k) => k === stay).map(j => {
                return h(Button, {
                  icon: j.icon,
                  class: i.class,
                  value: i.title + ' + ' + j.title,
                  loader: store.getters.get('tabsLoading'),
                  onClick: () => click(i)
                })
              })).concat(
                  h(Button, {
                    class: ['app-actions__toggle', i.class]
                  }, () => [
                    h('i', { class: 'fa fa-angle-down fa-fw' })
                  ])
              ).concat(h('div', {
                class: 'app-actions__save-buttons'
              }, i.data.filter((j, k) => k !== stay).map(j => {
                return h(Button, {
                  icon: j.icon,
                  class: i.class,
                  value: j.title,
                  loader: store.getters.get('tabsLoading'),
                  onMousedown: () => click(i, j.stay)
                }, {
                  icon: () => [
                    h('i', { class: i.icon }),
                    h('i', { class: 'fa fa-plus fa-fw' })
                  ]
                })
              })))
          )
        } else {
          return h(Button, {
            icon: i.icon,
            value: '<span>' + i.title + '</span>',
            class: i.class,
            onClick: () => click(i)
          })
        }
      }))
    })
  }
}
</script>
