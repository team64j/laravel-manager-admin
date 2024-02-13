<template>
  <div class="p-4 grow-0 flex flex-row flex-wrap items-center select-none">
    <div class="basis-auto grow">
      <a :class="{ 'pointer-events-none opacity-50' : !data['prev'] }"
         class="btn-sm btn-gray transition"
         @mousedown="pagination(data['prev'])">
        <i class="fa fa-angle-left fa-fw leading-[0]"/>
      </a>
      <a :class="{ 'pointer-events-none opacity-50' : !data['next'] }"
         class="btn-sm btn-gray ml-1 transition"
         @mousedown="pagination(data['next'])">
        <i class="fa fa-angle-right fa-fw leading-[0]"/>
      </a>
    </div>
    <div class="basis-auto grow-0 whitespace-nowrap" v-if="data['info']">
      {{ data['info'] }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'PanelPagination',

  props: {
    data: {
      type: Object
    }
  },

  methods: {
    pagination (url) {
      this.$emit('action', 'pagination', url.split('?')[1] ?? '')
    }
  }
}
</script>
