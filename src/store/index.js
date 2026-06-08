import { createStore } from 'vuex'
import { getValue, setValue } from '@/composables'

const state = {}

const mutations = {
  set (state, data) {
    if (Array.isArray(data) && data.length === 2) {
      data = { [data[0]]: data[1] }
    }

    for (const key in data) {
      setValue(key, data[key], state)
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
    return getValue(key, state) ?? def
  }
}

export default createStore({
  state,
  getters,
  mutations,
  actions
})
