import router from '../router'

const state = {
  tabs: [],
  keys: []
}

const compare = (a, b) => {
  if (b) {
    return a?.meta?.group ? a.matched[0].path === b.matched[0].path : (a.name || a.path) === (b.name || b.path)
  } else {
    return a?.meta?.group ? a.matched[0].path : a.name || a.path
  }
}

const mutations = {
  init () {
    router.getRoutes().filter(i => i?.meta?.fixed).map(i => this.dispatch('GlobalTabs/add', router.resolve(i)))
    this.dispatch('GlobalTabs/add', router.currentRoute.value)
  },

  add (state, data) {
    if (!data/* || data.path === '/'*/) {
      return
    }

    data = router.resolve(data)

    let is = false

    state['tabs'].map(i => {
      i.active = compare(i, data)

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

    state.keys = state['tabs'].map(i => compare(i))
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

    data = state['tabs'].filter(i => compare(i, data))[0]

    if (!data) {
      return
    }

    if (data?.meta.fixed) {
      return
    }

    const index = state['keys'].indexOf(compare(data))
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
      const index = state['keys'].indexOf(compare(data))
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
    const tab = state['tabs'].filter(i => compare(i, data))[0] || null

    return tab && !Object.values(data.query).length && Object.values(tab.query).length && tab || false
  },

  find: (state) => (data) => {
    return state['tabs'].filter(i => compare(i, data))[0] ||
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
