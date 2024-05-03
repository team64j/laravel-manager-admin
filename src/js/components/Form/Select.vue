<template>
  <div v-if="label" class="w-full mb-3" :class="$props.class">
    <div class="mb-1">
      <label :for="ID" class="font-bold cursor-pointer">
        {{ label }}
        <span v-if="required" class="text-rose-500">*</span>
        <i v-if="help" class="ml-2 font-normal" :data-tooltip="help"/>
      </label>
      <slot name="label"/>
    </div>
    <div class="relative">
      <div v-if="loading" class="absolute left-0 top-1 my-1 mx-2">
        <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
      </div>

      <template v-if="multiple">
        <input type="text" v-model="model" :id="ID" readonly
               class="block w-full px-3 py-1 rounded app-appearance-select cursor-pointer"
               :placeholder="placeholder"
               @mousedown="onClickMultipleInput"
               @blur="onBlurMultipleInput"/>
        <div
            class="absolute left-0 top-full w-full hidden z-20 border rounded mt-1 bg-white dark:bg-gray-800 shadow-md max-h-48 overflow-auto cursor-default"
            @click="onClickMultipleList"
            @mousedown.prevent.stop="onClickMultipleList">

          <template v-if="options?.[0]?.data">
            <div v-for="i in options" class="py-1">
              <div class="px-3 pt-1 pb-0.5 font-bold">{{ i.name }}</div>
              <checkbox-component v-model="model" :data="i.data" class="px-3 py-0.5"/>
            </div>
          </template>

          <checkbox-component v-else v-model="model" :data="options" class="px-3 py-0.5"/>
        </div>
      </template>

      <select v-else
              v-model="model"
              :id="ID"
              @mousedown="onMousedown"
              @change="onChange"
              @focus="onFocus"
              @blur="onBlur">
        <template v-for="i in options">
          <optgroup v-if="i.data" :label="i.name">
            <option v-for="j in i.data" :value="j.key" :selected="j.selected" :disabled="j.disabled">{{ j.value }}</option>
          </optgroup>
          <option v-else :value="i.key" :selected="i.selected" :disabled="i.disabled">{{ i.value }}</option>
        </template>
      </select>

      <template v-if="itemNew !== undefined">
        <input type="text" class="block w-full px-3 py-1 rounded" :id="`input-`+ID" @input="onInput"/>
        <i class="fa fa-circle-xmark" @click="onClickClear"/>
      </template>
    </div>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <div v-if="error" class="text-xs text-rose-600" :class="errorClass">{{ errorMessage }}</div>
  </div>
  <template v-else>
    <select v-model="model"
            :id="ID"
            :multiple="multiple"
            @mousedown="onMousedown"
            @change="onChange"
            @focus="onFocus"
            @blur="onBlur">
      <template v-for="i in options">
        <optgroup v-if="i.data" :label="i.name">
          <option v-for="j in i.data" :value="j.key" :selected="j.selected" :disabled="j.disabled">{{ j.value }}</option>
        </optgroup>
        <option v-else :value="i.key" :selected="i.selected" :disabled="i.disabled">{{ i.value }}</option>
      </template>
    </select>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <div v-if="error" class="text-xs text-rose-600" :class="errorClass">{{ errorMessage }}</div>
  </template>
</template>

<script>
import CheckboxComponent from './Checkbox.vue'
import Field from './Field.vue'

export default {
  __isStatic: true,
  name: 'Select',
  extends: Field,
  components: { CheckboxComponent },

  props: {
    multiple: Boolean,
    load: Boolean,
    url: String,
    itemNew: String
  },

  data () {
    return {
      options: this.data || []
    }
  },

  created () {
    if ((this.multiple || this.load) && this.url) {
      this.get()
    }
  },

  methods: {
    get () {
      if (!this.model) {
        this.model = []
      }

      axios.get(this.url, {
        params: {
          selected: this.model
        }
      }).then(r => {
        this.loading = false
        this.options = r.data.data
      })
    },

    onMousedown (event) {
      if (!this.url || event.target.classList.contains('opened') || this.multiple) {
        return
      }

      event.target.dataset.value = event.target.value || this.model

      this.loading = true
      this.options = null

      axios.get(this.url, {
        params: {
          selected: event.target.value
        }
      }).then(r => {
        this.loading = false
        this.options = r.data.data
        event.target.classList.add('opened')
        this.$emit('action', 'mousedown:select', event, this)
      })
    },

    onBlur (event) {
      event.target.classList.remove('opened')
    },

    onChange (event) {
      const target = event.target

      if (target.value === this.itemNew) {
        let value = target.dataset.value

        for (let i of target.options) {
          if (i.value === value) {
            value = this.itemNew
            break
          }
        }

        target.nextElementSibling.value = value
        this.$emit('update:modelValue', value, this)

        target.parentElement.classList.add('app-select__editable')
        target.nextElementSibling.focus()
      } else {
        target.dataset.value = target.value
      }

      this.$emit('action', this.emitInput || 'change:select', event, this)
    },

    onFocus (event) {
      if (event.target.parentElement.classList.contains('app-select__editable')) {
        event.target.nextElementSibling.focus()
      }
    },

    onInput (event) {
      if (event.target.value.length) {
        event.target.classList.add('active')
      } else {
        event.target.classList.remove('active')
      }
      this.$emit('update:modelValue', event.target.value, this.itemNew)
    },

    onClickClear (event) {
      const input = event.target.parentElement.querySelector('input'),
          select = event.target.parentElement.querySelector('select')
      input.value = ''
      input.classList.remove('active')
      event.target.parentElement.classList.remove('app-select__editable')
      select.value = select.dataset.value
      this.$emit('update:modelValue', select.value, this)
      this.$emit('update:modelValue', '', this.itemNew)
    },

    onClickMultipleInput (event) {
      if (!event.target.classList.contains('active')) {
        this.get()
      }

      event.target.classList.toggle('active')
    },

    onBlurMultipleInput (event) {
      setTimeout(() => event.target !== document.activeElement && event.target.classList.remove('active'), 10)
    },

    onClickMultipleList (event) {
      event.currentTarget.previousElementSibling.focus()
    }
  }
}
</script>

<style scoped>
select + input {
  @apply hidden absolute left-0 top-0 pr-8
}

select + input + i {
  @apply hidden
}

select optgroup {
  @apply font-bold bg-slate-100 dark:bg-gray-700
}

select option {
  @apply bg-white dark:bg-gray-800
}

input.active + div {
  @apply block
}

.app-select__editable select + input {
  @apply block
}

.app-select__editable select {
  @apply opacity-0
}

.app-select__editable select + input + i {
  @apply absolute block right-0 top-0 my-2.5 mx-3 cursor-pointer text-gray-300 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-600 transition
}
</style>
