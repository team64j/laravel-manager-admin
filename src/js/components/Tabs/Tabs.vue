<script>
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
    return {
      active: null
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

      this.init(index)

      if (this.history) {
        const route = {
          params: {}
        }

        route.params[this.history] = tab.id
        this.$emit('action', 'pushRouter', route)
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

<style scoped>
.app-tabs {
  @apply flex flex-col grow content-start px-4 pb-4 overflow-hidden
}
.app-tabs__rows {
  @apply overflow-hidden relative h-11 w-full grow-0 shrink-0
}
.app-tabs__row {
  @apply relative overflow-hidden overflow-x-auto h-20 px-0 mx-0 flex flex-nowrap
}
.app-tabs.app-tabs__with-navigation > .app-tabs__rows .app-tabs__row {
  @apply mx-5
}
.app-tabs .app-tabs__tab {
  @apply flex items-center mx-0.5 px-4 h-10 relative shrink-0 cursor-pointer whitespace-nowrap rounded select-none text-center font-medium hover:bg-slate-200/50 dark:hover:bg-gray-600/40 dark:hover:text-white transition
}
.app-tabs .app-tabs__tab.app-tabs__tab-active {
  @apply border-inherit text-white bg-blue-600 dark:text-white dark:bg-blue-600 dark:hover:bg-blue-600
}
.app-tabs .app-tabs__tab .app-tabs__tab-icon + span {
  @apply ml-2
}
.app-tabs .app-tabs__prev, .app-tabs .app-tabs__next {
  @apply absolute h-10 w-5 top-0 pt-1 flex items-center justify-center cursor-pointer select-none hover:text-blue-500
}
.app-tabs .app-tabs__prev {
  @apply left-0
}
.app-tabs .app-tabs__next {
  @apply right-0
}
.app-tabs .app-tabs__prev.app-tabs__disabled, .app-tabs .app-tabs__next.app-tabs__disabled {
  @apply opacity-20 pointer-events-none
}
.app-tabs .app-tabs__page {
  @apply relative flex flex-wrap items-start content-start w-full overflow-auto grow p-6 rounded bg-white dark:bg-gray-750
}
.app-tabs__vertical {
  @apply flex-row p-0 h-full self-stretch overflow-visible
}
.app-tabs__vertical > .app-tabs__rows {
  @apply grow-0 h-auto w-auto mb-0 overflow-visible
}
.app-tabs__vertical > .app-tabs__rows::after {
  @apply left-auto top-0
}
.app-tabs__vertical > .app-tabs__rows .app-tabs__row {
  @apply sticky top-0 flex-col h-auto py-0 m-0 pr-6
}
.app-tabs__vertical.app-tabs__with-navigation > .app-tabs__rows .app-tabs__row {
  @apply mx-0
}
.app-tabs__vertical > .app-tabs__rows .app-tabs__tab {
  @apply truncate mx-0 my-0.5 max-w-[15rem]
}
.app-tabs__vertical > .app-tabs__rows .app-tabs__prev::before, .app-tabs__vertical > .app-tabs__rows .app-tabs__next::before {
  @apply rotate-90
}
.app-tabs__vertical > .app-tabs__rows .app-tabs__prev {
  @apply h-auto w-full py-1
}
.app-tabs__vertical > .app-tabs__rows .app-tabs__next {
  @apply h-auto w-full py-1 top-auto bottom-0
}
.app-tabs__vertical > .app-tabs__page {
  @apply flex-col h-full p-0 shadow-none rounded-none overflow-auto flex-nowrap
}
.app-tabs__vertical > .app-tabs__rows ~ .app-tabs__page {
  @apply pl-6 border-l bg-transparent border-opacity-80
}
.app-tabs__vertical .app-tabs__prev, .app-tabs__vertical .app-tabs__next {
  @apply hidden
}
</style>
