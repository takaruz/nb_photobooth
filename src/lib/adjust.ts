import { applyFilter, type FilterId } from './filters'

/** Lightroom-style "Light" settings for one photo. Exposure is in stops; the rest are -100..100. */
export interface Adjustments {
  exposure: number
  contrast: number
  highlights: number
  shadows: number
  whites: number
  blacks: number
}

export const NO_ADJUST: Adjustments = { exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0 }

export const LIGHT_SLIDERS: { key: keyof Adjustments; label: string; min: number; max: number; step: number }[] = [
  { key: 'exposure', label: 'Exposure', min: -2, max: 2, step: 0.01 },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, step: 1 },
  { key: 'highlights', label: 'Highlights', min: -100, max: 100, step: 1 },
  { key: 'shadows', label: 'Shadows', min: -100, max: 100, step: 1 },
  { key: 'whites', label: 'Whites', min: -100, max: 100, step: 1 },
  { key: 'blacks', label: 'Blacks', min: -100, max: 100, step: 1 },
]

export const isNeutral = (a: Adjustments) =>
  LIGHT_SLIDERS.every(({ key }) => a[key] === 0)

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const toSrgb = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055)
/** Bell-shaped weight centered on `center`, so a slider mostly moves its own tonal range. */
const band = (v: number, center: number, width: number) => Math.exp(-(((v - center) / width) ** 2))

/** One tone curve for all six settings, as a 256-entry lookup table. */
function buildCurve(a: Adjustments): Uint8ClampedArray {
  const c = a.contrast / 100
  const h = a.highlights / 100
  const s = a.shadows / 100
  const w = a.whites / 100
  const b = a.blacks / 100
  const lut = new Uint8ClampedArray(256)

  for (let i = 0; i < 256; i++) {
    // Exposure in linear light: +1 = one stop (twice the light), like a camera.
    let v = clamp01(toSrgb(toLinear(i / 255) * 2 ** a.exposure))

    // Contrast: blend toward an S-curve (more) or toward mid-gray (less); 0 and 1 stay put.
    v = c >= 0 ? v + c * (v * v * (3 - 2 * v) - v) : 0.5 + (v - 0.5) * (1 + c * 0.6)

    // Highlights / shadows: lift or pull the bright / dark midtone bands.
    v += h * 0.22 * band(v, 0.75, 0.2)
    v += s * 0.22 * band(v, 0.25, 0.2)

    // Whites / blacks: move the two ends of the range.
    v += w * 0.18 * v ** 3
    v += b * 0.18 * (1 - v) ** 3

    lut[i] = Math.round(clamp01(v) * 255)
  }
  return lut
}

/** Apply light adjustments to a canvas in place. */
export function applyAdjust(canvas: HTMLCanvasElement, a: Adjustments) {
  if (isNeutral(a)) return
  const lut = buildCurve(a)
  const ctx = canvas.getContext('2d')!
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = data.data
  for (let i = 0; i < d.length; i += 4) {
    d[i] = lut[d[i]]
    d[i + 1] = lut[d[i + 1]]
    d[i + 2] = lut[d[i + 2]]
  }
  ctx.putImageData(data, 0, 0)
}

// One processed copy per photo: keeping every variant around would blow past iOS canvas memory.
const cache = new WeakMap<HTMLCanvasElement, { key: string; canvas: HTMLCanvasElement }>()

/** `img` with light adjustments and then the filter applied (cached). */
export function developed(img: HTMLCanvasElement, a: Adjustments, filter: FilterId): HTMLCanvasElement {
  if (filter === 'none' && isNeutral(a)) return img
  const key = `${filter}|${LIGHT_SLIDERS.map(({ key }) => a[key]).join(',')}`
  const hit = cache.get(img)
  if (hit?.key === key) return hit.canvas
  if (hit) hit.canvas.width = 0 // release the old copy's memory right away

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  canvas.getContext('2d')!.drawImage(img, 0, 0)
  applyAdjust(canvas, a)
  applyFilter(canvas, filter)
  cache.set(img, { key, canvas })
  return canvas
}
