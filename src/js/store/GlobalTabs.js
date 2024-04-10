import router from '../router'

const state = {
  tabs: [],
  keys: []
}

const mutations = {
  init () {
    router.getRoutes().filter(i => i?.meta?.fixed).map(i => this.dispatch('GlobalTabs/add', router.resolve(i)))
    this.dispatch('GlobalTabs/add', router.currentRoute.value)
  },

  add (state, data) {
    if (!data) {
      return
    }

    data = router.resolve(data)

    let is = false

    state['tabs'].map(i => {
      i.active = data.meta.group ? i.name === data.name : i.path === data.path

      if (i.active) {
        is = true
        data.meta = i.meta
        Object.assign(i, data)
      }
    })

    if (!is && !data.meta['hidden']) {
      data.active = true
      state['tabs'].push(data)
    }

    state.keys = state['tabs'].map(i => i.meta.group ? i.name : i.path)
  },

  set (state, data) {
    if (data.key) {
      const index = state['keys'].indexOf(data.key)
      index > -1 && window._.mergeWith(state['tabs'][index], data)
    } else {
      state['tabs'].map(i => i.active && window._.mergeWith(i, data))
    }
  },

  del (state, data, callback) {
    if (!data) {
      return
    }

    data = state['tabs'].filter(i => i.meta.group ? i.name === data.name : i.path === data.path)[0]

    if (!data) {
      return
    }

    if (data?.meta.fixed) {
      return
    }

    const index = state['tabs'].indexOf(data)

    index > -1 && state['tabs'].splice(index, 1) && state['keys'].splice(index, 1)

    this.commit('set', { treeSelect: false })

    if (data.active && index > 0 && state['tabs'][index - 1]) {
      state['tabs'][index - 1].active = true
      router.push(state['tabs'][index - 1]).then(() => {
        if (typeof callback === 'function') {
          callback()
        }
      })
    }

    return index
  },

  destroy (state) {
    state.tabs = []
    state.keys = []
    state.data = {}
  },

  to (state, data) {
    this.commit('GlobalTabs/del', router.currentRoute.value)
    router.push(data).then(() => {})
  },

  reload (state, data) {
    const route = router.resolve({ path: '/redirect' + data.path, query: data.query })

    router.replace(route).then(() => {
      const index = state['keys'].indexOf(data.meta.group ? data.name : data.path)
      index > -1 && state['keys'].splice(index, 1)
    })
  }
}

const actions = {
  init ({ commit }) {
    commit('init')
  },

  add ({ commit }, data) {
    commit('add', data)
  },

  set ({ commit }, data) {
    commit('set', data)
  },

  del ({ commit, dispatch }, data, callback) {
    return commit('del', data, callback)
  },

  destroy ({ commit }) {
    return commit('destroy')
  },

  to ({ commit }, data) {
    return commit('to', data)
  },

  reload ({ commit }, data) {
    commit('reload', data)
  },
}

const getters = {
  tabs: (state) => () => state['tabs'],

  keys: (state) => () => state['keys'],

  frames: (state) => () => state['tabs'].filter(i => i?.meta?.['isIframe']),

  get: (state) => (data) => {
    const tab = state['tabs'].filter(i => i.meta.group ? i.name === data.name : i.path === data.path)[0] || null

    return tab && !Object.values(data.query).length && Object.values(tab.query).length && tab || false
  },

  find: (state) => (data) => {
    return state['tabs'].filter(i => i.meta.group ? i.name === data.name : i.path === data.path)[0] ||
      null
  },

  isLoading: (state) => state['tabs'].filter(i => i.active)[0]?.loading
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
