export function action () {
  if (typeof this[arguments[0]] === 'function') {
    this[arguments[0]](...Array.from(arguments).splice(1))
  } else if (typeof this?.['ctx']?.[arguments[0]] === 'function') {
    this['ctx'][arguments[0]](...Array.from(arguments).splice(1))
  } else if (typeof this['$emit'] === 'function') {
    this.$emit('action', ...arguments)
  } else if (typeof this.emit === 'function') {
    this.emit('action', ...arguments)
  } else {
    console.warn('Emit', ...arguments)
  }
}
