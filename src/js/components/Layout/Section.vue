<template>
  <div class="app-section flex flex-row flex-wrap grow-0 w-full p-4 rounded content-baseline bg-white dark:bg-gray-750 hover:shadow-lg transition">
    <div v-if="label" class="app-section__header relative flex flex-wrap items-center w-full transition"
         :class="{ 'cursor-pointer hover:text-blue-500 bg-slate-50 dark:bg-gray-600 py-2 px-4 rounded': propExpanded !== null}"
         @click="click">
      <div class="grow">
        <i v-if="icon" :class="icon" class="mr-2"/>
        <strong>{{ label }}</strong>
      </div>
      <div v-if="propExpanded !== null" class="grow-0">
        <i class="fa fa-angle-down transition" :class="{ 'rotate-180' : !propExpanded }"/>
      </div>
    </div>
    <div v-show="propExpanded ?? true" class="app-section__content flex flex-wrap w-full">
      <div class="mt-2 pb-2 w-full" :class="[propExpanded ? '' : 'border-t']"/>
      <slot name="default"/>
    </div>
  </div>
</template>

<script>
export default {
  __isStatic: true,
  name: 'Section',

  props: {
    label: String,
    icon: String,
    expanded: {
      type: Boolean,
      default: null
    }
  },

  data () {
    return {
      propExpanded: this.expanded ?? null
    }
  },

  methods: {
    click () {
      if (this.propExpanded !== null) {
        this.propExpanded=!this.propExpanded
      }
    }
  }
}
</script>

<style>
.app-section + .app-section {
  @apply pt-0
}
</style>
