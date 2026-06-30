import { getValue, setValue } from '@/composables'
import { mergeDeep } from '@/utils'
import { ref } from 'vue'

let storage = ref({})

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
  }
}