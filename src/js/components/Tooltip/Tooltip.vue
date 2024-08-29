<script>
import { h } from 'vue'
import('./Tooltip.css')

export default {
  data () {
    return {
      top: 0,
      left: 0,
      el: null,
      html: null,
      type: null,
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
  computed: {
    className () {
      const c = ['app-tooltip']

      if (this.isShow) {
        c.push('opacity-100 visible')
      } else {
        c.push('opacity-0 invisible')
      }

      if (this.type === 'error') {
        c.push('!bg-rose-600')
      }

      return c
    }
  },
  methods: {
    create (event) {
      if (!event.target || event.target === this.$el || !event.target.getAttribute ||
          !event.target.closest('[data-tooltip]') || event.target.getAttribute('data-tooltip') === '...') {
        return
      }

      event.preventDefault()

      const el = event.target.closest('[data-tooltip]')

      this.el = true
      this.position = el.getBoundingClientRect()
      this.html = el.getAttribute('data-tooltip')
          // .replace(/<br ?\/?>/g, '\n').replace(/&/g, "&amp;")
          // .replace(/</g, "&lt;")
          // .replace(/>/g, "&gt;")
          // .replace(/"/g, "&quot;")
          // .replace(/'/g, "&#039;")
          .replace(/\r\n|\r|\n/g, '<br>')
      this.type = el.getAttribute('data-type')

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
  },
  setup () {
    return function () {
      return h('div', {
        class: this.className,
        style: {
          top: this.top + 'px',
          left: this.left + 'px'
        },
        onMousedown (event) {
          event.stopPropagation()
        },
        onClick (event) {
          event.stopPropagation()
        },
        onMouseover (event) {
          event.stopPropagation()
        }
      }, [h('div', { class: 'pointer-events-none', innerHTML: this.html })])
    }
  }
}
</script>
