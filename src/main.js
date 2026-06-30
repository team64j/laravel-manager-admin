import * as vue from 'vue'
import axios from './services/axios'
import App from './App.vue'

window['axios'] = axios
window['vue'] = vue
window['Vue'] = vue.createApp(App)
window['app'] = window['Vue'].mount('#app')
