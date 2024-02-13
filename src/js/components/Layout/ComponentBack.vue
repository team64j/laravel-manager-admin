<script setup>
import { compile, computed, getCurrentInstance, h, nextTick, reactive } from 'vue'

const instance = getCurrentInstance()

const $props = defineProps(['data', 'meta', 'layout', 'errors', 'loaderDelay', 'class'])

const $emit = defineEmits(['action', 'update:modelValue'])

function action () {
  $emit('action', ...arguments)
}

function updateProps (attrs, args) {
  Object.assign(attrs, args)
}

function updateModelValue (value, instance) {
  if (!instance) {
    return
  }

  const key = typeof instance === 'object' ? instance._.vnode.key : instance

  setValue(key, value)

  if (instance?.relation?.['key']) {
    const empty = !(Array.isArray(value) ? value.length : (!isNaN(parseFloat(value))
        && !isNaN(value - 0)) ? parseFloat(value) : value)

    setValue(instance.relation['key'], empty ? instance.relation['falseValue'] : instance.relation['trueValue'])

    if (empty && instance.relation['notEmpty']) {
      nextTick(() => setValue(key, instance.trueValue))
    }
  }

  $emit('update:modelValue', ...arguments)
}

function setValue (key, value) {
  if (~key.indexOf('.')) {
    if ($props.data[key] !== undefined) {
      $props.data[key] = value
    } else {
      setDataValue(key.split('.'), value, $props, true)
    }
  } else {
    $props.data[key] = value
  }
}

function findDataValue (keys, data) {
  let obj = {}

  data = data || $props

  keys.forEach((key, index) => {
    if (data[key] !== undefined) {
      if (keys[index + 1] !== undefined) {
        keys.shift()
        obj = findDataValue(keys, data[key])
      } else {
        obj = data[key]
      }
    }
  })

  return obj
}

function setDataValue (keys, value, data, first) {
  if (!first && data && data[keys[0]] === undefined) {
    data[keys[0]] = {}
  }

  keys.forEach((key, index) => {
    if (data[key] !== undefined) {
      if (keys[index + 1] !== undefined) {
        keys.shift()
        setDataValue(keys, value, data[key])
      } else {
        data[key] = value
      }
    }
  })
}

function initLayout (data, setAction) {
  data = data || setLayoutData()

  if (!data) {
    return
  }

  if (data.component) {
    return createComponent(data, setAction)
  }

  if (typeof data === 'string') {
    data = data.replace(/href=/g, 'to=').replace(/<a(.*?)>/g, '<router-link$1>').replace(/(<\/a>)/g, '</router-link>')
    return h(compile(data))
  }

  if (typeof data === 'object') {
    let obj
    if (Array.isArray(data)) {
      obj = []
      data.forEach(i => obj.push(initLayout(i, setAction)))
    } else {
      obj = Object.create(null)
      for (let i in data) {
        const slots = initLayout(data[i])
        obj[i] = () => slots
      }
    }
    return obj
  }

  return data
}

function createComponent (data, setAction) {
  let component = instance.root.appContext.components[data.component] ||
      (data.component && (new Function('return ' + data.component + '')).call(instance))

  if (!component) {
    return
  }

  console.log(component.name)

  let attrs = reactive(data.attrs || {})

  attrs.key = data.model || data.component.name || ''
  attrs.modelValue = data?.attrs?.value

  if (attrs.key === 'data') {
    if (!attrs.data) {
      attrs.data = $props.data
    } else {
      attrs.modelValue = $props.data
    }
  } else if ($props.data?.[attrs.key] !== undefined) {
    attrs.modelValue = $props.data[attrs.key]
  } else if (~attrs.key.indexOf('.')) {
    attrs.modelValue = findDataValue(attrs.key.split('.'))
  }

  if (component.props?.['meta'] || component?.extends?.props?.['meta']) {
    attrs.meta = attrs.meta ?? $props.meta
  }

  if (component.props?.['error'] || component?.extends?.props?.['error']) {
    attrs.error = $props.errors?.[attrs.key]
  }

  if (setAction || component?.methods?.action || component.props?.['modelValue'] ||
      component?.extends?.props?.['modelValue']) {
    attrs['onAction'] = action
  }
  attrs['onUpdate:props'] = (args) => updateProps(attrs, args)
  attrs['onUpdate:modelValue'] = updateModelValue

  return h(component, attrs, data.slots && initLayout(data.slots))
}

function setLayoutData (data) {
  data = data || Object.assign(Array.isArray($props.layout) ? [] : {}, $props.layout)

  for (let i in data) {
    if (typeof data[i]?.data === 'string') {
      const keys = data[i].data.split('.')

      if (!data[i].attrs) {
        data[i].attrs = {}
      }

      data[i].attrs.data = findDataValue(keys)
      data[i].attrs.onAction = action
    } else if (data[i]?.slots) {
      data[i].slots = setLayoutData(data[i].slots)
    } else if (Array.isArray(data[i])) {
      data[i] = setLayoutData(data[i])
    }
  }

  return data
}

const component = computed(() => h('div', {
  class: 'app-component grow flex flex-col h-full overflow-auto',
  onAction: action
}, initLayout(null, true)))

</script>

<script>
export default {
  name: 'LayoutComponent',
  //__isStatic: true
}
</script>

<template>
  <component :is="component"/>
</template>
