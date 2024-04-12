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
      hostname: this.$store.getters.get('Storage.hostname', location.origin),
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
        this.hostname = location.origin
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
    showLanguages () {
      this.isShowLanguages = !this.isShowLanguages
    },
    selectLanguage (lang) {
      this.lang = lang
      this.$store.dispatch('set', { ['Storage.lang']: lang.key })
      this.showLanguages()
    },
    showHostnames () {
      this.isShowHostnames = !this.isShowHostnames
    },
    selectHostname (item) {
      this.hostname = item.name
      this.$store.dispatch('set', { ['Storage.hostname']: this.hostname })
      this.showHostnames()
      this.checkServer()
    },
    removeHostname (item) {
      if (item.name === this.hostname) {
        this.hostname = ''
        this.$store.dispatch('set', { ['Storage.hostname']: this.hostname })
      }
      this.hostnames = this.hostnames.filter(i => i.name !== item.name)
      this.$store.dispatch('set', { ['Storage.hostnames']: this.hostnames })
      this.showHostnames()
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
  <div class="app__page__login dark flex w-full h-full justify-center items-center bg-login text-xl">

    <div
        class="relative overflow-hidden bg-black/80 text-white/80 font-medium rounded-xl px-10 py-8 shadow-lg w-[40rem] max-w-[95%]">

      <div class="flex items-center justify-center">
        <img src="../../img/logo.svg" :src="data['logo']" class="inline-block h-16" alt="logo">
        <div class="text-4xl font-bold text-white ml-3 uppercase">Evo Admin</div>
      </div>

      <div class="text-base text-center font-normal">{{ data?.['siteName'] || `* * *` }}</div>

      <div>
        <label for="hostname" class="text-base">Manager API</label>

        <div class="flex mb-2 mx-[1px]">
          <div v-if="data?.languages?.length" class="grow-0 flex -mx-[1px]">
            <button type="button"
                    class="h-full flex items-center border-2 py-2.5 px-3.5 !ring-0 !bg-transparent rounded-r-none focus:z-10"
                    @click="showLanguages">
              {{ lang.key?.toUpperCase() }}
            </button>
          </div>
          <div class="grow flex -mx-[1px]">
            <input v-model="hostname" type="text" id="hostname"
                   class="border-2 py-2.5 px-3.5 !ring-0 !bg-transparent rounded-r-none z-[1] focus:z-10"
                   :class="[ errors['hostname'] ? '!border-rose-500' : '', data?.languages?.length ? 'rounded-l-none' : '']"
                   @keyup.enter="checkServer"
                   autocomplete="off">
          </div>
          <div v-if="hostnames.length" class="grow-0 flex -mx-[1px]">
            <button type="button"
                    class="border-2 py-2.5 px-3.5 !ring-0 !bg-transparent h-full flex items-center rounded-none focus:z-10"
                    @click="showHostnames">
              <i class="fa fa-ellipsis fa-fw"/>
            </button>
          </div>
          <div class="grow-0 flex -mx-[1px]">
            <button type="button"
                    class="border-2 py-2.5 w-14 !ring-0 !bg-transparent h-full flex items-center justify-center rounded-l-none focus:z-10"
                    :disabled="isCheckServer"
                    @click="checkServer">
              <i v-if="isCheckServer"
                 class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
              <i v-else class="fa fa-globe fa-fw" :class="[ connected ? 'text-green-500' : '']"/>
            </button>
          </div>
        </div>
      </div>

      <div v-if="connected" class="pt-2">
        <div class="mb-4">
          <label for="username" class="text-base">{{ lang.user }}</label>
          <input v-model="form['username']"
                 type="text"
                 id="username"
                 name="username"
                 class="border-2 py-2.5 px-3.5 !ring-0 !bg-transparent"
                 :class="[ errors['username'] ? '!border-rose-500' : '']"
                 autocomplete="username"
                 @keyup.enter="login">
        </div>

        <div class="mb-4">
          <label for="password" class="text-base">{{ lang.password }}</label>
          <input v-model="form['password']" type="password"
                 id="password"
                 name="password"
                 class="border-2 py-2.5 px-3.5 !ring-0 !bg-transparent"
                 :class="[ errors['password'] ? '!border-rose-500' : '']"
                 @keyup.enter="login">
        </div>

        <div class="flex justify-between items-center">
          <div class="inline-flex items-center">
            <input v-model="form['remember']" type="checkbox" id="remember" name="remember" class="mr-2 h-6 w-6">
            <label for="remember" class="text-lg">{{ lang.remember }}</label>
          </div>
          <div>
            <button type="button" class="btn-green !ring-0 py-2.5 px-6 flex items-center justify-center"
                    :disabled="isLogin" @click="login">
              <i v-if="isLogin"
                 class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin absolute"/>
              <span :class="[ isLogin ? 'opacity-0' : '' ]">{{ lang.login }}</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="data?.version" class="text-sm text-gray-400 text-center mt-2 -mb-4">
        {{ data.version }}
      </div>

      <transition>
        <div v-if="isShowLanguages && data?.languages?.length"
             class="absolute z-10 left-0 top-0 w-full h-full">
          <div class="fixed left-0 top-0 right-0 bottom-0" @click="showLanguages"/>
          <div class="relative bg-gray-800 text-white/80 rounded-xl p-8 h-full overflow-auto">
            <i class="fa fa-close text-rose-600 absolute top-3 right-3 cursor-pointer" @click="showLanguages"/>
            <div v-for="i in data.languages"
                 class="flex items-center px-4 py-1 hover:bg-blue-600 hover:text-white rounded cursor-pointer transition"
                 :class="[lang.key === i.key ? 'bg-white/10 font-bold' : '']"
                 @click="selectLanguage(i)">
              <i class="fa fa-fw" :class="[lang.key === i.key ? 'fa-check -ml-1 mr-1' : '']"/>
              {{ i.value }}
            </div>
          </div>
        </div>
      </transition>

      <transition>
        <div v-if="isShowHostnames"
             class="absolute z-10 left-0 top-0 w-full h-full">
          <div class="fixed left-0 top-0 right-0 bottom-0" @click="showHostnames"/>
          <div class="relative bg-gray-800 text-white/80 rounded-xl p-8 h-full overflow-auto">
            <i class="fa fa-close text-rose-600 absolute top-3 right-3 cursor-pointer" @click="showHostnames"/>
            <div v-for="i in hostnames"
                 class="flex items-center px-4 py-1 hover:bg-blue-600 hover:text-white rounded cursor-pointer transition"
                 :class="[hostname === i.name ? 'bg-white/10 font-bold' : '']"
                 @click="selectHostname(i)">
              <i class="fa fa-fw" :class="[hostname === i.name ? 'fa-check -ml-1 mr-1' : '']"/>
              <span class="grow">{{ i.name }}</span>
              <i class="fa fa-times-circle fa-fw opacity-25 hover:opacity-80 transition"
                 @click.stop="removeHostname(i)"/>
            </div>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<style scoped>
.app__page__login {
  @apply bg-center bg-cover;
  background-image: url("../../img/login-background.jpg");
}
</style>
