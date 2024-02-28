<script>
import draggable from 'vuedraggable'
import CheckboxComponent from '../Fields/Checkbox.vue'
import InputComponent from '../Fields/Input.vue'

export default {
  //__isStatic: true,
  name: 'TreeBuilder',
  components: { draggable, CheckboxComponent, InputComponent },
  emits: ['action', 'update:modelValue'],

  props: {
    modelValue: { default: true }
  },

  computed: {
    model: {
      get () {
        return this.modelValue
      },
      set (value) {
        this.$emit('update:modelValue', value, this)
      }
    }
  },

  methods: {
    addItem () {
      this.model.push({
        lang: 'New Tab',
        class: '',
        enabled: true,
        custom: true
      })
    },

    removeItem (index) {
      this.model.splice(index, 1)
    }
  }
}
</script>

<template>
  <div class="grow">
    <draggable :list="model" item-key="key" handle=".draggable-handle">
      <template #item="{ element: item, index }">
        <div class="pb-3">
          <div class="font-bold">{{ item.label }}</div>
          <div class="flex items-center">
            <i class="fa fa-bars fa-fw draggable-handle mr-2"/>
            <checkbox-component
                v-model="item.enabled"
                inputClass="mr-2"
            />
            <input-component
                v-model="item.class"
                class="w-full"
                :disabled="!item.custom"
            />
            <i v-if="item.custom" class="fa fa-trash fa-fw ml-2 cursor-pointer text-rose-500"
               @click="removeItem(index)"/>
            <i v-else class="fa fa-fw ml-2"/>
          </div>
        </div>
      </template>
    </draggable>

    <div class="flex justify-center py-3">
      <i class="fa fa-plus-circle fa-fw fa-lg cursor-pointer text-green-500" @click="addItem"/>
    </div>
  </div>
</template>

<style scoped>

</style>
