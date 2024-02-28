<script>
export default {
  name: 'TreeSearch',
  data () {
    return {
      value: '',
      counter: 0
    }
  },
  methods: {
    input (event) {
      this.value = event.target.value
      clearTimeout(this.counter)

      this.counter = setTimeout(() => {
        this.$emit('action', 'onSearch', this.value)
      }, 200)
    },

    clear () {
      this.value = ''

      this.$emit('action', 'onSearch', this.value)
    }
  }
}
</script>

<template>
  <div class="p-1 relative">
    <input type="text" name="filter" class="px-2 py-0" :value="this.value" @input="input"
           placeholder="filter ..." autocomplete="off">
    <i v-if="this.value" class="fa fa-times-circle text-rose-600 absolute top-2.5 right-2.5 cursor-pointer"
       @click="clear"/>
  </div>
</template>

<style scoped>

</style>
