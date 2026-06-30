import { getValue, setValue } from '@/composables'
import { ref } from 'vue'

const storage = ref({})

export default {
  storage: storage.value,
  get (key, def) {
    return key === undefined ? storage.value : (getValue(key, storage.value) ?? def)
  },
  set (key, value) {
    if (typeof key === 'object') {
      storage.value = key === null ? {} : Object.assign(storage.value, key)
    } else {
      setValue(key, value, storage.value)
    }
  }
}