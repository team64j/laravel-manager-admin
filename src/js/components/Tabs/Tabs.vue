<script>
import router from '../../router'

import('./Tabs.css')

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
  data () {
    const keyStorage = `tabs.` + this.id.toLowerCase()

    return {
      keyStorage,
      active: this.$store.getters.get(`Session.${keyStorage}`, null),
      settings: {}
    }
  },
  created () {
    if (this.history) {
      if (typeof this.history === 'string') {
        this.active = this.$route['params'][this.history]
        this.data.forEach(i => i.active = i.id === this.active)

        this.$watch(
            () => this.$route['params'][this.history],
            active => {
              if (!active) {
                return
              }

              if (this.active !== active) {
                this.active = active
              }
            }
        )
        //   this.$watch(
        //       () => this.$route['params'][this.history],
        //       active => {
        //         if (!active) {
        //           return
        //         }
        //
        //         if (this.active !== active ||
        //             (this.active === active && ['delete', 'save', 'update'].includes(this.$store.state.action))) {
        //           this.select(active)
        //         }
        //       }
        //   )
      } else {
        this.active = null

        this.data.forEach(i => {
          if (!i.route) {
            return
          }

          const r = router.parse(i.route)
          i.active = r['path'] === this.$route['path']

          if (i.active) {
            this.active = i.id
          }
        })

        // this.$watch(
        //     () => this.$route['params']['path'],
        //     active => {
        //       if (!active) {
        //         return
        //       }
        //
        //       this.data.forEach(i => {
        //         if (this.active !== active && i.id === active) {
        //           this.select(i)
        //         }
        //       })
        //
        //     }
        // )

        // this.$watch(
        //     () => this.$route,
        //     (route, routeOld) => {
        //       if (isEqual(route.query, routeOld.query) && route.path === routeOld.path) {
        //         console.log(route)
        //       }
        //
        //       // this.active = null
        //       //
        //       // this.data.forEach(i => {
        //       //   if (!i.route) {
        //       //     return
        //       //   }
        //       //
        //       //   const r = router.parse(i.route)
        //       //   i.active = r['path'] === route['path']
        //       //
        //       //   if (i.active) {
        //       //     this.select(i)
        //       //   }
        //       // })
        //     }
        // )
      }
    } else if (!this.data.some(i => i.id === this.active) && this.data[0]) {
      this.active = this.data[0].id
      this.data[0].active = this.data[0].render = true
    } else {
      this.data.forEach(i => i.active = i.render = i.id === this.active)
    }

    // if (this.data.length > 1) {
    //   const tabs = [
    //     h('div', { class: 'app-tabs__rows' }, [
    //       h('div', { class: 'app-tabs__row', ref: 'row' },
    //           this.data.map((i, k) => {
    //             return h('div', {
    //               class: ['app-tabs__tab', i.id === this.active ? 'app-tabs__tab-active' : ''],
    //               onMousedown: () => this.select(i, k)
    //             }, [
    //               i.icon ? h('i', { class: ['app-tabs__tab-icon', i.icon] }) : null,
    //               i.name ? h('span', i.name) : null
    //             ])
    //           })
    //       ),
    //       this.navigation ? [
    //         h('i', { class: 'fa fa-angle-left app-tabs__prev disabled', ref: 'prev', onMousedown: this.prev }),
    //         h('i', { class: 'fa fa-angle-right app-tabs__next disabled', ref: 'next', onMousedown: this.next })
    //       ] : null
    //     ])
    //   ]
    //
    //   this.$.slots['tabs'] = () => tabs
    // }
  },
  mounted () {
    this.init(this.data.findIndex(tab => tab.id === this.active))
  },
  computed: {
    class () {
      return [
        this.vertical ? 'app-tabs__vertical' : '',
        this.navigation ? 'app-tabs__with-navigation' : '',
        this.data.length === 1 ? 'app-tabs__without-rows' : ''
      ]
    }
  },
  methods: {
    render (i) {
      return this.history || (i.needUpdate && i.id === this.active) || !i.needUpdate
    },
    select (tab, index) {
      this.init(index)

      this.data.forEach(i => {
        i.active = false
      })

      this.active = tab.id
      this.$store.dispatch('set', { [`Session.${this.keyStorage}`]: this.active })

      if (this.history) {
        if (typeof this.history === 'string') {
          this.$emit('action', 'pushRouter', {
            params: {
              [this.history]: tab.id
            },
            meta: {
              group: true
            }
          })
        } else {
          const route = router.parse(tab.route)

          // router.to(route)

          this.$emit('action', 'pushRouter', {
            ...route,
            meta: {
              group: true
            }
          })
        }
      } else {
        // ...
      }
    },
    init (index) {
      let right = 0,
          width = 0

      if (this.$refs.row) {
        this.$refs.row.styles = getComputedStyle(this.$refs.row)

        this.$refs.row.querySelectorAll('.app-tabs__tab').forEach((t, i) => {
          t.styles = getComputedStyle(t)

          if (i <= index) {
            width += t.offsetWidth + parseFloat(t.styles.marginLeft) + parseFloat(t.styles.marginRight)

            if (i < index) {
              right += t.offsetWidth + parseFloat(t.styles.marginLeft)
            }
          }
        })

        if (this.$refs.row.scrollLeft > right) {
          this.$refs.row.scrollLeft = right
        }

        if (this.$refs.row.offsetWidth < width) {
          this.$refs.row.scrollLeft = width - this.$refs.row.offsetWidth
        }
      }

      if (this.$refs.prev) {
        if (index) {
          this.$refs.prev.classList.remove('app-tabs__disabled')
        } else {
          this.$refs.prev.classList.add('app-tabs__disabled')
        }
      }

      if (this.$refs.next) {
        if (this.data[index + 1]) {
          this.$refs.next.classList.remove('app-tabs__disabled')
        } else {
          this.$refs.next.classList.add('app-tabs__disabled')
        }
      }
    },
    prev () {
      const index = this.data.findIndex(tab => tab.id === this.active) - 1

      if (this.data[index]) {
        this.select(this.data[index], index)
      }
    },
    next () {
      const index = this.data.findIndex(tab => tab.id === this.active) + 1

      if (this.data[index]) {
        this.select(this.data[index], index)
      }
    }
  }
}
</script>

<template>
  <div :id="id+`Tabs`" class="app-tabs" :class="[this.class, smallTabs ? 'app-tabs-small' : 'app-tabs-large']">

    <div v-if="data.length > 1" class="app-tabs__rows">
      <div class="app-tabs__row" ref="row">
        <div v-for="(i, k) in data" :data-tooltip="i.title" class="app-tabs__tab"
             :class="{ 'app-tabs__tab-active' : i.id === active }"
             @mousedown="select(i, k)">
          <i v-if="i.icon" class="app-tabs__tab-icon" :class="i.icon"/>
          <span v-if="i.name">{{ i.name }}</span>
        </div>
      </div>

      <template v-if="navigation">
        <i class="fa fa-angle-left app-tabs__prev disabled" @mousedown="prev" ref="prev"/>
        <i class="fa fa-angle-right app-tabs__next disabled" @mousedown="next" ref="next"/>
      </template>
    </div>

    <template v-for="i in data" :key="i.id">
      <div
          v-if="render(i)"
          v-show="i.id === active"
          :id="`tab-`+i.id"
          :class="i.class"
          class="app-tabs__page">
        <slot v-if="$slots[i.id]" :name="i.id"/>
        <div v-else class="grow flex items-center justify-center w-full h-full">
          <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
        </div>
      </div>
    </template>

  </div>
</template>
