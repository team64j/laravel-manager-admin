<template>
  <li :class="{
    'app-global-menu__parent': data?.['data']?.length || data?.['url'],
    'app-global-menu__pagination': props.data['prev'] || props.data['next']
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

      <span v-if="props.data['name']" class="app-global-menu__title" v-html="props.data['name']"/>

      <i v-if="props.data['locked']" class="app-global-menu__locked fa fa-lock"/>

      <span v-if="props.data['id'] !== undefined" class="app-global-menu__id" v-html="props.data['id']"/>

      <span v-if="props.data['loading'] || ((props.data['data']?.length && props.level) || props.data['url'])"
            @click="onClickToggle"
            class="app-global-menu__toggle">
        <i v-if="props.data['loading']"
           class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
        <i v-else class="fa fa-angle-down fa-fw leading-[0]"/>
      </span>
    </a>

    <span v-else-if="data['prev'] || data['next']"
          :class="classes"
          :data-tooltip="data['title']">

      <button class="app-global-menu__prev"
              :disabled="props.data['prev'] ? undefined : 'disabled'"
              @click.stop="onPrev">
        <i class="fa fa-chevron-left"/>
      </button>

      <span>{{ data['info'] ?? data['total'] }}</span>

      <button class="app-global-menu__next"
              :disabled="props.data['next'] ? undefined : 'disabled'"
              @click.stop="onNext">
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

      <i :class="['fa fa-remove app-global-menu__clear', data['filter'] ? '' : 'hidden']" @click="onClear"/>
    </span>

    <span v-else-if="data['name']"
          :class="classes"
          :data-tooltip="data['title']"
          v-html="data['name']"/>

    <ul v-if="data['data']?.length">
      <li class="app-global-menu__back" v-if="showBack">
        <a @click.stop="props.data['data'] = null">
          <i class="fa fa-arrow-left"/>&nbsp;
        </a>
      </li>
      <global-menu-item v-for="(i, k) in data['data']" :data="i" :key="k" :level="level+1" @action="action"/>
    </ul>
  </li>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue'
import store from '../../store'
import router from '../../router'

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
  return window.innerWidth < 1024 && props.level > 1
})

const action = (...args) => emit('action', ...args)

const load = () => {
  if (props.data['url'] && store.getters.get('menuShow')) {
    props.data['data'] = null

    clearTimeout(timer)
    timer = setTimeout(() => {
      emit('action', 'loadData', props.data['url'], props)
      emit('action', 'show', true)
    }, 200)
  }
}

const onClick = () => {
  switch (true) {
    case props.data['values'] || props.data['to']:
      emit('action', 'show', false)
      break

    case !!props.data['href']:
      window.open(props.data['href'])
      break

    case !!props.data['to']:
      router.to(props.data['to'])
      break

    case !!props.data['values']:
      const value = store.getters['get']('Storage.root.' + props.data['key'])

      for (let i in props.data['values']) {
        i = parseInt(i)
        if (value === props.data['values'][i].value) {
          const item = props.data['values'][i + 1] ?? props.data['values'][0]
          store.dispatch('set', { ['Storage.root.' + props.data['key']]: item.value })
          break
        }
      }
      break
  }

  if (store.getters.get('menuShow')) {
    emit('action', 'show', false)
  } else {
    emit('action', 'show', true)
    load()
  }
}

const onClickToggle = (event) => {
  clearTimeout(timer)

  if (props.level > 1) {
    load()
    event.stopPropagation()
  }
}

const onEnter = (event) => {
  if (event.target.classList.contains('app-global-menu__hover')) {
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
    instance.parent.props.filter = event.target.value
    emit('action', 'loadData', null, instance.parent.props)
  }, 500)
}

const onClear = () => {
  instance.parent.props.filter = null
  emit('action', 'loadData', null, instance.parent.props)
}

const onPrev = () => {
  if (props.data['prev']) {
    emit('action', 'loadData', props.data['prev'], instance.parent.props)
  }
}

const onNext = () => {
  if (props.data['next']) {
    emit('action', 'loadData', props.data['next'], instance.parent.props)
  }
}
</script>
