import { computed, getCurrentInstance } from 'vue'
import { uniqId } from '../utils/uniq-id'

export const props = {
  class: [Array, Object, String],
  clear: Boolean,
  data: [Object, Array],
  description: String,
  disabled: Boolean,
  emitClick: String,
  emitInput: String,
  emitInputKey: [null, String],
  error: [String, Object, Array],
  errorClass: String,
  errorMessage: {
    type: String,
    default () {
      if (props.error) {
        if (Array.isArray(props.error)) {
          return props.error.join(', ')
        } else {
          return props.error
        }
      }
    }
  },
  falseValue: { default: false },
  help: String,
  url: String,
  id: {
    type: String,
    default: uniqId()
  },
  inputClass: [Array, Object, String],
  label: String,
  labelClass: [Array, Object, String],
  modelValue: [null, Object, String, Number, Boolean],
  placeholder: String,
  readonly: Boolean,
  relation: Object,
  required: Boolean,
  requiredText: String,
  trueValue: { default: true },
  type: String,
  value: [String, Number, Array, Object],
  keyValue: String,
  itemNew: String
}

export const errorMessage = computed(() => {
  if (props.error) {
    if (Array.isArray(props.error)) {
      return props.error.join(', ')
    } else {
      return props.error
    }
  }
})

export const ID = props.id || uniqId()

export function action () {
  const ctx = getCurrentInstance()

  if (typeof this[arguments[0]] === 'function') {
    this[arguments[0]](...Array.from(arguments).splice(1))
  } else {
    ctx.$emit('action', ...arguments)
  }
}
