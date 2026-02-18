<script>
import router from '@/router'
import store from '@/store'
import { defineAsyncComponent } from 'vue'

export default {
  name: 'LoginPage',
  components: {
    Logo: defineAsyncComponent(() => import('@/components/Logo/Logo.vue')),
    Input: defineAsyncComponent(() => import('@/components/Input/Input.vue')),
    Button: defineAsyncComponent(() => import('@/components/Button/Button.vue')),
    Checkbox: defineAsyncComponent(() => import('@/components/Checkbox/Checkbox.vue'))
  },
  data () {
    return {
      form: {
        username: null,
        password: null,
        remember: null
      },
      config: {},
      languages: [],
      connected: false,
      lang: {
        key: 'en',
        user: 'User',
        password: 'Password',
        remember: 'Remember me',
        login: 'Login'
      },
      errors: {},
      hostname: store.getters.get('Storage.hostname', location.origin + '/manager/api'),
      hostnames: store.getters.get('Storage.hostnames', []),
      logged: false,
      isCheckServer: false,
      isLogin: false,
      isShowLanguages: false,
      isShowHostnames: false
    }
  },
  created () {
    if (store.getters.get('Storage.token')) {
      router.to('/')
    } else {
      this.checkServer()
    }
  },
  methods: {
    checkServer () {
      this.config = {}
      this.languages = []
      this.connected = false
      this.errors = {}
      this.isCheckServer = true

      if (!this.hostname) {
        this.hostname = location.origin + '/manager/api'
      }

      store.dispatch('set', { ['Storage.hostname']: this.hostname.replace(/\/$/g, '') })

      axios.get('/bootstrap').then(r => {
        if (typeof r.data === 'string') {
          this.errors['hostname'] = true
          return
        }

        this.languages = r.data['data']?.['languages'] || []
        this.config = r.data['data']?.['config'] || {}

        if (this.config['siteName']) {
          document.title = this.config['siteName']
        }

        if (this.config['version']) {
          this.connected = true
          //this.$nextTick(() => this.$el.querySelector('[name="username"]').focus())
        }

        if (this.languages.length) {
          this.lang = this.languages.filter(
              i => i.key === (store.getters.get('Storage.lang') || 'en'))[0] ?? {}
        }

        if (!this.hostnames.some(i => i.name === this.hostname)) {
          this.hostnames.push({
            name: this.hostname
          })
          store.dispatch('set', { ['Storage.hostnames']: this.hostnames })
        }
      }).catch(() => {
        this.connected = false
        this.errors['hostname'] = true
      }).finally(() => {
        this.isCheckServer = false
      })
    },
    toggleModal (key) {
      this[key] = !this[key]
    },
    selectLanguage (lang) {
      this.lang = lang
      store.dispatch('set', { ['Storage.lang']: lang.key })
      this.toggleModal('isShowLanguages')
    },
    selectHostname (item) {
      this.hostname = item.name
      store.dispatch('set', { ['Storage.hostname']: this.hostname })
      this.toggleModal('isShowHostnames')
      this.checkServer()
    },
    removeHostname (item) {
      if (item.name === this.hostname) {
        this.hostname = ''
        store.dispatch('set', { ['Storage.hostname']: this.hostname })
      }
      this.hostnames = this.hostnames.filter(i => i.name !== item.name)
      store.dispatch('set', { ['Storage.hostnames']: this.hostnames })
      this.toggleModal('isShowHostnames')
      this.checkServer()
    },
    login () {
      this.errors = {}
      this.isLogin = true

      axios.post('/auth', this.form).then(r => {
        const data = r.data['data']

        if (data['access_token']) {
          this.logged = true
          store.dispatch('set', { ['Storage.lang']: this.lang.key })
          store.dispatch('set', { ['Storage.token']: data['access_token'] })
          store.dispatch('set', { ['Storage.tokenExpiresIn']: data['expires_in'] })
          store.dispatch('Session/clear')
          router.to('/')
        }
      }).catch(() => {
        this.errors['username'] = true
        this.errors['password'] = true
      }).finally(() => {
        this.isLogin = false
      })
    }
  }
}
</script>

