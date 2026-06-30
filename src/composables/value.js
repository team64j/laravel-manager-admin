export function getValue (key, data) {
  const keys = Array.isArray(key) ? key : key.split('.')

  let current = data

  for (const k of keys) {
    if (current == null || typeof current !== 'object') {
      return undefined
    }

    if (/:/.test(k)) {
      let j, n
      [j, n] = k.split(':')
      current = current.find(i => i[j].toString() === n.toString())
    } else {
      current = current[k]
    }
  }

  return current
}

export function setValue (key, value, data) {
  if (!key.includes('.')) {
    data[key] = value
    return
  }

  const keys = key.split('.')
  const lastKey = keys.pop()
  let current = data

  for (const k of keys) {
    if (typeof current[k] !== 'object' || current[k] === null) {
      current[k] = {}
    }
    if (/:/.test(k)) {
      let j, n
      [j, n] = k.split(':')
      current = current.find(i => i[j].toString() === n.toString())
    } else {
      current = current[k]
    }
  }

  current[lastKey] = value
}
