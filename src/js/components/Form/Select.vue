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
      <div v-if="loading" class="absolute z-10 left-2 top-2">
        <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
      </div>

      <template v-if="multiple">
        <input type="text"
               :value="firstValue"
               :id="ID"
               ref="input"
               readonly
               class="block relative w-full px-3 py-1 rounded app-appearance-select cursor-pointer"
               :placeholder="placeholder"
               @mousedown="onMousedown"
               @blur="onBlur"/>
        <div
            class="absolute left-0 top-full w-full hidden z-[1] border border-blue-500 mt-0 bg-white dark:bg-gray-800 shadow-md max-h-48 overflow-auto cursor-default"
            @click="onClickMultipleList"
            @mousedown.prevent="onClickMultipleList">

          <template v-for="o in options">
            <template v-if="o?.data">
              <div class="px-3 pt-1 pb-0.5 font-bold">{{ o.name }}</div>
              <checkbox-component
                  v-model="model"
                  :data="o.data"
                  false-value=""
                  class="pl-3 py-0.5"
                  label-class="w-full"/>
            </template>

            <checkbox-component
                v-else
                v-model="model"
                :data="[o]"
                false-value=""
                class="pl-3 py-0.5"
                label-class="w-full"/>
          </template>
        </div>
      </template>

      <template v-else>
        <div v-show="itemNew === model">
          <input type="text" :id="`input-`+ID" autofocus @input="onInput"/>
          <i class="fa fa-circle-xmark absolute top-3 right-3" @click="onClickClear"/>
        </div>

        <input v-show="itemNew !== model"
               type="text"
               :value="firstValue"
               :id="ID"
               ref="input"
               readonly
               class="app-appearance-select cursor-pointer"
               :placeholder="placeholder"
               @mousedown="onMousedown"
               @blur="onBlur"/>

        <div
            class="absolute left-0 top-full w-full hidden z-[1] border border-blue-500 mt-0 bg-white dark:bg-gray-800 shadow-md max-h-48 overflow-auto cursor-default"
            @mousedown.prevent="">

          <template v-for="o in options">
            <template v-if="o?.data">
              <div class="px-3 pt-1 pb-0.5 font-bold">{{ o.name }}</div>
              <radio-component
                  v-model="model"
                  :data="o.data"
                  false-value=""
                  class="pl-3 py-0.5"
                  label-class="w-full"/>
            </template>

            <radio-component
                v-else
                v-model="model"
                :data="[o]"
                false-value=""
                class="pl-3 py-0.5"
                label-class="w-full"/>
          </template>
        </div>
      </template>
    </div>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <div v-if="error" class="text-xs text-rose-600" :class="errorClass">{{ errorMessage }}</div>
  </div>
  <div v-else class="relative">
    <div v-if="loading" class="absolute z-10 left-2 top-2">
      <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
    </div>
    <select v-model="model"
            :id="ID"
            :multiple="multiple"
            @mousedown="onMousedown"
            @change="onChange"
            @focus="onFocus"
            @blur="onBlur">
      <template v-for="i in options">
        <optgroup v-if="i.data" :label="i.name">
          <option v-for="j in i.data" :value="j.key" :selected="j.selected" :disabled="j.disabled">{{
              j.value
            }}
          </option>
        </optgroup>
        <option v-else :value="i.key" :selected="i.selected" :disabled="i.disabled">{{ i.value }}</option>
      </template>
    </select>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <div v-if="error" class="text-xs text-rose-600" :class="errorClass">{{ errorMessage }}</div>
  </div>
</template>

<script>
import CheckboxComponent from './Checkbox.vue'
import RadioComponent from './Radio.vue'
import Field from './Field.vue'

export default {
  __isStatic: true,
  name: 'Select',
  extends: Field,
  components: { CheckboxComponent, RadioComponent },
  props: {
    multiple: Boolean,
    load: Boolean,
    url: String
  },
  data () {
    return {
      options: this.data || [],
      lastModelValue: this.modelValue
    }
  },
  created () {
    if (this.load && this.url) {
      this.get()
    }
  },
  computed: {
    model: {
      get () {
        const value = this.value ?? this.modelValue ?? ''
        return this.multiple && !Array.isArray(value) ? [value] : value
      },
      set (value) {
        this.$emit('update:modelValue', value, this)
      }
    },
    firstValue () {
      const values = []

      this.options?.forEach(i => {
        if (i.data) {
          values.push(...i.data)
        } else {
          values.push(i)
        }
      })

      const value = this.multiple ?
          values.filter(i => (Array.isArray(this.modelValue) ?
                  this.modelValue :
                  [this.modelValue]
          ).includes(i.key)).map(i => i.value) :
          values.filter(i => this.modelValue === i.key && this.itemNew !== i.key).map(i => i.value)

      if (value.toString() !== this.itemNew) {
        this.lastModelValue = this.model
      }

      return value
    }
  },
  methods: {
    closest (el, parent) {
      while (el) {
        if (el === parent) {
          return el
        }
        el = el.parentElement
      }
    },
    get (callback) {
      this.loading = true

      if (this.multiple) {
        this.model = Array.isArray(this.model) ? this.model : [this.model]
      }

      this.url && axios.get(this.url, {
        params: {
          selected: this.model
        }
      }).then(r => {
        this.loading = false
        this.options = r.data.data

        if (callback) {
          callback()
        }
      })
    },
    onMousedown (event) {
      if (!this.url || event.target.classList.contains('opened')) {
        event.target.classList.toggle('opened')
        this.$emit('action', 'mousedown:select', event, this)
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

      if (target.value === this.itemNew && target.options) {
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

      this.$emit('action', this.emitInput || 'change:select', target.value, this)
    },
    onFocus (event) {
      if (event.target.parentElement.classList.contains('app-select__editable')) {
        event.target.nextElementSibling.focus()
      }
    },
    onInput (event) {
      this.$emit('update:modelValue', event.target.value, this)
    },
    onClickClear () {
      this.model = this.lastModelValue
    },
    onClickMultipleList () {
      this.$refs.input.focus()
      this.$refs.input.classList.add('opened')
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
input.active + div, input.opened + div {
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
