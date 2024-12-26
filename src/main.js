import * as vue from 'vue'
import store from './store'
import axios from './services/axios'
import App from './App.vue'

window['axios'] = axios
window['vue'] = vue
window['Vue'] = vue.createApp(App).use(store)
window['app'] = window['Vue'].mount('#app')
