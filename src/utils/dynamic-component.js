import { compile, computed, getCurrentInstance, h, renderList, toRaw } from 'vue'
import { action, getValue, setValue } from '@/composables'
import router from '@/router'

export function DynamicComponent (item = {}, model, ceil) {
  if (typeof ceil === 'string') {
    console.log(ceil)
  }

  const currentInstance = getCurrentInstance()
  const data = item[ceil.key] || ceil
  const component = typeof data.component === 'object' ? data.component : data
  const props = component.attrs || {}

  if (typeof component === 'string') {
    return h(
      compile(component.replace(/href=/g, 'to=').
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

  if (component.attrs?.keyValue) {
    const keyValue = computed(() => item[component.attrs.keyValue])
    if (keyValue.value !== undefined) {
      props.value = keyValue.value
    }
  }

  props.key = component.model || component.component || ''

  if (component.model) {
    if (component?.attrs.data?.[component.model] !== undefined) {
      props.data = component.attrs.data[component.model]
    } else {
      props.modelValue = getValue(component.model, model)
    }
  }

  if (model?.meta) {
    props.meta = model.meta
  }

  props.currentRoute = toRaw(router.currentRoute.value)

  if (Array.isArray(component) && component.length) {
    return renderList(
      component,
      i => i && DynamicComponent({}, props.modelValue || model, i)
    )
  }

  if (!window['Vue']._context.components[component.component]) {
    return null
  }

  const eventHandlers = {
    'onUpdate:props': (newProps) => {
      Object.assign(props, newProps)
    },

    'onUpdate:modelValue': (value, instance) => {
      if (!instance) return

      const key = typeof instance === 'object'
        ? (instance?._?.vnode?.key ?? instance?.vnode?.key)
        : (instance || props.key)

      const updates = [{ key, value }]

      const relations = instance.props?.relation ? (Array.isArray(instance.props.relation)
        ? instance.props.relation
        : [instance.props?.relation]) : null

      if (relations && relations.length) {
        for (const relation of relations) {
          if (relation['key']) {
            const empty = !(Array.isArray(value) ? value.length :
              (!isNaN(parseFloat(value)) && !isNaN(value - 0)) ? parseFloat(value) : value)

            updates.push({
              key: relation['key'],
              value: empty ? relation['falseValue'] : relation['trueValue']
            })

            if (empty && relation['notEmpty']) {
              setTimeout(() => {
                emit('update:modelValue', instance.props.trueValue, key)
              }, 0)
            }
          }
        }
      }

      updates.forEach(({ key, value }) => setValue(key, value, model))
    },

    'onAction': (...args) => {
      if (!currentInstance.attrs.onAction || args[0] !== 'action') {
        action.call(currentInstance, ...args)
      }
    }
  }

  let slots = undefined
  if (data.slots) {
    slots = Object.fromEntries(
      Object.entries(data.slots).map(([slotName, slotConfig]) => [
        slotName,
        () => DynamicComponent({}, props.modelValue || model, slotConfig)
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
