<template>
  <i :class="[
      icon,
      fit ? 'app-help-icon__fit-content' : '',
      noOpacity ? 'app-help-icon__no-opacity' : '',
      data ? 'cursor-help overflow-hidden' : ''
      ]"
     class="app-help-icon"
     :title="title"
     @mouseenter="mouseenter"
     @mouseout="mouseleave"
     @click.prevent="click">
    <i v-if="iconInner" :class="iconInner"/>
    <span v-if="data" v-html="data" @click.stop.prevent="() => {}"/>
  </i>
</template>

<script>
export default {
  name: 'HelpIcon',

  props: {
    data: {
      type: String
    },
    title: {
      type: String
    },
    icon: {
      default: 'fa fa-question-circle'
    },
    iconInner: {
      default: ''
    },
    fit: {
      default: ''
    },
    noOpacity: {
      default: ''
    }
  },

  data () {
    this.timer = 0

    return {}
  },

  methods: {
    mouseenter () {
      if (!this.data || this.$el.querySelector(':scope > span:hover')) {
        return
      }

      this.timer = setTimeout(() => {
        this.$el.classList.add('hover')
        const position = this.$el.getBoundingClientRect(),
            help = this.$el.querySelector(':scope > span')

        let left = position.left + 16,
            top = position.top + 16

        if (left + help.offsetWidth > window.innerWidth) {
          left = position.left - help.offsetWidth

          if (position.left - help.offsetWidth < 0) {
            left = (window.innerWidth - help.offsetWidth) - 16
          }
        }

        if (top + help.offsetHeight > window.innerHeight) {
          top = position.top - help.offsetHeight
        }

        help.style.left = left + 'px'
        help.style.top = top + 'px'
      }, 250)
    },

    mouseleave () {
      if (!this.data) {
        return
      }

      setTimeout(() => {
        clearTimeout(this.timer)
        if (!this.$el.querySelector(':scope > span:hover')) {
          this.$el.classList.remove('hover')
        }
      }, 50)
    },

    click () {
      if (!this.data) {
        return
      }

      this.$el.classList.toggle('hover')
    }
  }
}
</script>

<style>
i.app-help-icon {
  @apply ml-1 p-0.5 inline-flex justify-center relative
}
i.app-help-icon.hover {
  @apply overflow-visible
}
i.app-help-icon::before {
  @apply opacity-20
}
i.app-help-icon.hover::before {
  @apply opacity-60
}
i.app-help-icon.app-help-icon__no-opacity::before {
  @apply opacity-100
}
i.app-help-icon > span {
  @apply fixed min-w-[18rem] max-w-[24rem] block z-20 left-0 top-0 p-4 text-sm text-left font-normal font-sans rounded text-white bg-gray-800 dark:text-gray-800 dark:bg-white shadow-lg opacity-0 invisible cursor-default transition
}
i.app-help-icon.app-help-icon__fit-content > span {
  @apply min-w-fit
}
i.app-help-icon > i {
  @apply absolute text-xs text-rose-500 bottom-0 right-0
}
i.app-help-icon.hover > span {
  @apply opacity-90 visible
}
i.app-help-icon > span .badge {
  @apply absolute top-4 right-4 px-2 h-5 text-center font-medium not-italic rounded-full text-gray-900 bg-amber-400
}
</style>
