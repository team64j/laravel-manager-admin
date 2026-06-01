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

// export function getValue (keys, data) {
//   let value
//
//   if (!Array.isArray(keys)) {
//     keys = keys.split('.')
//   }
//
//   if (data && data[keys[0]] !== undefined) {
//     if (keys.length === 1) {
//       value = data[keys[0]]
//     } else if (data[keys[0]] !== undefined) {
//       const key = keys.shift()
//       value = getValue(keys, data[key])
//     }
//   }
//
//   return value
// }

// export function setValue(key, value, data) {
//   if (key.includes('.')) {
//     setDataValue(key.split('.'), value, data)
//   } else {
//     data[key] = value
//   }
// }
//
// function setDataValue(keys, value, data) {
//   const key = keys[0]
//
//   if (keys.length === 1) {
//     data[key] = value
//     return
//   }
//
//   if (typeof data[key] !== 'object' || data[key] === null) {
//     data[key] = {}
//   }
//
//   setDataValue(keys.slice(1), value, data[key])
// }

// export function setValue (key, value, data) {
//   if (/\./.test(key)) {
//     if (data[key] !== undefined) {
//       data[key] = value
//     } else {
//       setDataValue(key.split('.'), value, data, true)
//     }
//   } else {
//     data[key] = value
//   }
// }
//
// export function setDataValue (keys, value, data) {
//   const key = keys[0]
//
//   if (data[key] === undefined) {
//     data[key] = {}
//   }
//
//   if (data[key] !== undefined) {
//     if (keys[1] !== undefined) {
//       keys.shift()
//       setDataValue(keys, value, data[key], null)
//     } else {
//       data[key] = value
//     }
//   }
// }
