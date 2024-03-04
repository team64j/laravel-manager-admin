<script>
export default {
  name: 'Tooltip',
  data () {
    return {
      top: 0,
      left: 0,
      el: null,
      html: null,
      timer: null,
      isShow: false,
      position: {}
    }
  },
  created () {
    document.addEventListener('mouseover', this.create)
    document.addEventListener('mousedown', this.destroy)
    document.addEventListener('mouseout', this.destroy)
    document.addEventListener('keydown', this.destroy)
    document.addEventListener('click', this.destroy)
  },
  methods: {
    create (event) {
      if (!event.target || event.target === this.$el || !event.target.getAttribute ||
          !event.target.getAttribute('data-tooltip')) {
        return
      }

      this.el = event.target
      this.position = this.el.getBoundingClientRect()
      this.html = this.el.getAttribute('data-tooltip')
          // .replace(/<br ?\/?>/g, '\n').replace(/&/g, "&amp;")
          // .replace(/</g, "&lt;")
          // .replace(/>/g, "&gt;")
          // .replace(/"/g, "&quot;")
          // .replace(/'/g, "&#039;")
          .replace(/\r\n|\r|\n/g, '<br>')

      this.$nextTick(() => {
        this.top = this.position.top + this.position.height
        this.left = event.clientX//this.position.left + (this.position.width / 2) - (this.$el.offsetWidth / 2)

        if (this.left + this.$el.offsetWidth + 16 > window.innerWidth) {
          this.left -= (this.left + this.$el.offsetWidth) - window.innerWidth + 16
        } else if (this.left < 10) {
          this.left = 10
        }

        if (this.top + this.$el.offsetHeight + 16 > window.innerHeight) {
          this.top -= (this.top + this.$el.offsetHeight) - window.innerHeight + 16
        }
      }).then(() => this.timer = setTimeout(() => this.isShow = true, 300))
    },
    destroy (event) {
      if (!this.el || event.relatedTarget === this.$el) {
        return
      }

      clearTimeout(this.timer)

      this.el = null
      this.timer = null
      this.isShow = false
    }
  }
}
</script>

<template>
  <div class="app-tooltip" :class="[isShow ? 'opacity-100 visible' : 'opacity-0 invisible']"
      @mousedown.stop="() => null" @click.stop="() => null" @mouseover.stop="() => null"
      :style="{
           top: top + 'px',
           left: left + 'px'
         }">
    <div v-html="html" class="pointer-events-none"/>
  </div>
</template>

<style scoped>
.app-tooltip  {
  @apply fixed z-[999] -translate-x-1 -translate-y-1 m-3 py-2.5 px-4 max-w-80 rounded bg-slate-50/90 text-slate-800 dark:bg-gray-600/90 dark:text-slate-100 text-sm shadow transition-all
}
</style>

<style>
.app-tooltip .badge {
  @apply float-right ml-2 px-1.5 bg-blue-500 text-white rounded
}
[data-tooltip] > *:not(.pointer-events-auto) {
  @apply pointer-events-none
}
.app-help[data-tooltip] {
  @apply cursor-help
}
.app-help {
  @apply ml-2 cursor-pointer text-slate-300 hover:opacity-80 dark:text-slate-500 font-normal not-italic;
  font-family: "Font Awesome 6 Free", serif;
}
.app-help::before {
  content: "\f059";
}
</style>
