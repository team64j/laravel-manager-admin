<template>
  <div v-if="label" class="w-full mb-3" :class="$props.class">
    <div class="mb-1">
      <label :for="ID" class="font-bold cursor-pointer">
        {{ label }}
        <span v-if="required" class="text-rose-500">*</span>
        <i v-if="help" class="app-help" :data-tooltip="help"/>
      </label>
      <span v-if="requiredText" class="text-rose-500 ml-3 text-sm font-normal">{{ requiredText }}</span>
      <slot name="label"/>
    </div>
    <div class="flex relative">
      <input v-model="model"
             :id="ID"
             :class="inputClass"
             :readonly="readonly"
             type="text"
             class="pr-8"
             @mousedown="onMousedown">
      <i class="far absolute top-0 right-0 py-2.5 px-3 cursor-pointer text-gray-400 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-600"
         :class="[ type === 'image' ? 'fa-file-image' : 'fa-file' ]"
         @click="onClick"/>
    </div>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <div v-if="error" class="absolute text-xs text-rose-600" :class="errorClass">{{ errorMessage }}</div>
    <slot name="item"/>
  </div>
  <div v-else>
    <div class="flex relative">
      <input v-model="model"
             :id="ID"
             :class="inputClass"
             :readonly="readonly"
             type="text"
             class="pr-8"
             @mousedown="onMousedown">
      <i class="far absolute top-0 right-0 py-2.5 px-3 cursor-pointer text-gray-400 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-600"
         :class="[ type === 'image' ? 'fa-file-image' : 'fa-file' ]"
         @click="onClick"/>
    </div>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <div v-if="error" class="absolute text-xs text-rose-600" :class="errorClass">{{ errorMessage }}</div>
  </div>
</template>

<script>
import Field from './Field.vue'

export default {
  __isStatic: true,
  name: 'FieldsFile',
  extends: Field,

  props: {
    type: {
      type: String,
      default: 'file',
      validator: (type) => ['file', 'image'].includes(type)
    }
  },

  methods: {
    onMousedown (event) {
      this.$emit('action', 'mousedown:input', event, this)
    },

    onClick () {
      this.$root.$refs.layout.$refs.window.open({
        key: 'FilesFromInput',
        currentRoute: this.$router.resolve({ name: 'Files' }),
        context: this,
        title: 'files',
        icon: 'far fa-folder-open',
        width: '85%',
        height: '85%',
        class: 'bg-white dark:bg-gray-700 dark:text-gray-100',
        attrs: {
          id: 'Files' + this.type
        }
      })
    }
  }
}
</script>