<template>
  <div class="app__page__login dark">
    <div
        class="app__page__login-wrapper">

      <div class="app__page__login-logo">
        <logo/>
        <h1>Evo Admin</h1>
      </div>

      <div class="app__page__login-description">{{ config?.['siteName'] || ` ` }}</div>

      <div class="app__page__login-form-row">
        <label for="hostname">API URL</label>

        <div class="app__page__login-form-group-api">
          <div v-if="languages?.length" class="app__page__login-form-group">
            <Button
                :value="lang.key?.toUpperCase()"
                input-class="btn-lg rounded-r-none !bg-transparent"
                @click="toggleModal('isShowLanguages')"/>
          </div>
          <div class="app__page__login-form-group app__page__login-form-hostname">
            <Input
                v-model="hostname"
                class="w-full"
                :input-class="{
                  'input-lg rounded-r-none !bg-transparent': 1,
                  'rounded-l-none': languages?.length,
                  'z-10': errors['hostname']
                }"
                :error="errors['hostname']"
                @keyup.enter="checkServer"
            />
          </div>
          <div v-if="hostnames.length" class="app__page__login-form-group">
            <Button
                input-class="btn-lg rounded-none !bg-transparent"
                icon="fa fa-ellipsis fa-fw"
                @click="toggleModal('isShowHostnames')"/>
          </div>
          <div class="app__page__login-form-group">
            <Button type="button"
                    input-class="btn-lg rounded-l-none !bg-transparent"
                    :icon="{ 'fa fa-globe fa-fw': 1, 'text-green-500': connected }"
                    :disabled="isCheckServer"
                    :loading="isCheckServer"
                    @click="checkServer"/>
          </div>
        </div>
      </div>

      <template v-if="connected">
        <Input
            v-model="form['username']"
            :error="errors['username']"
            type="text"
            class="mb-4"
            input-class="input-lg !bg-transparent"
            :label="lang.user"
            label-class="text-base font-medium"
            @keyup.enter="login"
        />

        <Input
            v-model="form['password']"
            :error="errors['password']"
            type="password"
            class="mb-4"
            input-class="input-lg !bg-transparent"
            :label="lang.password"
            label-class="text-base font-medium"
            @keyup.enter="login"
        />

        <div class="app__page__login-form-row app__page__login-form-row-login">
          <div>
            <Checkbox
                v-model="form['remember']"
                input-class="input-lg !bg-transparent"
                :label="lang.remember"
                label-class="text-base font-normal"/>
          </div>
          <div>
            <Button
                class="btn-lg btn-green"
                :value="lang.login"
                :disabled="isLogin"
                :loading="isLogin"
                @click="login"/>
          </div>
        </div>
      </template>

      <div v-if="config?.['version']" class="app__page__login-form-row app__page__login-version">
        {{ config['version'] }}
      </div>

      <transition>
        <div v-if="isShowLanguages && languages?.length" class="app__page__login-modal">
          <div class="app__page__login-modal-mask" @click="toggleModal('isShowLanguages')"/>
          <div class="app__page__login-modal-body">
            <i class="app__page__login-modal-close fa fa-close" @click="toggleModal('isShowLanguages')"/>
            <div v-for="i in languages"
                 class="app__page__login-modal-row"
                 :class="{ 'app__page__login-modal-row-selected': lang.key === i.key }"
                 @click="selectLanguage(i)">
              <i class="fa fa-check fa-fw app__page__login-modal-check"/>
              <span class="app__page__login-modal-row-title">{{ i.value }}</span>
            </div>
          </div>
        </div>
      </transition>

      <transition>
        <div v-if="isShowHostnames" class="app__page__login-modal">
          <div class="app__page__login-modal-mask" @click="toggleModal('isShowHostnames')"/>
          <div class="app__page__login-modal-body">
            <i class="app__page__login-modal-close fa fa-close" @click="toggleModal('isShowHostnames')"/>
            <div v-for="i in hostnames"
                 class="app__page__login-modal-row"
                 :class="{ 'app__page__login-modal-row-selected': hostname === i.name}"
                 @click="selectHostname(i)">
              <i class="fa fa-check fa-fw app__page__login-modal-check"/>
              <span class="app__page__login-modal-row-title">{{ i.name }}</span>
              <i class="fa fa-times-circle fa-fw app__page__login-modal-row-remove" @click.stop="removeHostname(i)"/>
            </div>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<style scoped>
.app__page__login {
  @apply flex w-full h-full justify-center items-center text-xl bg-center bg-cover;
  background-image: url("../../background.jpg");
}
.app__page__login-wrapper {
  @apply relative overflow-hidden bg-black/80 text-white/80 font-medium rounded-xl px-10 py-8 shadow-lg w-[40rem] max-w-[95%] min-h-64
}
.app__page__login-logo {
  @apply flex items-center justify-center
}
.app__page__login-logo img, .app__page__login-logo svg {
  @apply inline-block h-16
}
.app__page__login-logo h1 {
  @apply text-4xl font-bold text-white ml-3 uppercase
}
.app__page__login-description {
  @apply text-base text-center font-normal
}
.app__page__login-form-group-api {
  @apply flex mb-2 mx-[1px] w-full
}
.app__page__login-form-row {
  @apply mb-4 last:mb-0 flex flex-col justify-between items-center
}
.app__page__login-form-row-login {
  @apply flex-row
}
.app__page__login-version {
  @apply text-sm text-gray-400 text-center mt-2 !-mb-4
}
.app__page__login-form-row-login > div {
  @apply flex items-center
}
.app__page__login-form-group {
  @apply flex grow-0 -mx-[1px]
}
.app__page__login-form-hostname {
  @apply grow
}
.app__page__login input, .app__page__login .app__page__login-form-group-api button {
  @apply py-2.5 px-3.5 border-2 focus:z-10 z-[1]
}
.app__page__login button {
  @apply flex items-center justify-center py-2.5 px-7
}
.app__page__login input[type="checkbox"] {
  @apply p-0 mr-2 h-6 w-6
}
.app__page__login label {
  @apply w-full text-base
}
.app__page__login-loader {
  @apply absolute inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin
}
.app__page__login-modal {
  @apply absolute z-10 left-0 top-0 w-full h-full
}
.app__page__login-modal-mask {
  @apply fixed left-0 top-0 right-0 bottom-0
}
.app__page__login-modal-body {
  @apply relative bg-gray-800 text-white/80 rounded-xl p-8 h-full overflow-auto
}
.app__page__login-modal-close {
  @apply text-rose-600 absolute top-3 right-3 cursor-pointer
}
.app__page__login-modal-row {
  @apply flex items-center px-4 py-1 hover:bg-blue-600 hover:text-white rounded cursor-pointer transition
}
.app__page__login-modal-row-selected {
  @apply bg-white/10 font-bold
}
.app__page__login-modal-row:not(.app__page__login-modal-row-selected) > .app__page__login-modal-check {
  @apply opacity-0
}
.app__page__login-modal-row-title {
  @apply grow pl-1
}
.app__page__login-modal-row-remove {
  @apply opacity-25 hover:opacity-80 transition
}
</style>
