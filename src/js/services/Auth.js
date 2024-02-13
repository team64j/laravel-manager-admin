import store from '../store'
import router from '../router'
import * as vue from 'vue'

const auth = {
  auth (callback) {
    if (store.getters.get('Storage.token')) {
      axios.post('bootstrap').then(({ data }) => this.app(data, callback)).catch(() => this.login(callback))
    } else {
      this.login(callback)
    }
  },
  login (callback) {
    router.push({ name: 'Login' }).then(() => {
      callback(
        vue.createApp(vue.defineAsyncComponent(() => import('../layouts/Blank.vue')))
      )
    })
  },
  app (response, callback) {
    if (response.data.routes) {
      const component = () => import('../pages/Default.vue')
      for (const route of response.data.routes) {
        router.addRoute({ ...route, component })
      }

      store.dispatch('set', { config: response.data.config || {} }).then()
      store.dispatch('set', { lang: response.data.lang || {} }).then()

      document.title = response.data.config['site_name']
      const app = vue.createApp(vue.defineAsyncComponent(() => import('../layouts/Default.vue')), response.layout)

      response.data.assets && this.assets(response.data.assets)

      Object.entries(import.meta.glob('../components/*/*.vue', { eager: true })).forEach(([, { default: module }]) => {
        if (module?.['__isStatic']) {
          app.component(`App` + (module.name || module.__name), module)
        }
      })
      callback(app)
    } else {
      this.login()
    }
  },
  assets (assets) {
    assets.forEach(i => {
      switch (i.rel) {
        case 'plugin':
          import(/* @vite-ignore */i.src).then(j => {
            Vue.use(j.default)
          })
          break

        case 'component':
          import(/* @vite-ignore */i.src).then(j => {
            Vue.component(j.default.name, j.default)
          })
          break

        case 'manifest':
          const fragment = document.createRange().createContextualFragment(i.source)
          document.head.appendChild(fragment)
          break

        case 'module':
          const script = document.createElement('script')
          script.setAttribute('src', i.src)
          script.setAttribute('type', 'module')
          script.setAttribute('crossorigin', 'anonymous')
          document.head.appendChild(script)
          break

        case 'css':
          document.head.innerHTML += `<link rel="stylesheet" href="${i.src}">`
          break
      }
    })
  }
}

export default auth
