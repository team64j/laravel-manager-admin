<script>
import { compile, getCurrentInstance, h, nextTick } from 'vue'
import { getValue } from '@/composables'

import('./GlobalComponent.css')

export default {
  name: 'GlobalComponent',
  __isStatic: true,
  props: ['data', 'meta', 'layout', 'errors', 'loaderDelay', 'class', 'url', 'currentRoute'],
  emits: ['action', 'update:modelValue', 'update:props'],
  setup (props, { emit }) {
    const currentInstance = getCurrentInstance()

    function action () {
      return emit('action', ...arguments)
    }

    function layoutData (data) {
      for (let i in data) {
        if (typeof data[i]?.data === 'string') {
          if (!data[i].attrs) {
            data[i].attrs = {}
          }

          data[i].attrs.modelValue = getValue(data[i].data, props)
          data[i].attrs.onAction = action
        } else if (data[i]?.slots) {
          data[i].slots = layoutData(data[i].slots)
        } else if (Array.isArray(data[i])) {
          data[i] = layoutData(data[i])
        }
      }

      return data
    }

    function layout (data) {
      if (!data) {
        return
      }

      data = layoutData(data)

      if (data.component) {
        return createComponent(data)
      }

      if (typeof data === 'string') {
        return h(
            compile(data.replace(/href=/g, 'to=').
                    replace(/<a(.*?)>/g, '<router-link$1>').
                    replace(/(<\/a>)/g, '</router-link>'),
                {
                  parseMode: 'html',
                  onWarn () {}
                }
            ),
            { class: 'app-global-component-html' }
        )
      }

      if (typeof data === 'object') {
        let obj
        if (Array.isArray(data)) {
          obj = data.filter(i => i).map(i => layout(i))
        } else {
          obj = {}
          for (let i in data) {
            obj[i] = () => layout(data[i])
          }
        }

        return obj
      }

      return data
    }

    function createComponent (data) {
      let component

      try {
        component = app.$.appContext.components[data.component] ||
            (data.component && (new Function('return ' + data.component + '')).call(currentInstance))
      } catch (exception) {
        return
      }

      if (!component) {
        return
      }

      const slots = data.slots && layout(data.slots)
      const attrs = data.attrs || {}

      if (props.class) {
        attrs.class = (attrs.class ? attrs.class + ' ' : '') + props.class
      }

      attrs.key = data.model || data.component.name || ''

      if (component.props?.['currentRoute'] && props.currentRoute?.fullPath !== data.currentRoute?.fullPath) {
        attrs.currentRoute = props.currentRoute
      }

      if (attrs.key === 'data') {
        attrs.modelValue = props.data
      } else if (props.data?.[attrs.key] !== undefined) {
        attrs.modelValue = props.data[attrs.key]
      } else if (attrs.key.includes('.')) {
        attrs.modelValue = getValue(attrs.key, props)
      } else {
        attrs.modelValue = data?.attrs?.value
      }

      if ((component?.extends?.props || component?.props)?.['meta']) {
        attrs.meta = attrs.meta ?? props.meta
      }

      if (props.errors && ((component?.extends?.props || component?.props)?.['error'])) {
        attrs.error ??= props.errors?.[attrs.key] ?? props.errors?.[attrs.key.replace('data.', '')]
      }

      (component.extends?.emits ?? component.emits ?? []).forEach(e => {
        if (e === 'action') {
          attrs['onAction'] ??= action
        } else if (e === 'update:props') {
          attrs['onUpdate:props'] = (args) => updateProps(attrs, args)
        } else if (e === 'update:modelValue') {
          attrs['onUpdate:modelValue'] = updateModelValue
        }
      })

      return h(component, attrs, slots)
    }

    function findValue (keys, data) {
      const key = keys[0]
      let value

      if (data[key] !== undefined) {
        if (keys[1] !== undefined) {
          keys.shift()
          value = findValue(keys, data[key])
        } else {
          value = data[key]
        }
      }

      return value
    }

    function setValue (key, value) {
      if (key.includes('.')) {
        if (props.data[key] !== undefined) {
          props.data[key] = value
        } else {
          setDataValue(key.split('.'), value, props, true)
        }
      } else {
        props.data[key] = value
      }
    }

    function setDataValue (keys, value, data, first) {
      const key = keys[0]

      if (!first && data && data[key] === undefined) {
        data[key] = {}
      }

      if (data[key] !== undefined) {
        if (keys[1] !== undefined) {
          keys.shift()
          setDataValue(keys, value, data[key])
        } else {
          data[key] = value
        }
      }
    }

    function updateModelValue (value, instance) {
      if (!instance) {
        return
      }

      const key = typeof instance === 'object' ? (instance?._?.vnode?.key ?? instance?.vnode?.key) : instance

      setValue(key, value)

      if (instance.props?.relation?.['key']) {
        const empty = !(Array.isArray(value) ? value.length : (!isNaN(parseFloat(value))
            && !isNaN(value - 0)) ? parseFloat(value) : value)

        setValue(instance.props.relation['key'],
            empty ? instance.props.relation['falseValue'] : instance.props.relation['trueValue'])

        if (empty && instance.props.relation['notEmpty']) {
          nextTick(() => setValue(key, instance.props.trueValue))
        }
      }

      emit('update:modelValue', ...arguments)
    }

    function updateProps (oldValue, newValue) {
      Object.assign(oldValue, newValue)
    }

    return () => layout(props.layout)
  }
}
</script>
