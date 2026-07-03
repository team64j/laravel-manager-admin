import { computed, getCurrentInstance, h, reactive } from 'vue'
import { action, getValue, setValue } from '@/composables'

export function DynamicComponent (item = {}, model, ceil) {
  const currentInstance = getCurrentInstance()
  const data = (item[ceil.key] || ceil)
  const component = typeof data.component === 'object' ? data.component : data
  const props = reactive({ ...(component.attrs || {}) })

  if (component.attrs?.keyValue) {
    const keyValue = computed(() => item[component.attrs.keyValue])
    if (keyValue.value !== undefined) {
      props.value = keyValue.value
    }
  }

  if (component.model) {
    props.modelValue = getValue(component.model, model)
  }

  const eventHandlers = {
    'onUpdate:props': (newProps) => {
      Object.keys(newProps).forEach(key => {
        if (key in props) {
          props[key] = newProps[key]
        }
      })
    },

    'onUpdate:modelValue': (value) => {
      setValue(component.model, value, model)
    },

    'onAction': (...args) => {
      action.call(currentInstance, ...args)
    }
  }

  let slots = undefined
  if (data.slots) {
    slots = Object.fromEntries(
      Object.entries(data.slots).map(([slotName, slotConfig]) => [
        slotName,
        () => DynamicComponent({}, null, slotConfig)
      ])
    )
  }

  return h(
    window['Vue']._context.components[component.component],
    {
      ...props,
      ...eventHandlers
    },
    slots
  )
}