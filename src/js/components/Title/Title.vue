<script>
export default {
  __isStatic: true,
  name: 'Title',
  props: {
    id: [String, Number],
    modelValue: String,
    title: String,
    icon: String,
    help: String
  },
  data () {
    return {
      show: false
    }
  },
  computed: {
    cId () {
      if (this.id) {
        return this.id
      }

      if (parseInt(this.$route['params']['id'])) {
        return this.$route['params']['id']
      }
    },
    value () {
      return this.modelValue ?? this.title ?? this.$route?.['meta']?.['title']
    }
  }
}
</script>

<template>
  <div v-if="value !== undefined" class="app-title w-full p-4">
    <h1 class="app-title h4 m-0 whitespace-nowrap flex items-center">
      <i v-if="icon || $route.meta.icon" class="mr-2 mt-1 w-6 text-center text-gray-600 dark:text-gray-200 shrink-0"
         :class="icon || $route.meta.icon"/>
      <span class="text-2xl h-8 font-bold truncate">
        {{ value }}
      </span>
      <span v-if="cId" class="ml-2">({{ cId }})</span>
      <i v-if="help" class="far fa-question-circle ml-2 cursor-pointer text-slate-500 hover:opacity-80" @click="show=!show"/>
    </h1>
    <transition mode="out-in">
      <div v-if="help" v-show="show" v-html="help" class="app-alert app-alert__blue mt-3"/>
    </transition>
  </div>
</template>
