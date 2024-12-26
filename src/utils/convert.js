export function convertRemToPixels (rem) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

export function convertPixelsToRem (px) {
  return px / parseFloat(getComputedStyle(document.documentElement).fontSize)
}
