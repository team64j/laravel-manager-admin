<script>
import('./Tabs.css')
import router from '../../router'
import store from '../../store'
import { h, onMounted, reactive, ref, renderSlot, watch } from 'vue'

export default {
  __isStatic: true,
  name: 'Tabs',
  emits: ['action'],
  props: {
    id: {
      type: String,
      default: 'v-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
    },
    data: {
      type: [null, Array],
      default: []
    },
    uid: String,
    history: [Boolean, String],
    loadOnce: Boolean,
    watch: Boolean,
    vertical: {
      type: Boolean,
      default: false
    },
    navigation: {
      type: Boolean,
      default: true
    },
    smallTabs: Boolean
  },
  setup (props, { emit, slots }) {
    const keyStorage = `tabs.` + props.id.toLowerCase()
    const refRows = ref()
    const refPrev = ref()
    const refNext = ref()
    const data = reactive({
      active: store.getters.get(`Session.${keyStorage}`, null)
    })

    if (props.history) {
      if (typeof props.history === 'string') {
        data.active = router.currentRoute.value.params[props.history]
        props.data.forEach(i => i.active = i.render = i.id === data.active)

        watch(
            () => router.currentRoute.value.params[props.history],
            a => {
              if (!a) {
                return
              }

              if (data.active !== a) {
                data.active = a
              }
            }
        )
      } else {
        data.active = null

        props.data.forEach(i => {
          if (!i.route) {
            return
          }

          if (router.parse(i.route)['path'] === router.currentRoute.value.path) {
            data.active = i.id
          }
        })
      }
    } else if (!props.data.some(i => i.id === data.active) && props.data[0]) {
      data.active = props.data[0].id
      props.data[0].active = props.data[0].render = true
    } else {
      props.data.forEach(i => i.active = i.render = i.id === data.active)
    }

    const init = (index) => {
      let right = 0,
          width = 0

      if (refRows.value) {
        refRows.value.styles = getComputedStyle(refRows.value)

        refRows.value.querySelectorAll('.app-tabs__tab').forEach((t, i) => {
          t.styles = getComputedStyle(t)

          if (i <= index) {
            width += t.offsetWidth + parseFloat(t.styles.marginLeft) + parseFloat(t.styles.marginRight)

            if (i < index) {
              right += t.offsetWidth + parseFloat(t.styles.marginLeft)
            }
          }
        })

        if (refRows.value.scrollLeft > right) {
          refRows.value.scrollLeft = right
        }

        if (refRows.value.offsetWidth < width) {
          refRows.value.scrollLeft = width - refRows.value.offsetWidth
        }
      }

      if (refPrev.value) {
        if (index) {
          refPrev.value.classList.remove('app-tabs__disabled')
        } else {
          refPrev.value.classList.add('app-tabs__disabled')
        }
      }

      if (refNext.value) {
        if (props.data[index + 1]) {
          refNext.value.classList.remove('app-tabs__disabled')
        } else {
          refNext.value.classList.add('app-tabs__disabled')
        }
      }
    }

    const select = (tab, index) => {
      init(index)

      props.data.forEach(i => i.active = i.render = i.id === tab.id)

      data.active = tab.id

      store.dispatch('set', { [`Session.${keyStorage}`]: tab.id })

      if (props.history) {
        if (typeof props.history === 'string') {
          this.$emit('action', 'pushRouter', {
            params: {
              [props.history]: tab.id
            },
            meta: {
              group: true
            }
          })
        } else {
          emit('action', 'pushRouter', {
            ...router.parse(tab.route),
            meta: {
              group: true
            }
          })
        }
      }
    }

    onMounted(() => init(props.data.findIndex(i => i.id === data.active)))

    return () => {
      return h('div',
          {
            id: props.id + 'Tabs',
            class: [
              'app-tabs',
              props.vertical ? 'app-tabs__vertical' : '',
              props.smallTabs ? 'app-tabs-small' : 'app-tabs-large',
              props.navigation ? 'app-tabs__with-navigation' : '',
              props.data.length === 1 ? 'app-tabs__without-rows' : ''
            ]
          },
          [
            props.data.length > 1 && h('div',
                {
                  class: 'app-tabs__rows'
                },
                [
                  h('div',
                      {
                        class: 'app-tabs__row',
                        ref: refRows
                      },
                      props.data.map((i, k) => h('div',
                              {
                                class: [
                                  'app-tabs__tab',
                                  i.id === data.active ? 'app-tabs__tab-active' : ''
                                ],
                                'data-tooltip': i.title,
                                onMousedown: () => select(i, k)
                              },
                              [
                                i.icon ? h('i', { class: ['app-tabs__tab-icon', i.icon] }) : null,
                                i.name ? h('span', i.name) : null
                              ]
                          )
                      )
                  ),
                  props.navigation && [
                    h('i', {
                      ref: refPrev,
                      class: 'fa fa-angle-left app-tabs__prev disabled',
                      onMousedown () {
                        const index = props.data.findIndex(i => i.id === data.active) - 1

                        if (props.data[index]) {
                          select(props.data[index], index)
                        }
                      }
                    }),
                    h('i', {
                      ref: refNext,
                      class: 'fa fa-angle-right app-tabs__next disabled',
                      onMousedown () {
                        const index = props.data.findIndex(i => i.id === data.active) + 1

                        if (props.data[index]) {
                          select(props.data[index], index)
                        }
                      }
                    })
                  ]
                ].filter(i => i)
            ),
            ...props.data.map(i => {
              if (props.history || (i['needUpdate'] && i.id === data.active) || !i['needUpdate']) {
                return h('div',
                    {
                      id: props.id + `Tab-` + i.id,
                      class: [
                        'app-tabs__page',
                        i.class
                      ],
                      style: i.id !== data.active ? { display: 'none' } : void 0
                    },
                    slots[i.id] && renderSlot(slots, i.id, i) || h('div', {
                      class: 'grow flex items-center justify-center w-full h-full'
                    }, [
                      h('i',
                          {
                            class: 'inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin'
                          }
                      )
                    ])
                )
              }
            })
          ].filter(i => i)
      )
    }
  }
}
</script>
