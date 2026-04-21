<script setup>
import { getCurrentInstance } from 'vue'
import store from '@/store'

defineOptions({
  name: 'Grid',
  __isStatic: true
})

const currentInstance = getCurrentInstance()

const props = defineProps({
  data: Array,
  area: String,
  gap: String,
  gridAreas: Array
})

function calcGridArea (gridArea) {
  if (typeof gridArea === 'object' && gridArea && store.getters.get('breakpoint')) {
    let breakpoint = Object.values(gridArea)[0]

    for (const i in gridArea) {
      if (window.innerWidth > currentInstance.root.exposed.data.breakpoints[i]) {
        breakpoint = gridArea[i]
      }
    }

    gridArea = breakpoint
  }

  return gridArea
}
</script>

<template>
  <div class="app-grid grid auto-cols-fr w-full" :style="{ gridArea: props.area, gap: props.gap }">
    <div v-for="(i, k) in props.gridAreas" :style="{ gridArea: calcGridArea(i) }" class="min-h-full">
      <slot :name="`grid_${k}`"/>
    </div>
  </div>
</template>

<style scoped>

</style>
