import { useState, type PointerEvent, type RefObject } from 'react'
import {
  defaultSize,
  drawSticker,
  STICKER_MAX,
  STICKER_MIN,
  stickerHalfSize,
  type Sticker,
} from '../lib/stickers'

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
/** Extra touch margin (canvas px at scale 1) so thin stickers like the glasses are easy to grab. */
const HIT_PAD = 24
let nextId = 1

/**
 * Placing, moving, pinching and drawing stickers on a canvas. Positions are fractions of the
 * canvas; sizes are stored in print units and multiplied by `scale` to get canvas pixels.
 */
export function useStickerLayer(
  stickers: Sticker[],
  setStickers: (update: (prev: Sticker[]) => Sticker[]) => void,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  scale: number,
  pointers: RefObject<Map<number, { x: number; y: number }>>,
) {
  const [selected, setSelected] = useState<number | null>(null)
  const current = stickers.find((s) => s.id === selected) ?? null
  const updateSelected = (fn: (s: Sticker) => Sticker) =>
    setStickers((prev) => prev.map((s) => (s.id === selected ? fn(s) : s)))

  function add(key: string) {
    // Stagger new stickers so repeated taps don't stack exactly.
    const step = (stickers.length % 5) - 2
    const s: Sticker = {
      id: nextId++,
      key,
      x: 0.5 + step * 0.08,
      y: 0.5 + step * 0.04,
      size: defaultSize(key),
      rotation: 0,
    }
    setStickers((prev) => [...prev, s])
    setSelected(s.id)
  }

  const scaled = (s: Sticker): Sticker => (scale === 1 ? s : { ...s, size: s.size * scale })

  /** Draw all stickers (and the selection outline) onto `ctx`, a canvas of size w x h. */
  function draw(ctx: CanvasRenderingContext2D, w: number, h: number, outline = true) {
    for (const s of stickers) drawSticker(ctx, scaled(s), s.x * w, s.y * h)
    if (!current || !outline) return
    const [hw, hh] = stickerHalfSize(scaled(current))
    ctx.save()
    ctx.translate(current.x * w, current.y * h)
    ctx.rotate(current.rotation)
    ctx.lineWidth = 6 * scale
    ctx.setLineDash([18 * scale, 12 * scale])
    ctx.strokeStyle = '#3d8bd4'
    ctx.strokeRect(-hw - 10 * scale, -hh - 10 * scale, hw * 2 + 20 * scale, hh * 2 + 20 * scale)
    ctx.restore()
  }

  /** Topmost sticker under a point given in screen pixels. */
  function hitTest(clientX: number, clientY: number) {
    const canvas = canvasRef.current!
    const box = canvas.getBoundingClientRect()
    const px = ((clientX - box.left) / box.width) * canvas.width
    const py = ((clientY - box.top) / box.height) * canvas.height
    for (let i = stickers.length - 1; i >= 0; i--) {
      const s = stickers[i]
      // Rotate the point into the sticker's own frame, then test against its box.
      const dx = px - s.x * canvas.width
      const dy = py - s.y * canvas.height
      const cos = Math.cos(-s.rotation)
      const sin = Math.sin(-s.rotation)
      const [hw, hh] = stickerHalfSize(scaled(s))
      const pad = HIT_PAD * scale
      if (Math.abs(dx * cos - dy * sin) < hw + pad && Math.abs(dx * sin + dy * cos) < hh + pad) return s
    }
    return null
  }

  function onPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Pointer already gone; tracking below still works.
    }
    pointers.current!.set(e.pointerId, { x: e.clientX, y: e.clientY })
    // First finger picks the sticker; a second finger pinches whatever is selected.
    if (pointers.current!.size === 1) {
      const hit = hitTest(e.clientX, e.clientY)
      setSelected(hit?.id ?? null)
      if (hit) {
        // Bring the touched sticker to the front.
        setStickers((prev) => [...prev.filter((s) => s.id !== hit.id), hit])
      }
    }
  }

  function onPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    const pts = pointers.current!
    const prev = pts.get(e.pointerId)
    if (!prev) return
    const box = e.currentTarget.getBoundingClientRect()

    if (pts.size === 1) {
      const dx = (e.clientX - prev.x) / box.width
      const dy = (e.clientY - prev.y) / box.height
      updateSelected((s) => ({ ...s, x: clamp(s.x + dx, 0, 1), y: clamp(s.y + dy, 0, 1) }))
    } else if (pts.size === 2) {
      // Pinch to resize, twist to rotate.
      const other = [...pts].find(([id]) => id !== e.pointerId)![1]
      const before = Math.hypot(prev.x - other.x, prev.y - other.y)
      const after = Math.hypot(e.clientX - other.x, e.clientY - other.y)
      const turn =
        Math.atan2(e.clientY - other.y, e.clientX - other.x) - Math.atan2(prev.y - other.y, prev.x - other.x)
      if (before > 0) {
        updateSelected((s) => ({
          ...s,
          size: clamp((s.size * after) / before, STICKER_MIN, STICKER_MAX),
          rotation: s.rotation + turn,
        }))
      }
    }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
  }

  function onPointerUp(e: PointerEvent<HTMLCanvasElement>) {
    pointers.current!.delete(e.pointerId)
  }

  return {
    stickers,
    setStickers,
    selected,
    setSelected,
    current,
    updateSelected,
    add,
    draw,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }
}

export type StickerLayer = ReturnType<typeof useStickerLayer>
