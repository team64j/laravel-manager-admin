<script>
import Component from '../Layout/Component.vue'
import router from '../../router'

import ('./Modal.css')

export default {
  __isStatic: true,
  name: 'Modal',
  components: { Component },
  data () {
    return {
      show: false,
      title: '',
      icon: '',
      component: null,
      componentProps: {}
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
    open () {
      this.show = true
    },
    close () {
      this.show = false
    },
    setTitle (title) {
      this.title = title

      return this
    },
    setUrl (route) {
      if (typeof route === 'string') {
        route = router.parse(route)
      }

      this.component = true

      axios.get(route.fullPath).then(({ data }) => {
        data.currentRoute = route
        this.componentProps = data
        this.icon = data.meta['icon']
        this.title = data.meta['fullTitle'] || data.meta['title']
      })

      return this
    },
    pushRouter (route) {
      this.setUrl(router.parse(route))
    },
    onMousedown (event) {
      document.addEventListener('mousemove', this.onMousemove)
      document.addEventListener('mouseup', this.onMouseup)
      this.x = event.clientX
      this.y = event.clientY
      this.l = this.$refs.modal.offsetLeft
      this.t = this.$refs.modal.offsetTop
      this.$refs.modal.classList.add('opacity-50')
    },
    onMousemove (event) {
      let x = this.l + (event.clientX - this.x)
      let y = this.t + (event.clientY - this.y)

      this.$refs.modal.style.left = x + 'px'
      this.$refs.modal.style.top = y + 'px'
    },
    onMouseup () {
      document.removeEventListener('mousemove', this.onMousemove)
      document.removeEventListener('mouseup', this.onMouseup)
      this.$refs.modal.classList.remove('opacity-50')
    }
  }
}
</script>

<template>
  <transition name="fade">
    <teleport to="body" v-if="show">
      <div class="app-modal">
        <div class="app-modal__overlay" @click="this.show=!this.show"/>
        <div class="app-modal__wrap" ref="modal">
          <div class="app-modal__header">
            <div v-if="icon" class="pl-4 flex items-center">
              <i :class="icon"/>
            </div>
            <div class="grow px-4 py-1" v-html="title" @mousedown="onMousedown"/>
            <button type="button" class="btn-red items-center" @click="close">
              <i class="fa fa-close"/>
            </button>
          </div>
          <div class="app-modal__main">
            <Component v-if="this.component" v-bind="componentProps" @action="action"/>
          </div>
          <div class="app-modal__footer"/>
        </div>
      </div>
    </teleport>
  </transition>
</template>
