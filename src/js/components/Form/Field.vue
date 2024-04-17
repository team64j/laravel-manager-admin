<script>
export default {
  emits: ['action', 'update:modelValue'],

  props: {
    class: [Array, Object, String],
    clear: Boolean,
    data: [Object, Array],
    description: String,
    disabled: Boolean,
    emitClick: String,
    emitInput: String,
    error: [String, Object, Array],
    errorClass: String,
    falseValue: { default: false },
    help: String,
    id: String,
    inputClass: [Array, Object, String],
    label: String,
    modelValue: [null, Object, String, Number, Boolean],
    placeholder: String,
    readonly: Boolean,
    relation: Object,
    required: Boolean,
    requiredText: String,
    trueValue: { default: true },
    type: String,
    value: [String, Number, Array, Object]
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
      ID: this.id || 'v-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36),
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
