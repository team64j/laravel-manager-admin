<script setup>
import { compile, getCurrentInstance, h } from 'vue'
import { getValue, setValue } from '@/composables'

defineOptions({
  name: 'GlobalComponent',
  __isStatic: true
})

const props = defineProps(['data', 'meta', 'layout', 'errors', 'loaderDelay', 'class', 'url', 'currentRoute'])

const emit = defineEmits(['action', 'update:modelValue', 'update:props'])

const currentInstance = getCurrentInstance()

function action (...args) {
  return emit('action', ...args)
}

function layoutData (data, visited = new WeakSet()) {
  // Защита от циклических ссылок
  if (data && typeof data === 'object') {
    if (visited.has(data)) {
      console.warn('Circular reference detected in layoutData')
      return data
    }
    visited.add(data)
  }

  for (let i in data) {
    if (typeof data[i]?.data === 'string') {
      data[i].attrs = {
        ...(data[i].attrs || {}),
        modelValue: getValue(data[i].data, props),
        onAction: action
      }
    } else if (data[i]?.slots) {
      data[i].slots = layoutData(data[i].slots)
    } else if (Array.isArray(data[i]) && data[i].length) {
      data[i] = layoutData(data[i])
    }
  }

  return data
}

function layout (data, depth = 0) {
  const MAX_DEPTH = 50

  if (depth > MAX_DEPTH) {
    console.error('Maximum layout depth exceeded')
    return null
  }

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
      obj = data.filter(i => i).map(i => layout(i, depth + 1))
    } else {
      obj = {}
      for (let i in data) {
        obj[i] = () => layout(data[i], depth + 1)
      }
    }

    return obj
  }

  return data
}

function createComponent (data) {
  let component

  try {
    component = currentInstance?.root?.appContext.components[data.component] ||
        (data.component && (new Function('return ' + data.component + '')).call(currentInstance))
  } catch (exception) {
    return null
  }

  if (!component) {
    return null
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

  if (attrs.key) {
    if (attrs.data?.[attrs.key] !== undefined) {
      attrs.data = attrs.data[attrs.key]
    } else {
      attrs.modelValue = getValue(attrs.key, props)
    }
  }

/*    if (attrs.key === 'data') {
      attrs.modelValue = props.data
    } else if (props.data?.[attrs.key] !== undefined) {
      attrs.modelValue = props.data[attrs.key]
    } else if (attrs.data?.[attrs.key] !== undefined) {
      attrs.data = attrs.data[attrs.key]
    } else if (/\./.test(attrs.key)) {
      attrs.modelValue = getValue(attrs.key, props)
    } else if (data?.attrs?.value !== undefined) {
      attrs.modelValue = data.attrs.value
    }*/

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

function updateModelValue (value, instance) {
  if (!instance) return

  const key = typeof instance === 'object'
      ? (instance?._?.vnode?.key ?? instance?.vnode?.key)
      : instance

  const updates = [{ key, value }]

  if (instance.props?.relation?.['key']) {
    const empty = !(Array.isArray(value) ? value.length :
        (!isNaN(parseFloat(value)) && !isNaN(value - 0)) ? parseFloat(value) : value)

    updates.push({
      key: instance.props.relation['key'],
      value: empty ? instance.props.relation['falseValue'] : instance.props.relation['trueValue']
    })

    if (empty && instance.props.relation['notEmpty']) {
      setTimeout(() => {
        emit('update:modelValue', instance.props.trueValue, key)
      }, 0)
    }
  }

  updates.forEach(({ key, value }) => setValue(key, value, props))
  emit('update:modelValue', value, instance)
}

function updateProps (oldValue, newValue) {
  Object.assign(oldValue, newValue)
}
</script>

<template>
  <component :is="() => layout(props.layout)"/>
</template>

<style>
.app-global-component-html table th, .app-global-component-html table td {
  @apply px-2 first:pl-0 last:pr-0
}
</style>
