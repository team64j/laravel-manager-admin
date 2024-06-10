<script>
import router from '../router'

export default {
  name: 'Login',
  data () {
    return {
      form: {},
      data: null,
      connected: false,
      lang: {
        key: 'en',
        user: 'User',
        password: 'Password',
        remember: 'Remember me',
        login: 'Login'
      },
      errors: {},
      hostname: this.$store.getters.get('Storage.hostname', location.origin + '/manager/api'),
      hostnames: this.$store.getters.get('Storage.hostnames', []),
      logged: false,
      isCheckServer: false,
      isLogin: false,
      isShowLanguages: false,
      isShowHostnames: false
    }
  },
  created () {
    if (this.$store.getters.get('Storage.token')) {
      router.to('/')
    } else {
      this.checkServer()
    }
  },
  methods: {
    checkServer () {
      this.data = null
      this.connected = false
      this.errors = {}
      this.isCheckServer = true

      if (!this.hostname) {
        this.hostname = location.origin + '/manager/api'
      }

      this.$store.dispatch('set', { ['Storage.hostname']: this.hostname.replace(/\/$/g, '') })

      axios.get('/bootstrap').then(r => {
        if (typeof r.data === 'string') {
          this.errors['hostname'] = true
          return
        }

        this.data = r.data['meta'] || {}

        if (this.data.version) {
          this.connected = true
          this.$nextTick(() => this.$el.querySelector('[name="username"]').focus())
        }

        if (this.data.languages?.length) {
          this.lang = this.data.languages.filter(
              i => i.key === (this.$store.getters.get('Storage.lang') || 'en'))[0] ?? {}
        }

        if (!this.hostnames.some(i => i.name === this.hostname)) {
          this.hostnames.push({
            name: this.hostname
          })
          this.$store.dispatch('set', { ['Storage.hostnames']: this.hostnames })
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
      this.$store.dispatch('set', { ['Storage.lang']: lang.key })
      this.toggleModal('isShowLanguages')
    },
    selectHostname (item) {
      this.hostname = item.name
      this.$store.dispatch('set', { ['Storage.hostname']: this.hostname })
      this.toggleModal('isShowHostnames')
      this.checkServer()
    },
    removeHostname (item) {
      if (item.name === this.hostname) {
        this.hostname = ''
        this.$store.dispatch('set', { ['Storage.hostname']: this.hostname })
      }
      this.hostnames = this.hostnames.filter(i => i.name !== item.name)
      this.$store.dispatch('set', { ['Storage.hostnames']: this.hostnames })
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
          this.$store.dispatch('set', { ['Storage.lang']: this.lang.key })
          this.$store.dispatch('set', { ['Storage.token']: data['access_token'] })
          this.$store.dispatch('set', { ['Storage.tokenExpiresIn']: data['expires_in'] })
          this.$store.dispatch('Session/clear')
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
  <div class="app__page__login">
    <div
        class="app__page__login-wrapper">

      <div class="app__page__login-logo">
        <img src="../../img/logo.svg" :src="data['logo']" alt="logo">
        <h1>Evo Admin</h1>
      </div>

      <div class="app__page__login-description">{{ data?.['siteName'] || `* * *` }}</div>

      <div class="app__page__login-form-row">
        <label for="hostname">Manager API</label>

        <div class="app__page__login-form-group-api">
          <div v-if="data?.languages?.length" class="app__page__login-form-group">
            <button type="button"
                    class="rounded-r-none"
                    @click="toggleModal('isShowLanguages')">
              {{ lang.key?.toUpperCase() }}
            </button>
          </div>
          <div class="app__page__login-form-group app__page__login-form-hostname">
            <input v-model="hostname" type="text" id="hostname"
                   class="rounded-r-none"
                   :class="[ errors['hostname'] ? '!border-rose-500' : '', data?.languages?.length ? 'rounded-l-none' : '']"
                   @keyup.enter="checkServer"
                   autocomplete="off">
          </div>
          <div v-if="hostnames.length" class="app__page__login-form-group">
            <button type="button"
                    class="rounded-none"
                    @click="toggleModal('isShowHostnames')">
              <i class="fa fa-ellipsis fa-fw"/>
            </button>
          </div>
          <div class="app__page__login-form-group">
            <button type="button"
                    class="rounded-l-none"
                    :disabled="isCheckServer"
                    @click="checkServer">
              <i class="fa fa-globe fa-fw"
                 :class="[ connected ? 'text-green-500' : '', isCheckServer? 'opacity-0' : '']"/>
              <i v-if="isCheckServer" class="app__page__login-loader"/>
            </button>
          </div>
        </div>
      </div>

      <template v-if="connected">
        <div class="app__page__login-form-row">
          <label for="username">{{ lang.user }}</label>
          <input v-model="form['username']"
                 type="text"
                 id="username"
                 name="username"
                 class="border-2 py-2.5 px-3.5 !ring-0 !bg-transparent"
                 :class="[ errors['username'] ? '!border-rose-500' : '']"
                 autocomplete="username"
                 @keyup.enter="login">
        </div>

        <div class="app__page__login-form-row">
          <label for="password">{{ lang.password }}</label>
          <input v-model="form['password']" type="password"
                 id="password"
                 name="password"
                 :class="[ errors['password'] ? '!border-rose-500' : '']"
                 @keyup.enter="login">
        </div>

        <div class="app__page__login-form-row app__page__login-form-row-login">
          <div>
            <input v-model="form['remember']" type="checkbox" id="remember" name="remember">
            <label for="remember">{{ lang.remember }}</label>
          </div>
          <div>
            <button type="button" class="btn-green" :disabled="isLogin" @click="login">
              <span :class="[ isLogin ? 'opacity-0' : '' ]">{{ lang.login }}</span>
              <i v-if="isLogin" class="app__page__login-loader"/>
            </button>
          </div>
        </div>
      </template>

      <div v-if="data?.version" class="app__page__login-form-row app__page__login-version">
        {{ data.version }}
      </div>

      <transition>
        <div v-if="isShowLanguages && data?.languages?.length" class="app__page__login-modal">
          <div class="app__page__login-modal-mask" @click="toggleModal('isShowLanguages')"/>
          <div class="app__page__login-modal-body">
            <i class="app__page__login-modal-close fa fa-close" @click="toggleModal('isShowLanguages')"/>
            <div v-for="i in data.languages"
                 class="app__page__login-modal-row"
                 :class="[lang.key === i.key ? 'app__page__login-modal-row-selected' : '']"
                 @click="selectLanguage(i)">
              <i class="fa fa-check mr-1 fa-fw" :class="[lang.key !== i.key ? 'opacity-0' : '']"/>
              <span class="grow">{{ i.value }}</span>
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
                 :class="[hostname === i.name ? 'app__page__login-modal-row-selected' : '']"
                 @click="selectHostname(i)">
              <i class="fa fa-check mr-1 fa-fw" :class="[hostname !== i.name ? 'opacity-0' : '']"/>
              <span class="grow">{{ i.name }}</span>
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
  background-image: url("../../img/login-background.jpg");
}
.app__page__login-wrapper {
  @apply relative overflow-hidden bg-black/80 text-white/80 font-medium rounded-xl px-10 py-8 shadow-lg w-[40rem] max-w-[95%]
}
.app__page__login-logo {
  @apply flex items-center justify-center
}
.app__page__login-logo img {
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
.app__page__login input {
  @apply py-2.5 px-3.5 !ring-0 !bg-transparent border-2 focus:z-10 z-[1]
}
.app__page__login button {
  @apply py-2.5 px-3.5 !ring-0 !bg-transparent border-2 focus:z-10 h-full flex items-center justify-center
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
.app__page__login-modal-row-remove {
  @apply opacity-25 hover:opacity-80 transition
}
</style>
