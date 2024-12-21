const storageKey = 'laravel-manager-admin'
let state = JSON.parse(sessionStorage[storageKey] || '{}')

const mutations = {
  set (state, data) {
    let key, value

    if (Array.isArray(data)) {
      [key, value] = data
      if (typeof state[key] === 'object') {
        Object.assign(state[key], value)
      } else {
        state[key] = value
      }
    } else if (typeof data === 'object') {
      Object.assign(state, data)
    }

    sessionStorage[storageKey] = JSON.stringify(state)
  },
  clear () {
    sessionStorage[storageKey] = JSON.stringify(state = {})
  }
}

const actions = {
  set ({ commit }, data) {
    commit('set', data)
  },
  clear ({ commit }) {
    commit('clear')
  }
}

const getters = {
  get: (state) => (key, def) => (key && state[key]) ?? def
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
