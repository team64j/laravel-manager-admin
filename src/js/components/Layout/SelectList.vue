<script>
export default {
  name: 'SelectList',
  props: {
    data: Array,
    selected: String,
    colClass: String,
    itemClass: String,
    deleting: Boolean
  },
  methods: {
    onClickSelect (item) {
      this.$emit('action', 'onClickSelect', item)
    },
    onClickSelectDelete (item) {
      this.$emit('action', 'onClickSelectDelete', item)
    },
    className (item) {
      let classNames = [];

      if (item.selected || item === this.selected || item.key === this.selected) {
        classNames.push('!text-white !bg-blue-600')
      }

      if (this.itemClass) {
        classNames.push(this.itemClass)
      }

      return classNames.join(' ')
    }
  }
}
</script>

<template>
  <div class="h-full bg-gray-800 text-slate-50 text-lg p-4">
    <div v-for="i in data"
         :class="colClass">
      <div @click="onClickSelect(i)" :class="className(i)"
           class="px-3 py-2 m-0.5 flex justify-between items-center rounded cursor-pointer hover:text-white hover:bg-gray-600">
        <div>
          <template v-if="typeof i === 'object'">
            <span class="inline-block font-bold min-w-[2rem] mr-2 uppercase">{{ i.key }}</span>
            <span>{{ i.value }}</span>
          </template>
          <span v-else>{{ i }}</span>
        </div>
        <div v-if="deleting" @click.stop="onClickSelectDelete(i)" class="w-6 h-6 ml-3 inline-flex items-center justify-center rounded-full bg-white/20 hover:bg-white/60 text-black/50 hover:text-rose-600 transition">
          <i class="fa fa-remove"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
