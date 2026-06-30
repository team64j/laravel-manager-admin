import { h } from 'vue'
import { getValue, setValue } from '@/composables'

export function DynamicComponent (item = {}, model, ceil) {
  const data = (item[ceil.key] || ceil)
  const component = typeof data.component === 'object' ? data.component : data
  const props = component.attrs || {}

  if (component.model) {
    props.modelValue = getValue(component.model, model)
  }

  if (props.keyValue) {
    props.value = item[props.keyValue]
  }

  const slots = data.slots ? Object.fromEntries(Object.entries(data.slots || {}).
    map(i => [i[0], () => DynamicComponent({}, null, i[1])])) : undefined

  return h(
    window['Vue']._context.components[component.component],
    {
      ...props,
      onAction () {
        //console.log('action', ...arguments)
      },
      ['onUpdate:props'] (newProps) {
        Object.assign(props, newProps)
      },
      ['onUpdate:modelValue'] (value) {
        setValue(component.model, value, model)
      }
    },
    slots
  )
}