import axios from 'axios'
import store from '@/store'
import router from '@/router'
import { notify } from '@kyvg/vue3-notification'

axios.defaults['headers']['common']['Accept'] = 'application/json'
axios.defaults['headers']['common']['X-Requested-With'] = 'XMLHttpRequest'

axios.interceptors['request'].use(
  config => {
    config.baseURL = (store.getters.get('Storage.hostname') || document.baseURI).replace(/\/$/g, '')
    config.headers['Accept-Language'] = store.getters.get('Storage.lang', 'en')

    const token = store.getters.get('Storage.token', '')
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }

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
      Object.values(router.currentRoute.value.params).length && router.currentRoute.value.params,
      window['Vue']._instance.refs.globalTabs?.$refs.keepAlive._.__current?.component?.exposed?.$data?.data || {}
    )

    Object.entries(params).forEach(([k, v]) => {
      if (!(v === undefined || v === null)) {
        config.url = config.url.replace((new RegExp(':' + k, 'g')), v.toString()).
          replace(/\/\//g, '/').
          replace(/\/$/, '')

        for (const i in config.params) {
          if (config.params[i] === ':' + k) {
            config.params[i] = v
          }
        }
      }
    })

    if (config.method === 'post' && params.id?.toString() === '0') {
      config.url = config.url.replace('/' + params.id, '')
    }

    config.url = config.url.replace(/(\/?:\w+)/, '').replace(/^\w+:\/\/[^\/]+/, '').replace(/(\(.*?\))/g, '')

    return config
  },
  error => Promise.reject(error)
)

axios.interceptors['response'].use(
  response => response,
  error => {
    const status = error.response?.status ?? 500

    if (status === 401) {
      return store.dispatch('set', { ['Storage.token']: null })
    }

    if (error.response?.data?.message) {
      notify({
        text: error.response.data.message.replace(/\r\n|\r|\n|\\n/g, '<br>'),
        type: 'error'
      })
    } else if (error.message) {
      notify({
        text: error.message,
        type: 'error'
      })
    }

    return Promise.reject(error)
  }
)

export default axios
