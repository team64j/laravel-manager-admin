<script setup>
import { computed, getCurrentInstance, h, markRaw, reactive } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { javascript } from '@codemirror/lang-javascript'
import { markdown } from '@codemirror/lang-markdown'
import { json } from '@codemirror/lang-json'
import { html } from '@codemirror/lang-html'
import { php } from '@codemirror/lang-php'
import { xml } from '@codemirror/lang-xml'
import { css } from '@codemirror/lang-css'
import { vue } from '@codemirror/lang-vue'
import { sql } from '@codemirror/lang-sql'
import store from '../../store'

defineOptions({
  name: 'CodeEditor',
  __isStatic: true
})

const currentInstance = getCurrentInstance()

const props = defineProps({
  modelValue: {
    type: [String, Object, Number]
  },
  config: {
    type: Array,
    default: [{ component: 'Codemirror', name: 'Codemirror' }]
  },
  rows: {
    type: [String, Number],
    default: 3
  },
  class: [Array, Object, String],
  inputClass: [Array, Object, String],
  label: String,
  help: String,
  description: String,
  lang: String,
  fullSize: Boolean
})

const emit = defineEmits(['update:modelValue'])

const defaultConfig = [
  {
    active: true,
    component: 'Textarea',
    name: 'none'
  },
  {
    component: 'Codemirror',
    name: 'Codemirror'
  }
]

const data = reactive({
  currentConfig: props.config.length > 1
      ? props.config.filter(i => i.active)[0] || defaultConfig[0]
      : props.config[0]
})

const languages = {
  javascript,
  markdown,
  html,
  json,
  css,
  xml,
  php,
  vue,
  sql
}

const component = computed(() => {
  if (!data.currentConfig) {
    return
  }

  if (data.currentConfig['component'] === 'Textarea') {
    data.currentConfig['_component'] = () => h('textarea', {
      value: model.value,
      rows: props.rows,
      class: 'block w-full px-3 py-1 rounded resize-none',
      onInput: event => {
        emit('update:modelValue', event.target.value, currentInstance['ctx'])
      }
    })
  } else {
    data.currentConfig['component'] = 'Codemirror'
    data.currentConfig['_component'] = markRaw(Codemirror)
  }

  return data.currentConfig['_component']
})

const model = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value, currentInstance['ctx'])
  }
})

const extensions = computed(() => {
  if (!data.currentConfig) {
    return
  }

  const extensions = []

  if (!data.currentConfig?.['lang'] && props.lang) {
    data.currentConfig['lang'] = props.lang
  }

  if (languages[data.currentConfig?.['lang']]) {
    extensions.push(languages[data.currentConfig['lang']]())
  }

  if (store.getters['get']('Storage.root.dark') || data.currentConfig?.['dark']) {
    extensions.push(oneDark)
  }

  return extensions
})

const height = computed(() => {
  if (props.rows === 'auto') {
    return props.rows
  }

  const fs = parseFloat(window.getComputedStyle(document.documentElement, null).getPropertyValue('font-size'))

  return ((fs * 0.375) * 2) + (props.rows * 1.5 * fs) + 2 + 'px'
})

function onClickSelect (event) {
  props.config.map(i => {
    if (i.component === event.currentTarget.dataset['component']) {
      i.active = true
      data.currentConfig = { ...i }
    } else {
      i.active = false
    }
  })
}

function onClickFullscreen () {
  if (currentInstance.refs.editor.classList.contains('app-editor__full-screen')) {
    currentInstance.refs.editor.classList.remove('app-editor__full-screen')
    currentInstance.vnode.el.appendChild(currentInstance.refs.editor)
  } else {
    currentInstance.refs.editor.classList.add('app-editor__full-screen')
    currentInstance.root.refs.rootElement.appendChild(currentInstance.refs.editor)
  }
}

document.addEventListener('keydown', event => {
  if (!currentInstance.refs.editor) {
    return
  }

  if (currentInstance.refs.editor.classList.contains('app-editor__full-screen') && event.key === 'Escape') {
    onClickFullscreen()
  }
})
</script>

<template>
  <div class="w-full" :class="[props.class, fullSize ? 'h-full' : '']">
    <div v-if="label" class="block font-bold mb-1">
      {{ label }}
      <i v-if="help" class="ml-2 font-normal" :data-tooltip="help"/>
    </div>

    <div ref="editor" class="app-editor relative flex grow flex-col"
         :class="[inputClass, fullSize ? 'app-editor__full-size' : '']">

      <div class="app-editor__settings">
        <i class="fas fa-expand fa-compress cursor-pointer app-editor__btn-fullscreen" @click="onClickFullscreen"/>
        <i class="fa fa-gear select" v-if="config.length > 1">
          <span class="app-editor__menu">
            <span v-for="i in config" :class="{ 'active': i.active }" @click="onClickSelect"
                  :data-component="i.component">
              {{ i.name }}
            </span>
          </span>
        </i>
      </div>

      <component
          v-model="model"
          :is="component"
          :extensions="extensions"
          :style="{ height }"/>

    </div>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
  </div>
</template>

<style scoped>
.app-editor__settings {
  @apply absolute z-10 top-1.5 right-2 w-5
}
.app-editor__settings i {
  @apply relative mb-2 opacity-80 hover:opacity-100
}
.app-editor__settings i:hover > * {
  @apply opacity-100 visible
}
.app-editor__menu {
  @apply block opacity-0 invisible absolute right-0 top-full py-1 rounded shadow-md font-sans font-normal text-base text-white bg-gray-800 dark:text-gray-800 dark:bg-white transition
}
.app-editor__menu span:hover, .app-editor__settings .app-editor__menu span.active {
  @apply bg-blue-600 text-white
}
.app-editor__menu span {
  @apply block px-4 py-1 cursor-pointer hover:bg-blue-500
}
.app-editor.app-editor__full-screen {
  @apply fixed z-50 left-0 top-0 right-0 bottom-0 bg-gray-100 dark:bg-gray-800;
  z-index: 90099;
}
.app-editor.app-editor__full-size {
  @apply h-full
}
</style>

<style>
.app-editor {
  @apply border rounded focus:ring-2 focus:border-blue-500
}
.app-editor .ͼ1.cm-editor {
  @apply overflow-hidden w-full min-h-full bg-white dark:bg-gray-800 rounded transition-all
}
.app-editor.app-editor__full-size .ͼ1.cm-editor {
  @apply h-full
}
.app-editor .ͼ1.cm-editor.cm-focused {
  @apply border-blue-500 ring-2 ring-offset-0 ring-blue-500 outline-0
}
.app-editor .ͼ1 .cm-scroller {
  @apply rounded
}
.app-editor .ͼ1 .cm-gutters {
  @apply border-0 border-r border-solid border-r-gray-50 dark:border-r-gray-600 bg-transparent dark:bg-transparent
}
.app-editor .ͼ1 .cm-content {
  @apply grow !basis-0 max-w-full whitespace-pre-wrap break-words break-all
}
.app-editor.app-editor__full-screen > textarea, .app-editor.app-editor__full-screen .v-codemirror, .app-editor.app-editor__full-screen .v-codemirror .cm-editor {
  @apply !h-full text-lg
}
</style>

