import { createStore } from 'vuex'

const state = {}

const mutations = {
  set (state, data) {
    if (Array.isArray(data) && data.length === 2) {
      data = { [data[0]]: data[1] }
    }

    for (const key in data) {
      if (/\./.test(key)) {
        const keys = key.split('.')
        const nameStore = keys.shift()
        const keyStore = keys.shift()

        if (this.state[nameStore]) {
          if (keys.length) {
            if (this.state[nameStore][keyStore] === undefined || typeof this.state[nameStore][keyStore] !== 'object') {
              this.state[nameStore][keyStore] = {}
            }

            let s = this.state[nameStore][keyStore]

            while (keys.length) {
              const k = keys.shift()

              if (s[k] === undefined) {
                s[k] = {}
              }

              s[k] = data[key]
              s = s[k]
            }
          } else {
            if (!this.state[nameStore][keyStore] || typeof this.state[nameStore][keyStore] !== 'object') {
              this.state[nameStore][keyStore] = data[key]
            } else {
              Object.assign(this.state[nameStore][keyStore], data[key])
            }
          }

          if (this._mutations[nameStore + '/set']) {
            this.dispatch(nameStore + '/set', this.state[nameStore])
          }
        }
        delete data[key]
      } else {
        this.state[key] = data[key]
        if (this._mutations[key + '/update']) {
          this.dispatch(key + '/update')
        }
      }
    }
  },
  remove (state, key) {
    if (state[key] !== undefined) {
      delete state[key]
    }
  }
}

const actions = {
  set ({ commit }, data) {
    commit('set', data)
  },
  remove ({ commit }, key) {
    commit('remove', key)
  }
}

const getters = {
  get: (state) => (key, def) => {
    if (/\./.test(key)) {
      const keys = key.split('.')
      const nameStore = keys.shift()

      if (state[nameStore]) {
        return findValue(keys, state[nameStore]) ?? def
      }
    }

    return (key && state[key]) ?? def
  }
}

const modules = {}

Object.entries(import.meta.glob('./*.js', { eager: true })).forEach(([path, definition]) => {
  const name = path.split('/').pop().replace(/\.\w+$/, '')
  modules[name] = definition.default
})

function findValue (keys, data) {
  let value = undefined

  if (!data) {
    return value
  }

  keys.forEach((key, index) => {
    if (data[key] !== undefined) {
      if (keys[index + 1]) {
        keys.shift()
        value = findValue(keys, data[key])
      } else {
        value = data[key] ?? ''
      }
    }
  })

  return value
}

export default createStore({
  state,
  getters,
  mutations,
  actions,
  modules
})
