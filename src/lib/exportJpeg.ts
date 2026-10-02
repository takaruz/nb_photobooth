import { DPI } from './layouts'

/**
 * Canvas JPEGs carry no physical size, so some print dialogs assume 72 DPI.
 * Patch the JFIF header to say 300 DPI so 1200x1800 px is read as 4x6 in.
 */
function setJfifDpi(bytes: Uint8Array, dpi: number) {
  const isJfif =
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff && bytes[3] === 0xe0 &&
    String.fromCharCode(...bytes.slice(6, 10)) === 'JFIF'
  if (!isJfif) return
  bytes[13] = 1 // units: dots per inch
  bytes[14] = dpi >> 8
  bytes[15] = dpi & 0xff
  bytes[16] = dpi >> 8
  bytes[17] = dpi & 0xff
}

export async function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.92),
  )
  if (!blob) throw new Error('Could not create image')
  const bytes = new Uint8Array(await blob.arrayBuffer())
  setJfifDpi(bytes, DPI)
  return new Blob([bytes], { type: 'image/jpeg' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** True when the browser can share image files (iOS/Android share sheet → "Save Image"). */
export function canShareFiles() {
  try {
    const probe = new File([new Blob()], 'probe.jpg', { type: 'image/jpeg' })
    return !!navigator.canShare?.({ files: [probe] })
  } catch {
    return false
  }
}

/**
 * Open the share sheet. Call it straight from a tap handler with a ready blob:
 * iOS Safari rejects share() if the tap was too long ago.
 */
export function shareBlob(blob: Blob, filename: string) {
  return navigator.share({ files: [new File([blob], filename, { type: 'image/jpeg' })] })
}
