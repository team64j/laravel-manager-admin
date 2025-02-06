import { uniqId } from '@/utils'

export const props = {
  class: [Array, Object, String],
  clear: Boolean,
  data: [Object, Array],
  description: [String, Number],
  disabled: Boolean,
  emitClick: String,
  emitInput: String,
  emitInputKey: [null, String],
  error: [String, Object, Array],
  errorClass: String,
  falseValue: { default: false },
  help: String,
  url: String,
  id: {
    type: String,
    default: uniqId
  },
  inputClass: [Array, Object, String],
  label: String,
  labelClass: [Array, Object, String],
  modelValue: {
    type: [null, Object, String, Number, Boolean],
    default: undefined
  },
  placeholder: String,
  readonly: Boolean,
  relation: Object,
  required: Boolean,
  requiredText: String,
  trueValue: { default: true },
  type: String,
  value: [String, Number, Array, Object],
  keyValue: String,
  itemNew: String,
  icon: [Array, Object, String],
  loading: Boolean
}

export const ID = props.id || uniqId()
