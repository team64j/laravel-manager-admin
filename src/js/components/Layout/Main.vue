<script setup>
import Title from '../Title/Title.vue'
import ActionsButtons from '../ActionsButtons/ActionsButtons.vue'
import Tabs from '../Tabs/Tabs.vue'

const props = defineProps({
  data: [Array, Object],
  meta: [Object],
  layout: [Object],
  url: [String, Number],
  actions: Array,
  title: String,
  tabs: Object,
})
</script>

<template>
  <div class="app">
    <ActionsButtons :data="layout['actions']"/>
    <Title v-bind="layout['title']['attrs']" v-model="data[layout['title']['model']]"/>
    <Tabs :data="layout['tabs']"/>
  </div>
</template>

<style scoped>

</style>
