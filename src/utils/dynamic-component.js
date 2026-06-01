import { h } from 'vue'
import { getValue, setValue } from '@/composables'

export function DynamicComponent (data, model) {
  const props = data.attrs

  if (data.model) {
    props.modelValue = getValue(data.model, model)
  }

  return h(
    window['Vue']._context.components[data.component],
    {
      ...props,
      onAction () {
        console.log('action', ...arguments)
      },
      ['onUpdate:props'] (newProps) {
        Object.assign(props, newProps)
      },
      ['onUpdate:modelValue'] (value) {
        setValue(data.model, value, model)
      },
    },
  )
}