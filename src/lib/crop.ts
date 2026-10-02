/**
 * How a photo sits in its slot. `zoom` is relative to "cover" (1 = just fills the slot);
 * `cx`/`cy` are the center of the visible area as a fraction of the image size.
 */
export interface Crop {
  zoom: number
  cx: number
  cy: number
}

export const DEFAULT_CROP: Crop = { zoom: 1, cx: 0.5, cy: 0.5 }
export const MAX_ZOOM = 4

interface Size {
  width: number
  height: number
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Source rectangle of `img` to draw into a slot with the given aspect ratio (w / h). */
export function cropSource(img: Size, aspect: number, crop: Crop) {
  let sw = img.width
  let sh = sw / aspect
  if (sh > img.height) {
    sh = img.height
    sw = sh * aspect
  }
  sw /= crop.zoom
  sh /= crop.zoom
  const sx = clamp(crop.cx * img.width - sw / 2, 0, img.width - sw)
  const sy = clamp(crop.cy * img.height - sh / 2, 0, img.height - sh)
  return { sx, sy, sw, sh }
}

/** Keep zoom in range and the visible area inside the image. */
export function clampCrop(img: Size, aspect: number, crop: Crop): Crop {
  const zoom = clamp(crop.zoom, 1, MAX_ZOOM)
  const { sx, sy, sw, sh } = cropSource(img, aspect, { ...crop, zoom })
  return { zoom, cx: (sx + sw / 2) / img.width, cy: (sy + sh / 2) / img.height }
}
