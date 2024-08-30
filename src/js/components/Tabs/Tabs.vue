<script>
import('./Tabs.css')
import router from '../../router'
import store from '../../store'
import { h, reactive, ref, renderSlot, watch } from 'vue'

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
    const data = reactive({
      index: props.data.findIndex(i => i.id === store.getters.get(`Session.${keyStorage}`, null))
    })

    if (props.history) {
      if (typeof props.history === 'string') {
        data.index = props.data.findIndex(i => i.id === router.currentRoute.value.params[props.history])
        props.data.forEach(i => i.active = i.render = i.id === data.index)

        watch(
            () => router.currentRoute.value.params[props.history],
            a => {
              if (!a) {
                return
              }

              const index = props.data.findIndex(i => i.id === a)

              if (data.index !== index) {
                data.index = index
              }
            }
        )
      } else {

        props.data.forEach((i, k) => {
          if (!i.route) {
            return
          }

          if (router.parse(i.route)['path'] === router.currentRoute.value.path) {
            data.index = k
          }
        })
      }
    } else if (!props.data.some((i, k) => k === data.index) && props.data[0]) {
      data.index = 0
      props.data[0].active = props.data[0].render = true
    } else {
      props.data.forEach((i, k) => i.active = i.render = k === data.index)
    }

    const select = (tab, index) => {
      props.data.forEach((i, k) => i.active = i.render = k === index)

      data.index = index

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

    return () => h('div',
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
                      ref: refRows,
                      onVnodeUpdated (ctx) {
                        let right = 0,
                            width = 0

                        ctx.el.querySelectorAll('.app-tabs__tab').forEach((t, i) => {
                          t.styles = getComputedStyle(t)

                          if (i <= data.index) {
                            width += t.offsetWidth + parseFloat(t.styles.marginLeft) + parseFloat(t.styles.marginRight)

                            if (i < data.index) {
                              right += t.offsetWidth + parseFloat(t.styles.marginLeft)
                            }
                          }
                        })

                        if (ctx.el.scrollLeft > right) {
                          ctx.el.scrollLeft = right
                        }

                        if (ctx.el.offsetWidth < width) {
                          ctx.el.scrollLeft = width - refRows.value.offsetWidth
                        }
                      }
                    },
                    props.data.map((i, k) => h('div',
                            {
                              class: [
                                'app-tabs__tab',
                                k === data.index ? 'app-tabs__tab-active' : ''
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
                    class: 'fa fa-angle-left app-tabs__prev disabled',
                    onVnodeUpdated (ctx) {
                      ctx.el.classList.toggle('app-tabs__disabled', !data.index)
                    },
                    onMousedown () {
                      const index = data.index - 1

                      if (props.data[index]) {
                        select(props.data[index], index)
                      }
                    }
                  }),
                  h('i', {
                    class: 'fa fa-angle-right app-tabs__next disabled',
                    onVnodeUpdated (ctx) {
                      ctx.el.classList.toggle('app-tabs__disabled', !props.data[data.index + 1])
                    },
                    onMousedown () {
                      const index = data.index + 1

                      if (props.data[index]) {
                        select(props.data[index], index)
                      }
                    }
                  })
                ]
              ].filter(i => i)
          ),
          ...props.data.map((i, k) => {
            if (props.history || (i['needUpdate'] && k === data.index) || !i['needUpdate']) {
              return h('div',
                  {
                    id: props.id + `Tab-` + i.id,
                    class: [
                      'app-tabs__page',
                      i.class
                    ],
                    style: k !== data.index ? { display: 'none' } : void 0
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
</script>
