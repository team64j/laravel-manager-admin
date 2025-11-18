export function getValue (keys, data) {
  let value

  if (!Array.isArray(keys)) {
    keys = keys.split('.')
  }

  if (data && data[keys[0]] !== undefined) {
    if (keys.length === 1) {
      value = data[keys[0]]
    } else if (data[keys[0]] !== undefined) {
      const key = keys.shift()
      value = getValue(keys, data[key])
    }
  }

  return value
}
