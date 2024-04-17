import '../css/app.css'
import _ from 'lodash'
import * as vue from 'vue'
import store from './store'
import axios from './services/Axios'
import App from './components/App/App.vue'

window[/*(_*/'_'/*_)*/] = _
window['axios'] = axios
window['vue'] = vue
window['app'] = vue.createApp(App).use(store).mount('#app')
