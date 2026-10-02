import type { Photo, SheetStyle } from '../types'
import { cropSource, type Crop } from './crop'
import { filtered } from './filters'
import { getLayout, PRINT_HEIGHT, PRINT_WIDTH, type CaptionBox, type Rect } from './layouts'
import { drawPattern } from './patterns'
import { drawStickers, type Sticker } from './stickers'

export interface RenderOptions {
  date: string
  /** Draw numbered placeholders for empty slots (preview only). */
  placeholders: boolean
  /** Drawn on top of everything; omit to render the sheet without them. */
  stickers?: Sticker[]
}

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

/** True if `hex` (#rrggbb) is dark enough to need light text on it. */
export function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55
}

/** Draw `img` into `rect` using its crop (cover-fit, then zoom/pan). */
export function drawPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLCanvasElement,
  crop: Crop,
  rect: Rect,
) {
  const { sx, sy, sw, sh } = cropSource(img, rect.w / rect.h, crop)
  ctx.drawImage(img, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h)
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, rect: Rect, n: number, dark: boolean) {
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.07)'
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)'
  ctx.font = `600 120px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(n), rect.x + rect.w / 2, rect.y + rect.h / 2)
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  box: CaptionBox,
  style: SheetStyle,
  date: string,
  dark: boolean,
) {
  const s = box.scale
  const lines: { text: string; weight: number; size: number }[] = []
  const title = style.title.trim()
  if (title) lines.push({ text: title, weight: 700, size: 40 * s })
  if (style.showDate) lines.push({ text: date, weight: 400, size: 28 * s })
  if (!lines.length) return

  ctx.save()
  ctx.translate(box.x + box.w / 2, box.y + box.h / 2)
  if (box.rotate) ctx.rotate(-Math.PI / 2)
  const maxWidth = box.rotate ? box.h : box.w
  const ys = lines.length === 2 ? [-25 * s, 25 * s] : [0]

  ctx.fillStyle = dark ? '#ffffff' : '#222222'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  lines.forEach((line, i) => {
    // Long captions shrink to fit (down to 60%) rather than being squeezed narrow;
    // only past that does fillText's maxWidth condense them.
    ctx.font = `${line.weight} ${line.size}px ${FONT}`
    const fit = Math.max(0.6, Math.min(1, maxWidth / ctx.measureText(line.text).width))
    if (fit < 1) ctx.font = `${line.weight} ${line.size * fit}px ${FONT}`
    ctx.fillText(line.text, 0, ys[i], maxWidth)
  })
  ctx.restore()
}

/** Render the full 4x6 sheet (1200x1800) onto `canvas`. */
export function renderSheet(
  canvas: HTMLCanvasElement,
  photos: (Photo | null)[],
  style: SheetStyle,
  opts: RenderOptions,
) {
  const layout = getLayout(style.layout)
  const dark = isDark(style.frameColor)

  canvas.width = PRINT_WIDTH
  canvas.height = PRINT_HEIGHT
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'

  ctx.fillStyle = style.frameColor
  ctx.fillRect(0, 0, PRINT_WIDTH, PRINT_HEIGHT)
  drawPattern(ctx, style.pattern, PRINT_WIDTH, PRINT_HEIGHT, dark, layout.panels)

  for (const cell of layout.cells) {
    const photo = photos[cell.photo]
    if (photo) drawPhoto(ctx, filtered(photo.image, style.filter), photo.crop, cell.rect)
    else if (opts.placeholders) drawPlaceholder(ctx, cell.rect, cell.photo + 1, dark)
  }

  for (const box of layout.captions) drawCaption(ctx, box, style, opts.date, dark)

  if (opts.stickers) drawStickers(ctx, opts.stickers, layout)

  // Drawn last so stickers never hide where to cut.
  if (layout.cutLine) drawCutGuide(ctx, dark)
}

/** Dashed cut guide down the middle, with solid ends to line up the scissors. */
function drawCutGuide(ctx: CanvasRenderingContext2D, dark: boolean) {
  const mid = PRINT_WIDTH / 2
  const END = 40
  ctx.save()
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.3)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(mid, 0)
  ctx.lineTo(mid, END)
  ctx.moveTo(mid, PRINT_HEIGHT - END)
  ctx.lineTo(mid, PRINT_HEIGHT)
  ctx.stroke()

  // 3 px at 300 DPI ≈ 0.25 mm: visible on paper without being heavy.
  ctx.lineWidth = 3
  ctx.setLineDash([18, 14])
  ctx.beginPath()
  ctx.moveTo(mid, END)
  ctx.lineTo(mid, PRINT_HEIGHT - END)
  ctx.stroke()
  ctx.restore()
}
