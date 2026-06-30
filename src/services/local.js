import { getValue, setValue } from '@/composables'
import { mergeDeep } from '@/utils'
import { ref } from 'vue'

const storageKey = 'laravel-manager-admin'
const storageVersion = 1.5

const storage = ref(JSON.parse(localStorage[storageKey] || '{"version":' + storageVersion + '}'))

if (!storage.value.version || storage.value.version < storageVersion) {
  storage.value = {
    version: storageVersion,
  }
}

export default {
  storage: storage.value,
  get (key, def) {
    return key === undefined ? storage.value : (getValue(key, storage.value) ?? def)
  },
  set (key, value) {
    if (typeof key === 'object') {
      storage.value = key === null ? {} : mergeDeep(storage.value, key)
    } else {
      setValue(key, value, storage.value)
    }

    localStorage[storageKey] = JSON.stringify(storage.value)
  },
}