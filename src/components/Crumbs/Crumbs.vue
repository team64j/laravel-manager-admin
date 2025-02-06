<script setup>
defineOptions({
  name: 'Crumbs',
  __isStatic: true
})

const props = defineProps({
  data: Array
})
</script>

<template>
  <div
      class="app-crumbs flex items-center px-2 py-1 text-sm bg-white dark:bg-gray-700 border-t border-slate-100 dark:border-gray-800">
    <template v-for="i in props.data">

      <router-link v-if="i['to']"
                   class="app-crumbs__item truncate max-w-48 hover:opacity-80"
                   :to="i['to']"
                   :title="i['title']"
                   :data-tooltip="i['tooltip']">
        {{ i['name'] ?? i['title'] }}
      </router-link>

      <div v-else
           class="app-crumbs__item truncate max-w-48 hover:opacity-80"
           :title="i['title']"
           :data-tooltip="i['tooltip']">
        {{ i['name'] ?? i['title'] }}
      </div>

      <i class="fa fa-angle-right opacity-60 leading-[0] mx-4 last-of-type:hidden" style="font-size: 70%"/>
    </template>
  </div>
</template>
