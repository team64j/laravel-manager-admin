<script>
import { h } from 'vue'
import { RouterLink } from 'vue-router'
import GlobalMenuItem from './GlobalMenuItem.vue'

export default {
  props: {
    data: {
      type: Object,
      default: {}
    },
    level: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      timer: 0,
      filter: '',
      loading: false,
      model: this.data
    }
  },
  computed: {
    classEl () {
      let c = ''
      if (this.model?.['data']?.length || this.model?.['url']) {
        c += 'app-global-menu__parent'
      }

      return c
    },
    node () {
      let node
      let slots = []
      let className = [this.model['class'] || '']

      // icon
      let icon = null
      if (this.model['values']) {
        let value = this.model['value'] ?? this.$store.getters.get('Storage.root.' + this.model['key'])
        let item = this.model['values'].filter(i => i.value === value)[0]

        if (item === undefined) {
          item = this.model['values'][0]
          this.$store.dispatch('set', { ['Storage.root.' + this.model['key']]: item.value })
        }

        this.model['icon'] = item.icon ?? this.model['icon']
        this.model['name'] = item.name
        this.model['title'] = item.title
      }

      icon = icon ?? this.model['icon']

      if (icon) {
        if (/^https?:\/\/?/.test(icon)) {
          slots.push(
              h('img', {
                src: icon
              })
          )
        } else if (icon[0] === '<') {
          slots.push(
              h('span', {
                innerHTML: icon
              })
          )
        } else {
          slots.push(
              h('i', {
                class: 'app-global-menu__icon ' + icon
              })
          )
        }
      }

      // name
      if (this.model['name']) {
        slots.push(
            h('span', {
              class: 'app-global-menu__title',
              innerText: this.model['name']
            })
        )
      }

      // locked
      if (this.model['locked']) {
        slots.push(
            h('i', { class: 'app-global-menu__locked fa fa-lock' })
        )
      }

      // disabled
      if (this.model['disabled']) {
        className.push('app-global-menu__disabled')
      }

      // id
      if (this.model['id'] !== undefined) {
        slots.push(
            h('span', {
              class: 'app-global-menu__id',
              innerText: this.model['id']
            })
        )
      }

      if (this.loading) {
        slots.push(
            h('span', {
                  class: 'app-global-menu__toggle'
                },
                h('i', {
                      class: 'inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin'
                    }
                )
            )
        )
      } else if ((this.model['data']?.length && this.level) || this.model['url']) {
        slots.push(
            h('span', {
              class: 'app-global-menu__toggle'
                },
                h('i', {
                  class: 'fa fa-angle-down fa-fw leading-[0]'
                })
            )
        )
      }

      // link
      if (this.model['href']) {
        node = h('a', {
          href: this.model['href'],
          target: '_blank',
          class: className,
          'data-tooltip': this.model['title']
        }, [slots])
      }
      // router link
      else if (this.model['to']) {
        node = h(RouterLink, {
          to: this.model['to'],
          class: className,
          'data-tooltip': this.model['title']
        }, () => slots)
      }
      // pagination
      else if (this.model['prev'] || this.model['next']) {
        className.push('app-global-menu__pagination')

        node = h('div', {
          class: className,
          'data-tooltip': this.model['title']
        }, [
          // prev
          h('i', {
            class: 'fa fa-chevron-left app-global-menu__prev',
            disabled: this.model['prev'] ? undefined : 'disabled',
            onClick: (event) => {
              if (this.model['prev']) {
                event.stopPropagation()
                this.$emit('action', 'loadData', this.model['prev'], this.$parent)
              }
            }
          }),
          // info
          h('span', this.model['info'] ?? this.model['total']),
          // next
          h('i', {
            class: 'fa fa-chevron-right app-global-menu__next',
            disabled: this.model['next'] ? undefined : 'disabled',
            onClick: (event) => {
              if (this.model['next']) {
                event.stopPropagation()
                this.$emit('action', 'loadData', this.model['next'], this.$parent)
              }
            }
          })
        ])
      }
      // filter
      else if (this.model['filter'] !== undefined) {
        className.push('app-global-menu__filter')

        node = h('div', {
          class: className,
          'data-tooltip': this.model['title'],
          onClick: event => event.stopPropagation()
        }, [
          h('input', {
            type: 'text',
            name: 'filter',
            value: this.model['filter'],
            placeholder: 'filter ...',
            autocomplete: 'off',
            onVnodeMounted (ctx) {
              setTimeout(() => ctx.el.focus(), 0)
            },
            onInput: (event) => {
              clearTimeout(this.timer)
              this.timer = setTimeout(() => {
                this.$emit('action', 'loadData', null, { filter: event.target.value }, this.$parent)
              }, 500)
            }
          }),
          h('i', {
            class: 'fa fa-remove app-global-menu__clear' + (this.model['filter'] ? '' : ' hidden'),
            onClick: () => {
              this.$emit('action', 'loadData', null, {}, this.$parent)
            }
          })
        ])
      }
      // base
      else if (slots.length) {
        node = h('span', {
          class: className,
          'data-tooltip': this.model['title'],
          onClick: () => this.$emit('action', 'onNodeClick', this.model)
        }, [slots])
      }

      return node
    }
  },
  methods: {
    action () {
      this.$emit('action', ...arguments)
    },
    onClick () {
      if (this.model['url'] && !this.$store.getters.get('menuShow')) {
        this.$emit('action', 'loadData', this.model['url'], this)
      }
    },
    onEnter (event) {
      event.currentTarget.parentElement.parentElement.querySelectorAll(':scope > ul > li.app-global-menu__hover').
          forEach(i => {
            if (this.$el !== i) {
              i.classList.remove('app-global-menu__hover')
              i.querySelectorAll('li.app-global-menu__hover').forEach(j => j.classList.remove('app-global-menu__hover'))
            }
          })

      if (event.currentTarget.classList.contains('app-global-menu__hover')) {
        return
      }

      if (this.model['url'] && this.$store.getters.get('menuShow')) {
        this.model['data'] = []
        clearTimeout(this.timer)
        this.timer = setTimeout(() => this.$emit('action', 'loadData', this.model['url'], this), 200)
      }

      event.currentTarget.classList.add('app-global-menu__hover')
    },
    onOut () {
      if (this.model['url']) {
        clearTimeout(this.timer)
      }
    }
  },
  setup (props) {
    return function () {
      let children = [this.node]

      if (this.model?.['data']?.length) {
        children.push(
            h('ul',
                this.model['data'].map((n, i) => h(GlobalMenuItem, {
                      data: n,
                      key: i,
                      level: props.level + 1,
                      onAction: this.action
                    })
                )
            )
        )
      }

      return h('li', {
        'data-level': props.level,
        class: this.classEl,
        onClick: this.onClick,
        onMouseenter: this.onEnter,
        onMouseleave: this.onOut
      }, children)
    }
  }
}
</script>
