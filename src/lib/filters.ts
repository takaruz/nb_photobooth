// Filters are done per pixel rather than with ctx.filter, which older iOS Safari ignores.

export type FilterId = 'none' | 'bw' | 'sepia' | 'warm' | 'cool' | 'fade'

export const FILTERS: { id: FilterId; name: string }[] = [
  { id: 'none', name: 'Original' },
  { id: 'bw', name: 'B&W' },
  { id: 'sepia', name: 'Sepia' },
  { id: 'warm', name: 'Warm' },
  { id: 'cool', name: 'Cool' },
  { id: 'fade', name: 'Fade' },
]

type PixelFn = (d: Uint8ClampedArray, i: number) => void

const lum = (d: Uint8ClampedArray, i: number) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]

// Uint8ClampedArray clamps to 0–255 on write, so no manual clamping is needed.
const TRANSFORMS: Record<Exclude<FilterId, 'none'>, PixelFn> = {
  bw: (d, i) => {
    const y = (lum(d, i) - 128) * 1.1 + 128
    d[i] = d[i + 1] = d[i + 2] = y
  },
  sepia: (d, i) => {
    const r = d[i], g = d[i + 1], b = d[i + 2]
    d[i] = 0.393 * r + 0.769 * g + 0.189 * b
    d[i + 1] = 0.349 * r + 0.686 * g + 0.168 * b
    d[i + 2] = 0.272 * r + 0.534 * g + 0.131 * b
  },
  warm: (d, i) => {
    d[i] = d[i] * 1.06 + 10
    d[i + 1] = d[i + 1] * 1.02
    d[i + 2] = d[i + 2] * 0.88
  },
  cool: (d, i) => {
    d[i] = d[i] * 0.9
    d[i + 1] = d[i + 1] + 2
    d[i + 2] = d[i + 2] * 1.08 + 12
  },
  fade: (d, i) => {
    const y = lum(d, i)
    for (let c = 0; c < 3; c++) d[i + c] = (d[i + c] * 0.8 + y * 0.2) * 0.82 + 35
  },
}

/** Apply a filter to a canvas in place. */
export function applyFilter(canvas: HTMLCanvasElement, id: FilterId) {
  if (id === 'none') return
  const fn = TRANSFORMS[id]
  const ctx = canvas.getContext('2d')!
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = data.data
  for (let i = 0; i < d.length; i += 4) fn(d, i)
  ctx.putImageData(data, 0, 0)
}

// One filtered copy per photo: keeping every filter around would blow past iOS canvas memory.
const cache = new WeakMap<HTMLCanvasElement, { id: FilterId; canvas: HTMLCanvasElement }>()

/** `img` with filter `id` applied (cached). */
export function filtered(img: HTMLCanvasElement, id: FilterId): HTMLCanvasElement {
  if (id === 'none') return img
  const hit = cache.get(img)
  if (hit?.id === id) return hit.canvas
  if (hit) hit.canvas.width = 0 // release the old copy's memory right away

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  canvas.getContext('2d')!.drawImage(img, 0, 0)
  applyFilter(canvas, id)
  cache.set(img, { id, canvas })
  return canvas
}
