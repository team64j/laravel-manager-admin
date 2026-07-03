import { h, reactive, toRaw } from 'vue'
import { getValue, setValue } from '@/composables'

export function DynamicComponent (item = {}, model, ceil) {
  const data = (item[ceil.key] || ceil)
  const component = typeof data.component === 'object' ? data.component : data
  const props = toRaw(component.attrs || {})

  if (component.model) {
    props.modelValue = getValue(component.model, model)
  }

  if (props['keyValue']) {
    props.value = item[props['keyValue']]
  }

  props['onAction'] = () => {
    //console.log('action', ...arguments)
  }

  props['onUpdate:props'] = (newProps) => {
    Object.assign(props, newProps)
  }

  props['onUpdate:modelValue'] = (value) => {
    setValue(component.model, value, model)
  }

  return h(
    window['Vue']._context.components[component.component],
    reactive(props),
    data.slots ? Object.fromEntries(Object.entries(data.slots || {}).
      map(i => [i[0], () => DynamicComponent({}, null, i[1])])) : undefined
  )
}