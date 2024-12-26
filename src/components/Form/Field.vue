<script>
import { uniqId } from '../../utils/uniq-id'

export default {
  emits: ['action', 'update:modelValue', 'update:props'],

  props: {
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
    falseValue: { default: false },
    help: String,
    url: String,
    id: String,
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
    itemNew: String,
  },

  computed: {
    model: {
      get () {
        return this.modelValue
      },
      set (value) {
        this.$emit('update:modelValue', value, this)
      }
    },
    errorMessage () {
      if (this.error) {
        if (Array.isArray(this.error)) {
          return this.error.join(', ')
        } else {
          return this.error
        }
      }
    }
  },

  data () {
    return {
      ID: this.id || uniqId(),
      loading: false
    }
  },

  methods: {
    action () {
      if (typeof this[arguments[0]] === 'function') {
        this[arguments[0]](...Array.from(arguments).splice(1))
      } else {
        this.$emit('action', ...arguments)
      }
    }
  }
}
</script>
