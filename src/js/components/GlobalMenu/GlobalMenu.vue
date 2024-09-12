<template>
  <div class="app-global-menu">
    <ul>
      <global-menu-item v-for="(i, k) in data" :data="i" :key="k" @action="action"/>
    </ul>
  </div>
</template>

<script setup>
import('./GlobalMenu.css')
import { getCurrentInstance, onMounted } from 'vue'
import GlobalMenuItem from './GlobalMenuItem.vue'
import store from '../../store'

defineOptions({
  name: 'GlobalMenu',
  __isStatic: true
})

const instance = getCurrentInstance()
const props = defineProps(['data'])
const emit = defineEmits(['action'])

const methods = {
  show (value = true) {
    instance.vnode.el.classList.toggle('app-global-menu--active', value)
    store.dispatch('set', { menuShow: value })
  },
  setActiveClass (el) {
    instance.vnode.el.querySelectorAll('.app-global-menu__hover').
        forEach(i => i.classList.remove('app-global-menu__hover'))

    while (true) {
      el.classList.add('app-global-menu__hover')
      el = el.parentElement.closest('li')

      if (!el) {
        break
      }
    }
  },
  loadData (url, inst) {
    url ??= inst.ctx.data['url']
    inst.ctx.data['loading'] = true
    inst.ctx.data['data'] = []

    const params = {}

    if (inst.ctx.filter !== undefined) {
      params.filter = inst.ctx.filter
    }

    axios.get(url, {
      params
    }).then(({ data }) => {
      const prepend = []
      const pagination = data['meta']['pagination'] ?? {}

      if (data['meta']['prepend']) {
        prepend.push(...data['meta']['prepend'])
      }

      if (pagination?.['total'] > pagination?.['per'] || inst.ctx.filter) {
        prepend.push({ filter: inst.ctx.filter || '' })
      }

      inst.ctx.data['data'] = [].concat(prepend, (data['data'] || []).map(i => {
        i.to = {
          path: data['meta']['route'].replace(':id', i.id)
        }

        return i
      }))

      if (pagination?.['prev'] || pagination?.['next']) {
        inst.ctx.data['data'].push({
          total: pagination['total'] ?? null,
          info: pagination['info'] ?? null,
          prev: pagination['prev'] ?? null,
          next: pagination['next'] ?? null
        })
      }

      inst.ctx.data['loading'] = false
    }).catch(() => {
      inst.ctx.data['loading'] = false
    })
  }
}

const action = (...args) => {
  if (typeof methods[args[0]] === 'function') {
    methods[args[0]](...Array.from(args).splice(1))
  } else {
    emit('action', ...args)
  }
}

onMounted(() => {
  methods.show(false)

  document.addEventListener('click', event => {
    const target = event.target.closest('li')

    if (target && target.closest('.app-global-menu')) {
      if (target.classList.contains('app-global-menu__parent')) {
        methods.show(!instance.vnode.el.classList.contains('app-global-menu--active'))
      } else {
        methods.show(false)
      }
    } else if (instance.vnode.el.classList.contains('app-global-menu--active')) {
      methods.show(false)
    }
  })
})
</script>
