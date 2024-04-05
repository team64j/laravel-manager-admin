<script>
import { h } from 'vue'
import GlobalMenuItem from './GlobalMenuItem.vue'

import('./GlobalMenu.css')

export default {
  name: 'GlobalMenu',
  props: {
    data: Array
  },
  mounted () {
    this.show(false)

    document.addEventListener('click', event => {
      const target = event.target.closest('li')

      if (target && target.closest('.app-global-menu')) {
        if (target.classList.contains('app-global-menu__parent')) {
          this.show(!this.$el.classList.contains('app-global-menu__active'))
        } else {
          this.show(false)
        }
      } else if (this.$el.classList.contains('app-global-menu__active')) {
        this.show(false)
      }
    })
  },
  methods: {
    action () {
      if (typeof this[arguments[0]] === 'function') {
        this[arguments[0]](...Array.from(arguments).splice(1))
      } else {
        this.$emit('action', ...arguments)
      }
    },
    show (value = true) {
      this.$el.classList.toggle('app-global-menu__active', value)
      this.$store.dispatch('set', { menuShow: value })
    },
    onNodeClick (data) {
      if (data['values']) {
        const value = this.$store.getters['get']('Storage.root.' + data['key'])

        for (let i in data['values']) {
          i = parseInt(i)
          if (value === data['values'][i].value) {
            const item = data['values'][i + 1] ?? data['values'][0]
            this.$store.dispatch('set', { ['Storage.root.' + data['key']]: item.value })
            break
          }
        }
      }
    },
    loadData (url, params = {}, instance) {
      if (params['__v_skip']) {
        instance = params
        params = {}
      }

      url ??= instance.model['url']
      instance.loading = true
      instance.model.data = []

      if (params.filter !== undefined) {
        instance.filter = params.filter
      }

      axios.get(url, {
        params: params
      }).then(({ data }) => {
        const prepend = []
        const pagination = data['meta']['pagination'] ?? {}

        if (data['meta']['prepend']) {
          prepend.push(...data['meta']['prepend'])
        }

        if (pagination?.['total'] > pagination?.['per'] || params.filter) {
          prepend.push({ filter: params.filter || '' })
        }

        instance.model.data = [].concat(prepend, (data['data'] || []).map(i => {
          i.to = {
            name: data['meta']['name'],
            params: {
              id: i.id
            }
          }

          return i
        }))

        if (pagination?.['prev'] || pagination?.['next']) {
          instance.model.data.push({
            total: pagination['total'] ?? null,
            info: pagination['info'] ?? null,
            prev: pagination['prev'] ?? null,
            next: pagination['next'] ?? null
          })
        }

        instance.loading = false
      }).catch(() => {
        instance.loading = false
      })
    }
  },
  setup (props) {
    return function () {
      return h('div', {
        class: 'app-global-menu'
      }, [
        h('ul', props.data.map((n, i) => h(
                GlobalMenuItem,
                {
                  data: n,
                  key: i,
                  onAction: this.action
                }
            )
        ))
      ])
    }
  }
}
</script>
