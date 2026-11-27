import glassesGray from '../assets/stickers/pixel-glasses-gray.png'
import glassesWhite from '../assets/stickers/pixel-glasses-white.png'
import glassesDot from '../assets/stickers/pixel-glasses-dot.png'
import glassesChecker from '../assets/stickers/pixel-glasses-checker.png'
import type { Layout, Rect } from './layouts'

/** A sticker is either an emoji (any emoji can be used) or a (pixel-art) image. */
export interface StickerDef {
  key: string
  label: string
  emoji?: string
  image?: HTMLImageElement
}

function pixelImage(src: string) {
  const img = new Image()
  img.src = src
  return img
}

export const STICKERS: StickerDef[] = [
  { key: 'pixel-glasses-gray', label: 'Pixel sunglasses', image: pixelImage(glassesGray) },
  { key: 'pixel-glasses-white', label: 'Pixel sunglasses with white glints', image: pixelImage(glassesWhite) },
  { key: 'pixel-glasses-dot', label: 'Pixel sunglasses with gray glints', image: pixelImage(glassesDot) },
  { key: 'pixel-glasses-checker', label: 'Pixel sunglasses with checkered glints', image: pixelImage(glassesChecker) },
]

const byKey = new Map(STICKERS.map((d) => [d.key, d]))

/** Image stickers are listed; any other key is an emoji and is drawn as text. */
const defFor = (key: string): StickerDef => byKey.get(key) ?? { key, label: key, emoji: key }

export interface Sticker {
  id: number
  /** Which StickerDef this is. */
  key: string
  /** Center, as a fraction of the layout's sticker area (so it survives layout changes). */
  x: number
  y: number
  /** Print pixels: font size for emoji, width for images. */
  size: number
  /** Radians. */
  rotation: number
}

export const STICKER_MIN = 50
export const STICKER_MAX = 600

/** Default size for a new sticker: images (glasses) start wider than emoji. */
export const defaultSize = (key: string) => (defFor(key).image ? 280 : 160)

const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'

/** Half width / half height of the sticker's box, before rotation. */
export function stickerHalfSize(s: Sticker): [number, number] {
  const img = defFor(s.key).image
  if (img?.naturalWidth) return [s.size / 2, (s.size * img.naturalHeight) / img.naturalWidth / 2]
  return [s.size * 0.62, s.size * 0.62]
}

export function drawSticker(ctx: CanvasRenderingContext2D, s: Sticker, cx: number, cy: number) {
  const def = defFor(s.key)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(s.rotation)
  if (def.image) {
    if (def.image.complete && def.image.naturalWidth) {
      const [hw, hh] = stickerHalfSize(s)
      // Pixel art: scale up with hard edges instead of blurring.
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(def.image, -hw, -hh, hw * 2, hh * 2)
    }
  } else {
    ctx.font = `${s.size}px ${EMOJI_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(def.emoji!, 0, 0)
  }
  ctx.restore()
}

/** Draw all stickers onto the full sheet, repeated as the layout says. */
export function drawStickers(ctx: CanvasRenderingContext2D, stickers: Sticker[], layout: Layout) {
  const a = layout.stickerArea
  for (const offset of layout.stickerRepeat) {
    for (const s of stickers) {
      const scaled = layout.stickerScale === 1 ? s : { ...s, size: s.size * layout.stickerScale }
      drawSticker(ctx, scaled, a.x + offset + s.x * a.w, a.y + s.y * a.h)
    }
  }
}

/** A photo's own stickers: positioned relative to its cell and clipped to it. */
export function drawCellStickers(ctx: CanvasRenderingContext2D, stickers: Sticker[], cell: Rect, scale: number) {
  if (!stickers.length) return
  ctx.save()
  ctx.beginPath()
  ctx.rect(cell.x, cell.y, cell.w, cell.h)
  ctx.clip()
  for (const s of stickers) {
    drawSticker(ctx, scale === 1 ? s : { ...s, size: s.size * scale }, cell.x + s.x * cell.w, cell.y + s.y * cell.h)
  }
  ctx.restore()
}
