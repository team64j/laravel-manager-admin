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

export function setValue (key, value, data) {
  if (/\./.test(key)) {
    if (data[key] !== undefined) {
      data[key] = value
    } else {
      setDataValue(key.split('.'), value, data, true)
    }
  } else {
    data[key] = value
  }
}

export function setDataValue (keys, value, data) {
  const key = keys[0]

  if (data[key] !== undefined) {
    if (keys[1] !== undefined) {
      keys.shift()
      setDataValue(keys, value, data[key], null)
    } else {
      data[key] = value
    }
  }
}
