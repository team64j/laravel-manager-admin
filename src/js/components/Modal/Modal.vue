<script>
import { h } from 'vue'
import Component from '../Layout/Component.vue'
import router from '../../router'

import ('./Modal.css')

export default {
  __isStatic: true,
  name: 'Modal',
  data () {
    return {
      show: false,
      title: '',
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
    setComponent (component) {
      this.component = component

      return this
    },
    setUrl (url) {
      axios.get(url).then(({ data }) => {
        this.componentProps = null
        this.component ??= h(Component)
        setTimeout(() => this.componentProps = data, 0)
      })

      return this
    },
    pushRouter (route) {
      this.setUrl(router.parse(route).fullPath)
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
        <div class="app-modal__overlay" @click="this.show=!this.show"></div>
        <div class="app-modal__wrap" ref="modal">
          <div class="app-modal__header">
            <div class="grow" v-html="title" @mousedown="onMousedown"></div>
            <button type="button" class="btn-red" @click="close">
              <i class="fa fa-close"></i>
            </button>
          </div>
          <div class="app-modal__main">
            <component v-if="this.component" :is="this.component" v-bind="componentProps" @action="action"/>
          </div>
          <div class="app-modal__footer"></div>
        </div>
      </div>
    </teleport>
  </transition>
</template>
