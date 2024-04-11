<script setup>
import { getCurrentInstance, nextTick, reactive, watchEffect } from 'vue'
import store from '../../store'

import('./Search.css')

const instance = getCurrentInstance()

const $data = reactive({
  search: '',
  result: null,
  timer: 0,
  searching: false
})

store.dispatch('set', { ['Storage.root.searchShow']: false })

document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.code === 'KeyF' && document.activeElement.tagName === 'BODY') {
    store.dispatch('set', { ['Storage.root.searchShow']: true })
    event.preventDefault()
  }

  if (event.code === 'Escape' && store.getters['get']('Storage.root.searchShow')) {
    store.dispatch('set', { ['Storage.root.searchShow']: false })
    event.preventDefault()
  }
})

watchEffect(() => {
  if (store.getters['get']('Storage.root.searchShow')) {
    nextTick(() => instance.vnode.el.querySelector('.app-search__input input').focus())
  }
})

const methods = {
  onClose () {
    store.dispatch('set', { ['Storage.root.searchShow']: false })
  },
  onInput (event) {
    $data.search = event.target.value
    clearTimeout($data.timer)
    $data.timer = setTimeout(methods.onSearch, 500)
  },
  onSearch () {
    if ($data.search === '') {
      $data.result = null
    } else {
      $data.search = $data.search.trim()
      $data.result = []
      console.log($data.search)
    }
  },
  onClear () {
    $data.search = ''
    $data.result = null
    nextTick(() => instance.vnode.el.querySelector('.app-search__input input').focus())
  }
}
</script>

<template>
  <transition name="fade">
    <div v-show="store.getters['get']('Storage.root.searchShow')" class="app-search">
      <div class="app-search__back" @click="methods.onClose"/>
      <div class="app-search__main">
        <div class="app-search__input">
          <input type="text" name="search" placeholder="Enter to Search, Ctr+F to show or Escape to close"
                 class="input-lg text-2xl border-0 border-b-2 rounded-none"
                 autocomplete="off"
                 :value="$data.search"
                 @input="methods.onInput">
          <i v-if="$data.search !== ''" class="app-search__clear fa fa-times" @click="methods.onClear"/>
        </div>
        <div class="app-search__result">
          <template v-if="$data.searching">
            <div class="text-center p-4">
              <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
            </div>
          </template>

          <template v-else-if="$data.result">
            <div v-if="$data.result.length" v-for="i in $data.result">
              {{ i }}
            </div>
            <div v-else class="text-center p-4">Not Found</div>
          </template>
        </div>
      </div>
    </div>
  </transition>
</template>
