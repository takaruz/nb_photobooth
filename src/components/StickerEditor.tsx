import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { Layout } from '../lib/layouts'
import {
  defaultSize,
  drawSticker,
  STICKER_MAX,
  STICKER_MIN,
  STICKERS,
  stickerHalfSize,
  type Sticker,
} from '../lib/stickers'

interface Props {
  layout: Layout
  /** The sheet rendered without stickers (1200x1800). */
  base: HTMLCanvasElement
  stickers: Sticker[]
  onDone: (stickers: Sticker[]) => void
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
/** Extra touch margin (print px) so thin stickers like the glasses are easy to grab. */
const HIT_PAD = 24
let nextId = 1

export function StickerEditor({ layout, base, stickers: initial, onDone }: Props) {
  const area = layout.stickerArea
  const [stickers, setStickers] = useState(initial)
  const [selected, setSelected] = useState<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())

  const current = stickers.find((s) => s.id === selected) ?? null
  const updateSelected = (fn: (s: Sticker) => Sticker) =>
    setStickers((prev) => prev.map((s) => (s.id === selected ? fn(s) : s)))

  // The canvas shows the sticker area at print resolution.
  useEffect(() => {
    const canvas = canvasRef.current!
    canvas.width = area.w
    canvas.height = area.h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(base, area.x, area.y, area.w, area.h, 0, 0, area.w, area.h)
    for (const s of stickers) drawSticker(ctx, s, s.x * area.w, s.y * area.h)

    if (current) {
      const [hw, hh] = stickerHalfSize(current)
      ctx.save()
      ctx.translate(current.x * area.w, current.y * area.h)
      ctx.rotate(current.rotation)
      ctx.lineWidth = 6
      ctx.setLineDash([18, 12])
      ctx.strokeStyle = '#3d8bd4'
      ctx.strokeRect(-hw - 10, -hh - 10, hw * 2 + 20, hh * 2 + 20)
      ctx.restore()
    }
  }, [base, area, stickers, current])

  // Lock page scroll behind the sheet; Escape closes it.
  const closeRef = useRef(() => onDone(stickers))
  useEffect(() => {
    closeRef.current = () => onDone(stickers)
  })
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [])

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

  /** Topmost sticker under a point given in screen pixels. */
  function hitTest(clientX: number, clientY: number) {
    const box = canvasRef.current!.getBoundingClientRect()
    const px = ((clientX - box.left) / box.width) * area.w
    const py = ((clientY - box.top) / box.height) * area.h
    for (let i = stickers.length - 1; i >= 0; i--) {
      const s = stickers[i]
      // Rotate the point into the sticker's own frame, then test against its box.
      const dx = px - s.x * area.w
      const dy = py - s.y * area.h
      const cos = Math.cos(-s.rotation)
      const sin = Math.sin(-s.rotation)
      const [hw, hh] = stickerHalfSize(s)
      if (
        Math.abs(dx * cos - dy * sin) < hw + HIT_PAD &&
        Math.abs(dx * sin + dy * cos) < hh + HIT_PAD
      ) {
        return s
      }
    }
    return null
  }

  function onPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Pointer already gone; tracking below still works.
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    // First finger picks the sticker; a second finger pinches whatever is selected.
    if (pointers.current.size === 1) {
      const hit = hitTest(e.clientX, e.clientY)
      setSelected(hit?.id ?? null)
      if (hit) {
        // Bring the touched sticker to the front.
        setStickers((prev) => [...prev.filter((s) => s.id !== hit.id), hit])
      }
    }
  }

  function onPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    const pts = pointers.current
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
    pointers.current.delete(e.pointerId)
  }

  const aspect = area.w / area.h
  const degrees = current ? Math.round((((current.rotation * 180) / Math.PI + 540) % 360) - 180) : 0

  return (
    <div className="modal-backdrop" onClick={() => onDone(stickers)}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Stickers"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>Stickers</h2>
          <button type="button" className="btn btn-primary btn-small" onClick={() => onDone(stickers)}>
            Done
          </button>
        </div>

        <canvas
          ref={canvasRef}
          className="editor-canvas"
          style={{ width: `min(100%, calc(52vh * ${aspect}))` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        <p className="hint">
          {layout.stickerRepeat.length > 1 ? 'Stickers are copied onto both strips. ' : ''}
          Drag to move · pinch to resize and rotate
        </p>

        {current ? (
          <div className="sticker-controls">
            <label className="zoom">
              <span>Size</span>
              <input
                type="range"
                min={STICKER_MIN}
                max={STICKER_MAX}
                value={current.size}
                onChange={(e) => updateSelected((s) => ({ ...s, size: Number(e.target.value) }))}
              />
            </label>
            <label className="zoom">
              <span>Rotate</span>
              <input
                type="range"
                min={-180}
                max={180}
                value={degrees}
                onChange={(e) => updateSelected((s) => ({ ...s, rotation: (Number(e.target.value) * Math.PI) / 180 }))}
              />
            </label>
            <div className="editor-row">
              <button type="button" className="btn btn-soft" onClick={() => setSelected(null)}>
                Add more
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setStickers((prev) => prev.filter((s) => s.id !== selected))
                  setSelected(null)
                }}
              >
                Delete sticker
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="emoji-grid" role="group" aria-label="Add a sticker">
              {STICKERS.map((def) => (
                <button
                  key={def.key}
                  type="button"
                  className="emoji-btn"
                  aria-label={def.label}
                  onClick={() => add(def.key)}
                >
                  {def.image ? <img src={def.image.src} alt="" /> : def.emoji}
                </button>
              ))}
            </div>
            {stickers.length > 0 && (
              <div className="editor-row">
                <button type="button" className="btn btn-danger" onClick={() => setStickers([])}>
                  Clear all stickers
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
