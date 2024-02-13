<script>
import { compile, h, reactive, toRaw } from 'vue'

export default {
  name: 'LayoutComponent',
  //__isStatic: true,
  props: ['data', 'meta', 'layout', 'errors', 'loaderDelay', 'class'],
  // data () {
  //   return {
  //     componentComponent: h('div', {
  //       class: 'app-component grow flex flex-col h-full overflow-auto',
  //       onAction: this.action
  //     }, this.initLayout(null, true))
  //   }
  // },
  // computed: {
  //   componentComponent () {
  //     return h('div', {
  //       class: 'app-component grow flex flex-col h-full overflow-auto',
  //       onAction: this.action
  //     }, this.initLayout(null, true))
  //   }
  // },
  methods: {
    action () {
      this.$emit('action', ...arguments)
    },
    initLayout (data, setAction) {
      data = data || this.setLayoutData()

      if (!data) {
        return
      }

      if (data.component) {
        return this.createComponent(data, setAction)
      }

      if (typeof data === 'string') {
        data = data.replace(/href=/g, 'to=').
            replace(/<a(.*?)>/g, '<router-link$1>').
            replace(/(<\/a>)/g, '</router-link>')
        return h(compile(data))
      }

      if (typeof data === 'object') {
        let obj
        if (Array.isArray(data)) {
          obj = []
          data.forEach(i => obj.push(this.initLayout(i, setAction)))
        } else {
          obj = Object.create(null)
          for (let i in data) {
            const slots = this.initLayout(data[i])
            obj[i] = () => slots
          }
        }
        return obj
      }

      return () => data
    },
    setLayoutData (data) {
      data = data || Object.assign(Array.isArray(this.$props.layout) ? [] : {}, this.$props.layout)

      for (let i in data) {
        if (typeof data[i]?.data === 'string') {
          const keys = data[i].data.split('.')

          if (!data[i].attrs) {
            data[i].attrs = {}
          }

          data[i].attrs.data = this.findDataValue(keys)
          data[i].attrs.onAction = this.action
        } else if (data[i]?.slots) {
          data[i].slots = this.setLayoutData(data[i].slots)
        } else if (Array.isArray(data[i])) {
          data[i] = this.setLayoutData(data[i])
        }
      }

      return data
    },
    createComponent (data, setAction) {
      let component = this.$.appContext.components[data.component] ||
          (data.component && (new Function('return ' + data.component + '')).call(this))

      if (!component) {
        return
      }

      console.log(component.name)

      let attrs = toRaw(data.attrs || {})

      attrs.key = data.model || data.component.name || ''
      attrs.modelValue = data?.attrs?.value

      if (attrs.key === 'data') {
        if (!attrs.data) {
          attrs.data = this.$props.data
        } else {
          attrs.modelValue = this.$props.data
        }
      } else if (this.$props.data?.[attrs.key] !== undefined) {
        attrs.modelValue = this.$props.data[attrs.key]
      } else if (~attrs.key.indexOf('.')) {
        attrs.modelValue = this.findDataValue(attrs.key.split('.'))
      }

      if (component.props?.['meta'] || component?.extends?.props?.['meta']) {
        attrs.meta = attrs.meta ?? this.$props.meta
      }

      if (component.props?.['error'] || component?.extends?.props?.['error']) {
        attrs.error = this.$props.errors?.[attrs.key]
      }

      if (setAction || component?.methods?.action || component.props?.['modelValue'] ||
          component?.extends?.props?.['modelValue']) {
        attrs['onAction'] = this.action
      }

      attrs['onUpdate:modelValue'] = this.updateModelValue

      attrs['onUpdate:props'] = (args) => {
        Object.assign(__attrs, args)
      }

      const __attrs = reactive(attrs)

      return h(component, __attrs, data.slots && this.initLayout(data.slots))
    },
    setDataValue (keys, value, data, first) {
      if (!first && data && data[keys[0]] === undefined) {
        data[keys[0]] = {}
      }

      keys.forEach((key, index) => {
        if (data[key] !== undefined) {
          if (keys[index + 1] !== undefined) {
            keys.shift()
            this.setDataValue(keys, value, data[key])
          } else {
            data[key] = value
          }
        }
      })
    },
    findDataValue (keys, data) {
      let obj = {}

      data = data || this.$props

      keys.forEach((key, index) => {
        if (data[key] !== undefined) {
          if (keys[index + 1] !== undefined) {
            keys.shift()
            obj = this.findDataValue(keys, data[key])
          } else {
            obj = data[key]
          }
        }
      })

      return obj
    },
    setValue (key, value) {
      if (~key.indexOf('.')) {
        if (this.$props.data[key] !== undefined) {
          this.$props.data[key] = value
        } else {
          this.setDataValue(key.split('.'), value, this.$props, true)
        }
      } else {
        this.$props.data[key] = value
      }
    },
    updateModelValue (value, instance) {
      if (!instance) {
        return
      }

      const key = typeof instance === 'object' ? instance._.vnode.key : instance

      this.setValue(key, value)

      if (instance?.relation?.['key']) {
        const empty = !(Array.isArray(value) ? value.length : (!isNaN(parseFloat(value))
            && !isNaN(value - 0)) ? parseFloat(value) : value)

        this.setValue(instance.relation['key'],
            empty ? instance.relation['falseValue'] : instance.relation['trueValue'])

        if (empty && instance.relation['notEmpty']) {
          this.$nextTick(() => this.setValue(key, instance.trueValue))
        }
      }

      this.$emit('update:modelValue', ...arguments)
    },
    updateProps (attrs, args) {
      Object.assign(attrs, args)
    }
  }
}
</script>

<template>
  <div class="app-component grow flex flex-col h-full overflow-auto">
    <component :is="() => initLayout(null, true)" @action="action"/>
  </div>
</template>

<!--<template>
  <component :is="componentComponent"/>
</template>-->
