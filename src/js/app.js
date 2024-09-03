import '../css/app.css'
import * as vue from 'vue'
import store from './store'
import axios from './services/Axios'
import App from './components/App/App.vue'

window['axios'] = axios
window['vue'] = vue
window['app'] = vue.createApp(App).use(store).mount('#app')
