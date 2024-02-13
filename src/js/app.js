import '../css/app.css'
import _ from 'lodash'
import * as vue from 'vue'
import store from './store'
import router from './router'
import Auth from './services/Auth'
import axios from './services/Axios'
import Notifications from '@kyvg/vue3-notification'

window[/*(_*/'_'/*_)*/] = _
window['axios'] = axios
window['vue'] = vue

Auth.auth(app => {
  app.use(store)
  app.use(router)
  app.use(Notifications)
  app.mount('#app')
  window['app'] = app
})
