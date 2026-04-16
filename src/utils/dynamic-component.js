import { h } from 'vue'
import { getValue, setValue } from '@/composables'

export function DynamicComponent (data, model) {
  const props = data.attrs

  return h(
    window['Vue']._context.components[data.component],
    {
      ...props,
      modelValue: getValue(data.model, model),
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