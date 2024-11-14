<template>
  <li :class="{ 'app-global-menu__parent': data?.['data']?.length || data?.['url'] }"
      :data-level="level"
      @click="onClick"
      @mouseenter="onEnter"
      @mouseleave="onOut">

    <a v-if="data['href']"
       :href="data['href']"
       target="_blank"
       :class="classes"
       :data-tooltip="data['title']">
      <component :is="items"/>
    </a>

    <router-link v-else-if="data['to']" :to="data['to']"
                 :class="classes"
                 :data-tooltip="data['title']">
      <component :is="items"/>
    </router-link>

    <span v-else-if="data['prev'] || data['next']"
          :class="classes"
          :data-tooltip="data['title']">

      <button class="app-global-menu__prev"
              :disabled="props.data['prev'] ? undefined : 'disabled'"
              @click="onPrev">
        <i class="fa fa-chevron-left"/>
      </button>

      <span>{{ data['info'] ?? data['total'] }}</span>

      <button class="app-global-menu__next"
              :disabled="props.data['next'] ? undefined : 'disabled'"
              @click="onNext">
        <i class="fa fa-chevron-right"/>
      </button>
    </span>

    <span v-else-if="data['filter'] !== undefined"
          :class="classes"
          :data-tooltip="data['title']"
          @click.stop="">

      <input
          type="text"
          name="filter"
          :value="data['filter']"
          placeholder="filter..."
          autocomplete="off"
          autofocus
          @input="onInput"/>

      <i :class="['fa fa-remove app-global-menu__clear', data['filter'] ? '' : 'hidden']"
         @click="onClear"/>
    </span>

    <a v-else-if="data['data'] && level || data['values'] || data['url']"
       :class="classes"
       :data-tooltip="data['title']"
       @click="onClickNode">
      <component :is="items"/>
    </a>

    <span v-else-if="items.length"
          :class="classes"
          :data-tooltip="data['title']"
          @click="onClickNode">
      <component :is="items"/>
    </span>

    <ul v-if="data['data']?.length">
      <global-menu-item v-for="(i, k) in data['data']" :data="i" :key="k" :level="level+1" @action="action"/>
    </ul>
  </li>
</template>

<script setup>
import { computed, getCurrentInstance, h } from 'vue'
import { RouterLink } from 'vue-router'
import store from '../../store'

const instance = getCurrentInstance()

const props = defineProps({
  data: {
    type: Object,
    default: {}
  },
  level: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['action'])

let timer = 0

const classes = computed(() => {
  const classes = [props.data['class'] || '']

  // disabled
  if (props.data['disabled']) {
    classes.push('app-global-menu__disabled')
  }

  // pagination
  if (props.data['prev'] || props.data['next']) {
    classes.push('app-global-menu__pagination')
  }

  // filter
  if (props.data['filter'] !== undefined) {
    classes.push('app-global-menu__filter')
  }

  return classes
})

const action = (...args) => emit('action', ...args)

const onClick = (event) => {
  if (props.data['values'] || props.data['to']) {
    emit('action', 'show', false)
    event.stopPropagation()
    return
  }

  if (store.getters.get('menuShow')) {
    onClickToggle(event)
    emit('action', 'show', false)
  } else {
    onClickToggle(event)
    emit('action', 'show', true)
  }

  event.stopPropagation()
}

const onClickToggle = (event) => {
  if (instance.vnode.el.classList.contains('app-global-menu__hover') && props.data['url'] && props.data['data'] &&
      event.type !== 'click') {
    return
  }

  if (props.data['url']) {
    emit('action', 'setActiveClass', event.currentTarget)

    if (props.data['data']) {
      props.data['data'] = null
    } else {
      clearTimeout(timer)
      timer = setTimeout(() => {
        emit('action', 'loadData', props.data['url'], props)
        emit('action', 'show', true)
      }, 200)
    }
    event.stopPropagation()
    event.preventDefault()
  }
}

const onClickNode = () => {
  if (props.data['values']) {
    const value = store.getters['get']('Storage.root.' + props.data['key'])

    for (let i in props.data['values']) {
      i = parseInt(i)
      if (value === props.data['values'][i].value) {
        const item = props.data['values'][i + 1] ?? props.data['values'][0]
        store.dispatch('set', { ['Storage.root.' + props.data['key']]: item.value })
        break
      }
    }
  }
}

const onEnter = (event) => {
  if (event.currentTarget.classList.contains('app-global-menu__hover')) {
    return
  }

  emit('action', 'setActiveClass', event.currentTarget)
  if (props.data['url'] && props.data['data']) {
    props.data['data'] = null
  }
}

const onOut = () => {
  if (props.data['url']) {
    clearTimeout(timer)
  }
}

const onClear = () => {
  instance.parent.props.filter = null
  emit('action', 'loadData', null, instance.parent.props)
}

const onInput = (event) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    instance.parent.props.filter = event.target.value
    emit('action', 'loadData', null, instance.parent.props)
  }, 500)
}

const onPrev = (event) => {
  if (props.data['prev']) {
    event.stopPropagation()
    emit('action', 'loadData', props.data['prev'], instance.parent.props)
  }
}

const onNext = (event) => {
  if (props.data['next']) {
    event.stopPropagation()
    emit('action', 'loadData', props.data['next'], instance.parent.props)
  }
}

const items = () => {
  let slots = []

  // icon
  let icon = null
  if (props.data['values']) {
    let value = props.data['value'] ?? store.getters.get('Storage.root.' + props.data['key'])
    let item = props.data['values'].filter(i => i.value === value)[0]

    if (item === undefined) {
      item = props.data['values'][0]
      store.dispatch('set', { ['Storage.root.' + props.data['key']]: item.value })
    }

    props.data['icon'] = item.icon ?? props.data['icon']
    props.data['name'] = item.name
    props.data['title'] = item.title
  }

  icon = icon ?? props.data['icon']

  if (icon) {
    if (/^https?:\/\/?/.test(icon)) {
      slots.push(
          h('img', {
            src: icon
          })
      )
    } else if (icon[0] === '<') {
      slots.push(
          h('span', {
            innerHTML: icon
          })
      )
    } else {
      slots.push(
          h('i', {
            class: 'app-global-menu__icon ' + icon
          })
      )
    }
  }

  // name
  if (props.data['name']) {
    slots.push(
        h('span', {
          class: 'app-global-menu__title',
          innerText: props.data['name']
        })
    )
  }

  // locked
  if (props.data['locked']) {
    slots.push(
        h('i', { class: 'app-global-menu__locked fa fa-lock' })
    )
  }

  // id
  if (props.data['id'] !== undefined) {
    slots.push(
        h('span', {
          class: 'app-global-menu__id',
          innerText: props.data['id']
        })
    )
  }

  if (props.data['loading']) {
    slots.push(
        h('span', {
              class: 'app-global-menu__toggle',
              onClick: onClickToggle,
              onMouseenter: onClickToggle,
              onMouseleave: onOut
            },
            h('i', {
                  class: 'inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin'
                }
            )
        )
    )
  } else if ((props.data['data']?.length && props.level) || props.data['url']) {
    slots.push(
        h('span', {
              class: 'app-global-menu__toggle',
              onClick: onClickToggle,
              onMouseenter: onClickToggle,
              onMouseleave: onOut
            },
            h('i', {
              class: 'fa fa-angle-down fa-fw leading-[0]'
            })
        )
    )
  }

  return slots
}
</script>
