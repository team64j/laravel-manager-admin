import axios from 'axios'
import store from '../store'
import router from '../router'
import { notify } from '@kyvg/vue3-notification'

axios.defaults['headers']['common']['Accept'] = 'application/json'
axios.defaults['headers']['common']['X-Requested-With'] = 'XMLHttpRequest'

axios.interceptors['request'].use(
  config => {
    config.baseURL = (store.getters.get('Storage.hostname') || document.baseURI).replace(/\/$/g, '')
    config.headers['Authorization'] = 'Bearer ' + store.getters.get('Storage.token', '')
    config.headers['Accept-Language'] = store.getters.get('Storage.lang', 'en')

    if (!config.url) {
      return config
    }

    if (/^(http|https):\/\/[^ "]+$/.test(config.url)) {
      const url = new URL(config.url)
      config.baseURL = url.origin
      config.url = url.href.replace(url.origin, '')
    }

    const params = Object.assign(
      {},
      Object.values(config.params || {}).length && config.params,
      Object.values(router.currentRoute.value.params).length && router.currentRoute.value.params
    )

    Object.entries(params).forEach(([k, v]) => {
      if (!(v === undefined || v === null)) {
        const re = new RegExp(':' + k, 'g')

        if (re.test(config.url)) {
          //delete params[k]
        }

        if (k === 'id' && v === 'new') {
          return
        }

        config.url = config.url.replace(re, encodeURIComponent(v.toString())).replace(/\/\//g, '/').replace(/\/$/, '')
      }
    })

    config.url = config.url.replace(/(\/?:\w+)/, '').replace(/^\w+:\/\/[^\/]+/, '')

    return config
  },
  error => Promise.reject(error)
)

axios.interceptors['response'].use(
  response => response,
  error => {
    const status = error.response?.status ?? 500

    if (status === 401) {
      return store.dispatch('set', { ['Storage.token']: null }).then(() => {
        router.push({ name: 'Logout' }).then()
      })
    }

    if (error.response?.data?.message) {
      if (status === 422) {
        notify({
          text: error.response.data.message.replace(/\r\n|\r|\n|\\n/g, '<br>'),
          type: 'error'
        })
      } else {
        store.dispatch('GlobalTabs/del', router.currentRoute.value).then(() => notify({
          text: error.response.data.message,
          type: 'error'
        }))
      }
    } else if (error.message) {
      notify({
        text: error.message,
        type: 'error'
      })

      //store.dispatch('set', { ['Storage.token']: null })
      //return router.push({ name: 'Login' })
    }

    return Promise.reject(error)
  }
)

export default axios
