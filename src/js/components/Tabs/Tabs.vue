<script>
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
    }
  },
  data () {
    const keyStorage = `tabs.` + this.id.toLowerCase()

    return {
      keyStorage,
      active: this.$store.getters.get(`Session.${keyStorage}`, null),
      settings: {}
    }
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
  created () {
    if (this.history) {
      this.active = this.$route['params'][this.history]
      this.$watch(
          () => this.$route['params'][this.history],
          active => {
            if (!active) {
              return
            }

            if (this.active !== active ||
                (this.active === active && ['delete', 'save', 'update'].includes(this.$store.state.action))) {
              this.select(active)
            }
          }
      )
    } else {
      this.data.forEach(tab => {
        if (tab.active) {
          this.active = tab.id
        }

        tab.loaded = tab.active
      })

      if (!this.active && this.data[0]) {
        this.active = this.data[0].id
        this.data[0].active = true
        this.data[0].loaded = true
      }
    }

    if (this.watch) {
      this.$watch(
          () => this.$route['name'],
          active => {
            if (!active) {
              return
            }

            this.data.forEach((tab, index) => {
              if (typeof tab.route === 'object') {
                tab.active = tab.route.some(i => i === active)
              } else {
                tab.active = tab.route === active
              }

              if (tab.active) {
                this.select(tab, index)
              }
            })
          }
      )
    }
  },
  mounted () {
    this.init(this.data.findIndex(tab => tab.id === this.active))
  },
  updated () {
    if (!this.data.some(tab => tab.id === this.active)) {
      this.active = this.data?.[0].id
    }
  },
  methods: {
    action () {
      if (typeof this[arguments[0]] === 'function') {
        this[arguments[0]](...Array.from(arguments).splice(1))
      } else {
        this.$emit('action', ...arguments)
      }
    },
    isRenderer (tab) {
      return this.history || (tab['needUpdate'] && tab.id === this.active) ||
          (!tab['needUpdate'] && ((this.loadOnce && tab.loaded) || !this.loadOnce))
    },
    isShow (tab) {
      return tab['needUpdate'] || tab.id === this.active
    },
    touch () {
      return false
    },
    select (tab, index) {
      if (typeof tab === 'string') {
        const id = tab
        tab = this.data.find(i => i.id === id)
        index = this.data.findIndex(i => i.id === id)

        if (!tab) {
          return
        }
      }

      this.active = tab.id
      this.$store.dispatch('set', { [`Session.${this.keyStorage}`]: this.active })

      this.init(index)

      if (this.history) {
        this.$emit('action', 'pushRouter', {
          params: {
            [this.history]: tab.id
          },
          meta: {
            group: true
          }
        })
      }

      if (this.loadOnce) {
        tab.loaded = true
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
  <div :id="id+`Tabs`" class="app-tabs" :class="this.class">

    <div v-if="data.length > 1" class="app-tabs__rows">
      <div class="app-tabs__row" ref="row">
        <div v-for="(tab, index) in data" :key="index" :data-tooltip="tab.title" class="app-tabs__tab"
             :class="{ 'app-tabs__tab-active' : tab.id === active }"
             @mousedown="select(tab, index)">
          <i v-if="tab.icon" class="app-tabs__tab-icon" :class="tab.icon"/>
          <span v-if="tab.name">{{ tab.name }}</span>
        </div>
      </div>

      <template v-if="navigation">
        <i class="fa fa-angle-left app-tabs__prev disabled" @mousedown="prev" ref="prev"/>
        <i class="fa fa-angle-right app-tabs__next disabled" @mousedown="next" ref="next"/>
      </template>
    </div>

    <template v-for="tab in data" :key="tab.id">
      <div
          v-if="isRenderer(tab)"
          v-show="isShow(tab)"
          :id="`tab-`+tab.id"
          :class="tab.class"
          class="app-tabs__page">
        <slot v-if="$slots[tab.id]" :name="tab.id"/>
        <div v-else class="grow flex items-center justify-center w-full h-full">
          <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
        </div>
      </div>
    </template>

  </div>
</template>
