<script>
import { compile, h, shallowReactive, toRaw } from 'vue'

export default {
  name: 'Component',
  __isStatic: true,
  props: ['data', 'meta', 'layout', 'errors', 'loaderDelay', 'class'],
  methods: {
    action () {
      this.$emit('action', ...arguments)
    },
    initLayout (layout) {
      layout = toRaw(layout || this.setLayoutData())

      if (!layout) {
        return
      }

      if (layout.component) {
        return this.createComponent(layout)
      }

      if (typeof layout === 'string') {
        layout = layout.replace(/href=/g, 'to=').
            replace(/<a(.*?)>/g, '<router-link$1>').
            replace(/(<\/a>)/g, '</router-link>')
        return h(compile(layout))
      }

      if (typeof layout === 'object') {
        let obj
        if (Array.isArray(layout)) {
          obj = []
          layout.forEach(i => obj.push(this.initLayout(i)))
        } else {
          obj = {}
          for (let i in layout) {
            const slots = this.initLayout(layout[i])
            obj[i] = () => slots
          }
        }
        return obj
      }

      return layout
    },
    setLayoutData (data) {
      data = data || toRaw(this.layout)

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
    createComponent (data) {
      let component

      try {
        component = this.$.appContext.components[data.component] ||
            (data.component && (new Function('return ' + data.component + '')).call(this))
      } catch (exception) {
        return
      }

      if (!component) {
        return
      }

      const slots = data.slots && this.initLayout(data.slots)
      const attrs = toRaw(data.attrs || {})

      attrs.key = data.model || data.component.name || ''
      attrs.modelValue = data?.attrs?.value

      if (attrs.key === 'data') {
        if (!attrs.data) {
          attrs.data = this.data
        } else {
          attrs.modelValue = this.data
        }
      } else if (this.data?.[attrs.key] !== undefined) {
        attrs.modelValue = this.data[attrs.key]
      } else if (~attrs.key.indexOf('.')) {
        attrs.modelValue = this.findDataValue(attrs.key.split('.'))
      }

      if ((component?.extends?.props || component?.props)?.['meta']) {
        attrs.meta = attrs.meta ?? this.meta
      }

      if ((component?.extends?.props || component?.props)?.['error']) {
        attrs.error = this.errors?.[attrs.key]
      }

      (component.extends?.emits ?? component.emits ?? []).forEach(emit => {
        if (emit === 'action') {
          attrs['onAction'] = this.action
        } else if (emit === 'update:props') {
          attrs['onUpdate:props'] = (args) => this.updateProps(__attrs, args)
        } else if (emit === 'update:modelValue') {
          attrs['onUpdate:modelValue'] = this.updateModelValue
        }
      })

      const __attrs = shallowReactive(attrs)

      return h(component, __attrs, slots)
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
        if (this.data[key] !== undefined) {
          this.data[key] = value
        } else {
          this.setDataValue(key.split('.'), value, this.$props, true)
        }
      } else {
        this.data[key] = value
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
    updateProps (oldValue, newValue) {
      Object.assign(oldValue, newValue)
    }
  }
}
</script>

<template>
  <div class="app-component grow flex flex-col h-full overflow-auto">
    <component :is="() => initLayout()" @action="action"/>
  </div>
</template>
