<!--<script>
import('./Tabs.css')
import { h, reactive, ref, renderSlot, watch } from 'vue'
import router from '../../router'
import store from '../../store'

export default {
  __isStatic: true,
  name: 'Tabs',
  emits: ['action', 'update:props'],
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

    let positionX = 0
    let scrollLeft = 0
    let dragging = ref(false)

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

              if (index >= 0 && data.index !== index) {
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

    const init = () => {
      let right = 0,
          width = 0

      refRows.value.querySelectorAll('.app-tabs__tab').forEach((t, i) => {
        t.styles = getComputedStyle(t)

        if (i <= data.index) {
          width += t.offsetWidth + parseFloat(t.styles.marginLeft) + parseFloat(t.styles.marginRight)

          if (i < data.index) {
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

    const select = (tab, index) => {
      if (dragging.value) {
        return
      }

      props.data.forEach((i, k) => i.active = i.render = k === index)

      data.index = index

      store.dispatch('set', { [`Session.${keyStorage}`]: tab.id })

      if (props.history) {
        if (typeof props.history === 'string') {
          emit('action', 'pushRouter', {
            params: {
              [props.history]: tab.id
            },
            meta: {
              group: true
            }
          })
        } else {
          //router.to(tab.route)
          // emit('update:props', props)
          emit('action', 'pushRouter', {
            ...router.parse(tab.route),
            meta: {
              group: true
            }
          })
        }
      }

      init()
    }

    const drag = event => {
      dragging.value = false
      positionX = event.clientX
      scrollLeft = refRows.value.scrollLeft
      refRows.value.addEventListener('mousemove', move)
      document.addEventListener('mouseup', end)
    }

    const move = event => {
      const l = positionX - event.clientX
      if (Math.abs(l)) {
        dragging.value = true
        refRows.value.scrollLeft = scrollLeft + l
      }
    }

    const end = (event) => {
      refRows.value.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', end)
      setTimeout(() => dragging.value = false, 10)
      event.preventDefault()
      event.stopPropagation()
    }

    return () => h('div',
        {
          id: props.id + 'Tabs',
          class: [
            'app-tabs',
            props.vertical ? 'app-tabs__vertical' : '',
            props.smallTabs ? 'app-tabs-small' : 'app-tabs-large',
            props.navigation ? 'app-tabs__with-navigation' : '',
            props.data.length === 1 ? 'app-tabs__without-rows' : '',
            dragging.value ? 'app-tabs__dragging' : ''
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
                      onMousedown: drag
                    },
                    props.data.map((i, k) => h('div',
                            {
                              class: [
                                'app-tabs__tab',
                                k === data.index ? 'app-tabs__tab-active' : ''
                              ],
                              'data-tooltip': i.title,
                              onClick: () => select(i, k)
                            },
                            [
                              i.icon ? h('i', { class: ['app-tabs__tab-icon', i.icon] }) : null,
                              i.name ? h('span', i.name) : null
                            ]
                        )
                    )
                ),
                /*props.navigation && [
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
                ]*/
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
</script>-->

<script setup>
import('./Tabs.css')
import { computed, defineOptions, defineProps, ref, watch } from 'vue'
import store from '../../store'
import router from '../../router'

defineOptions({
  __isStatic: true,
  name: 'Tabs'
})

const props = defineProps({
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
})
const slots = defineSlots()
const emit = defineEmits(['action', 'update:props'])

const refRows = ref()

const keyStorage = `tabs.` + props.id.toLowerCase()
const index = ref(props.data.findIndex(i => i.id === store.getters.get(`Session.${keyStorage}`, null)))

let positionX = 0
let scrollLeft = 0
let dragging = ref(false)

const classes = computed(() => [
  props.vertical ? 'app-tabs__vertical' : '',
  props.smallTabs ? 'app-tabs-small' : 'app-tabs-large',
  props.navigation ? 'app-tabs__with-navigation' : '',
  props.data.length === 1 ? 'app-tabs__without-rows' : '',
  dragging.value ? 'app-tabs__dragging' : ''
])

if (props.history) {
  if (typeof props.history === 'string') {
    index.value = props.data.findIndex(i => i.id === router.currentRoute.value.params[props.history])
    props.data.forEach(i => i.active = i.render = i.id === index.value)

    watch(
        () => router.currentRoute.value.params[props.history],
        a => {
          if (!a) {
            return
          }

          const key = props.data.findIndex(i => i.id === a)

          if (key >= 0 && index.value !== key) {
            index.value = key
          }
        }
    )
  } else {
    props.data.forEach((i, k) => {
      if (!i.route) {
        return
      }

      if (router.parse(i.route)['path'] === router.currentRoute.value.path) {
        index.value = k
      }
    })
  }
} else if (!props.data.some((i, k) => k === index.value) && props.data[0]) {
  index.value = 0
  props.data[0].active = props.data[0].render = true
} else {
  props.data.forEach((i, k) => i.active = i.render = k === index.value)
}

const init = () => {
  let right = 0,
      width = 0

  refRows.value.querySelectorAll('.app-tabs__tab').forEach((t, i) => {
    t.styles = getComputedStyle(t)

    if (i <= index.value) {
      width += t.offsetWidth + parseFloat(t.styles.marginLeft) + parseFloat(t.styles.marginRight)

      if (i < index.value) {
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

const select = (tab, key) => {
  if (dragging.value) {
    return
  }

  props.data.forEach((i, k) => i.active = i.render = k === key)

  index.value = key

  store.dispatch('set', { [`Session.${keyStorage}`]: tab.id })

  if (props.history) {
    if (typeof props.history === 'string') {
      emit('action', 'pushRouter', {
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

  init()
}

const drag = event => {
  if (event.button !== 0) {
    return
  }

  dragging.value = false
  positionX = event.clientX
  scrollLeft = refRows.value.scrollLeft
  refRows.value.addEventListener('mousemove', move)
  document.addEventListener('mouseup', end)
}

const move = event => {
  const l = positionX - event.clientX
  if (Math.abs(l)) {
    dragging.value = true
    refRows.value.scrollLeft = scrollLeft + l
  }
}

const end = (event) => {
  refRows.value.removeEventListener('mousemove', move)
  document.removeEventListener('mouseup', end)
  setTimeout(() => dragging.value = false, 10)
  event.preventDefault()
  event.stopPropagation()
}
</script>

<template>
  <div :id="id + 'Tabs'" :class="['app-tabs', classes]">
    <div v-if="data.length > 1" class="app-tabs__rows">
      <div class="app-tabs__row" ref="refRows" @mousedown="drag">
        <button v-for="(i, k) in data"
                :class="['app-tabs__tab', k === index ? 'app-tabs__tab-active' : '']"
                :data-tooltip="i.title"
                @click="select(i, k)">
          <i v-if="i.icon" :class="['app-tabs__tab-icon', i.icon]"/>
          <span v-if="i.name">{{ i.name }}</span>
        </button>
      </div>
    </div>

    <template v-for="(i, k) in data">
      <div v-if="history || (i['needUpdate'] && k === index) || !i['needUpdate']"
           v-show="k === index"
           :id="id + `Tab-` + i.id"
           :class="['app-tabs__page', i.class]">
        <slot v-if="slots[i.id]" :name="i.id"/>
        <div v-else class="grow flex items-center justify-center w-full h-full">
          <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
        </div>
      </div>
    </template>
  </div>
</template>
