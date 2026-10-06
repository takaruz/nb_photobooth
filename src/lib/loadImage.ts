// Phone photos can be 12–48 MP; keeping four of those decoded crashes mobile Safari.
// Downscale once on load — 1600 px is plenty for a 520x370 px print slot.
const MAX_SIDE = 1600

export async function loadPhoto(file: File): Promise<HTMLCanvasElement> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error(`Can't read "${file.name}". Try a JPG or PNG photo.`)
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas
}

/** A copy of `img` turned 90° clockwise. */
export function rotateClockwise(img: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = img.height
  out.height = img.width
  const ctx = out.getContext('2d')!
  ctx.translate(out.width / 2, out.height / 2)
  ctx.rotate(Math.PI / 2)
  ctx.drawImage(img, -img.width / 2, -img.height / 2)
  return out
}
