export function action (method, ...args) {
  const callback = this[method] ?? this?.['ctx']?.[method] ?? this?.exposed?.[method]
  const emit = this['emit'] ?? this?.['ctx']?.['$emit'] ?? this['$emit']

  if (typeof callback === 'function') {
    callback(...args)
  } else if (typeof emit === 'function') {
    emit('action', ...arguments)
  } else {
    console.warn('Emit', ...arguments)
  }
}
