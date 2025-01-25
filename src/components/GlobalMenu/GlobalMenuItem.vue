<script setup>
import { computed, getCurrentInstance } from 'vue'
import store from '../../store'
import router from '../../router'
import Button from '../Button/Button.vue'

const currentInstance = getCurrentInstance()

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

  // loading
  if (props.data['loading']) {
    classes.push('app-global-menu__loading')
  }

  // disabled
  if (props.data['disabled']) {
    classes.push('app-global-menu__disabled')
  }

  // filter
  if (props.data['filter'] !== undefined) {
    classes.push('app-global-menu__filter')
  }

  return classes
})

const icon = computed(() => {
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

  return icon ?? props.data['icon']
})

const showBack = computed(() => {
  return store.getters.get('isMobile') && props.level > 1
})

const action = (...args) => emit('action', ...args)

const load = () => {
  if (props.data['url'] && store.getters.get('menuShow')) {
    props.data['data'] = null

    clearTimeout(timer)
    timer = setTimeout(() => {
      emit('action', 'loadData', props.data['url'], props)
    }, 200)
  }
}

const onClick = (event) => {
  if (props.data['href']) {
    window.open(props.data['href'])

    return emit('action', 'show', false)
  } else if (props.data['to']) {
    router.to(props.data['to'])

    return emit('action', 'show', false)
  } else if (props.data['values']) {
    const value = store.getters['get']('Storage.root.' + props.data['key'])

    for (let i in props.data['values']) {
      i = parseInt(i)
      if (value === props.data['values'][i].value) {
        const item = props.data['values'][i + 1] ?? props.data['values'][0]
        store.dispatch('set', { ['Storage.root.' + props.data['key']]: item.value })
        break
      }
    }

    return emit('action', 'show', false)
  }

  let show = true

  if (store.getters.get('isMobile')) {
    if (store.getters.get('menuShow')) {
      if (event.currentTarget.classList.contains('app-global-menu__hover')) {
        show = false
      } else {
        show = props.level <= 1
      }
    }
  } else if (store.getters.get('menuShow')) {
    show = false
  }

  emit('action', 'show', show)
  emit('action', 'setActiveClass', event.target)

  if (show) {
    load(event)
  }
}

const onClickToggle = (event) => {
  clearTimeout(timer)

  if (store.getters.get('isMobile')) {
    emit('action', 'setActiveClass', event.target)
  }

  if (props.level > 1) {
    load(event)
    event.stopPropagation()
  }
}

const onEnter = (event) => {
  if (store.getters.get('isMobile') || event.target.classList.contains('app-global-menu__hover')) {
    return
  }

  emit('action', 'setActiveClass', event.target)
  load()
}

const onOut = () => {
  if (props.data['url']) {
    clearTimeout(timer)
  }
}

const onInput = (event) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    currentInstance.parent.props.filter = event.target.value
    emit('action', 'loadData', null, currentInstance.parent.props)
  }, 500)
}

const onClear = () => {
  currentInstance.parent.props.filter = null
  emit('action', 'loadData', null, currentInstance.parent.props)
}

const onPrev = () => {
  if (props.data['prev']) {
    emit('action', 'loadData', props.data['prev'], currentInstance.parent.props)
  }
}

const onNext = () => {
  if (props.data['next']) {
    emit('action', 'loadData', props.data['next'], currentInstance.parent.props)
  }
}
</script>

<template>
  <li :class="{
    'app-global-menu__parent': data?.['data']?.length || data?.['url'],
    'app-global-menu__pagination': data['prev'] || data['next'],
  }"
      :data-level="level"
      @click.stop="onClick"
      @mouseenter="onEnter"
      @mouseleave="onOut">

    <a v-if="data['href'] || data['to'] || (data['data'] && level || data['values'] || data['url'])"
       :class="classes"
       :data-tooltip="data['title']">

      <template v-if="icon">
        <img v-if="/^https?:\/\/?/.test(icon)" :src="icon" alt="">
        <span v-else-if="icon[0] === '<'" v-html="icon"/>
        <i v-else class="app-global-menu__icon" :class="icon"/>
      </template>

      <span v-if="data['name']" class="app-global-menu__title" v-html="data['name']"/>

      <i v-if="data['locked']" class="app-global-menu__locked fa fa-lock"/>

      <span v-if="data['id'] !== undefined" class="app-global-menu__id" v-html="data['id']"/>

      <span v-if="data['loading'] || ((data['data']?.length && level) || data['url'])"
            @click="onClickToggle"
            class="app-global-menu__toggle">
        <i v-if="data['loading']"
           class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
        <i v-else class="fa fa-angle-down fa-fw leading-[0]"/>
      </span>
    </a>

    <span v-else-if="data['prev'] || data['next']"
          :class="classes"
          :data-tooltip="data['title']">

      <Button class="app-global-menu__prev"
              :disabled="data['prev'] ? undefined : 'disabled'"
              @click.stop="onPrev">
        <i class="fa fa-chevron-left"/>
      </Button>

      <span>{{ data['info'] ?? data['total'] }}</span>

      <Button class="app-global-menu__next"
              :disabled="data['next'] ? undefined : 'disabled'"
              @click.stop="onNext">
        <i class="fa fa-chevron-right"/>
      </Button>
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

      <i :class="['fa fa-remove app-global-menu__clear', data['filter'] ? '' : 'hidden']" @click="onClear"/>
    </span>

    <span v-else-if="data['name']"
          :class="classes"
          :data-tooltip="data['title']"
          v-html="data['name']"/>

    <ul v-if="data['data']?.length">
      <li class="app-global-menu__back" v-if="showBack">
        <a @click.stop="data['data'] = null">
          <i class="fa fa-arrow-left"/>&nbsp;
        </a>
      </li>
      <global-menu-item v-for="(i, k) in data['data']" :data="i" :key="k" :level="level+1" @action="action"/>
    </ul>
  </li>
</template>
