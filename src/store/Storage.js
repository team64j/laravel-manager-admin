const storageKey = 'laravel-manager-admin'
const storageVersion = 1.5
let state = JSON.parse(localStorage[storageKey] || '{ "version": ' + storageVersion + ' }')

if (!state.version || state.version < storageVersion) {
  state = {
    version: storageVersion
  }
}

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

    localStorage[storageKey] = JSON.stringify(state)
  },

  del (state, key) {
    if (state[key] !== undefined) {
      delete state[key]
    }
    localStorage[storageKey] = JSON.stringify(state)
  },

  update () {
    localStorage[storageKey] = JSON.stringify(state)
  }
}

const actions = {
  set ({ commit }, data) {
    commit('set', data)
  },

  del ({ commit }, key) {
    commit('del', key)
  },

  update ({ commit }) {
    commit('update')
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
