import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { applyAdjust, isNeutral, LIGHT_SLIDERS, NO_ADJUST, type Adjustments } from '../lib/adjust'
import { clampCrop, cropSource, DEFAULT_CROP, MAX_ZOOM, type Crop } from '../lib/crop'
import { applyFilter, type FilterId } from '../lib/filters'
import { drawPhoto } from '../lib/render'
import type { Photo, PhotoEdits } from '../types'

interface Props {
  photo: Photo
  index: number
  count: number
  aspect: number
  filter: FilterId
  onDone: (edits: PhotoEdits) => void
  onMove: (dir: -1 | 1, edits: PhotoEdits) => void
  onReplace: () => void
  onRemove: () => void
  onRotate: (adjust: Adjustments) => void
}

// About 2x the print cell size, so it stays sharp on retina screens.
const EDIT_W = 1040

const formatValue = (key: keyof Adjustments, v: number) =>
  key === 'exposure' ? `${v > 0 ? '+' : ''}${v.toFixed(2)}` : `${v > 0 ? '+' : ''}${v}`

export function PhotoEditor({
  photo,
  index,
  count,
  aspect,
  filter,
  onDone,
  onMove,
  onReplace,
  onRemove,
  onRotate,
}: Props) {
  const img = photo.image
  const [crop, setCrop] = useState(photo.crop)
  const [adjust, setAdjust] = useState(photo.adjust)
  const [tab, setTab] = useState<'frame' | 'light'>('frame')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())

  const edits = { crop, adjust }
  const update = (fn: (c: Crop) => Crop) => setCrop((prev) => clampCrop(img, aspect, fn(prev)))
  const setLight = (key: keyof Adjustments, value: number) => setAdjust((prev) => ({ ...prev, [key]: value }))

  /** Shift the crop so the image follows a drag of (dx, dy) screen pixels. */
  const pan = (c: Crop, dx: number, dy: number): Crop => {
    const { sw } = cropSource(img, aspect, c)
    const k = sw / canvasRef.current!.clientWidth
    return { ...c, cx: c.cx - (dx * k) / img.width, cy: c.cy - (dy * k) / img.height }
  }

  // Light + filter are applied to just the visible crop, so slider drags stay smooth.
  useEffect(() => {
    const canvas = canvasRef.current!
    const h = Math.round(EDIT_W / aspect)
    canvas.width = EDIT_W
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    drawPhoto(ctx, img, crop, { x: 0, y: 0, w: EDIT_W, h })
    applyAdjust(canvas, adjust)
    applyFilter(canvas, filter)
  }, [img, crop, adjust, aspect, filter])

  // Wheel zoom (desktop) needs a non-passive listener to stop the page scrolling.
  useEffect(() => {
    const canvas = canvasRef.current!
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setCrop((prev) => clampCrop(img, aspect, { ...prev, zoom: prev.zoom * Math.exp(-e.deltaY * 0.002) }))
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [img, aspect])

  // Lock page scroll behind the sheet; Escape closes it.
  const closeRef = useRef(() => onDone(edits))
  useEffect(() => {
    closeRef.current = () => onDone({ crop, adjust })
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

  function onPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Pointer already gone (e.g. lifted before capture); tracking below still works.
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
  }

  function onPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    const pts = pointers.current
    const prev = pts.get(e.pointerId)
    if (!prev) return
    const dx = e.clientX - prev.x
    const dy = e.clientY - prev.y

    if (pts.size === 1) {
      update((c) => pan(c, dx, dy))
    } else if (pts.size === 2) {
      // Pinch: scale by the change in finger distance, pan by half this finger's move (the midpoint).
      const other = [...pts].find(([id]) => id !== e.pointerId)![1]
      const before = Math.hypot(prev.x - other.x, prev.y - other.y)
      const after = Math.hypot(e.clientX - other.x, e.clientY - other.y)
      if (before > 0) update((c) => pan({ ...c, zoom: (c.zoom * after) / before }, dx / 2, dy / 2))
    }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
  }

  function onPointerUp(e: PointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(e.pointerId)
  }

  return (
    <div className="modal-backdrop" onClick={() => onDone(edits)}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit photo ${index + 1}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>Photo {index + 1}</h2>
          <div className="modal-head-actions">
            <button
              type="button"
              className="btn btn-soft btn-small"
              onClick={() => onRotate(adjust)}
              aria-label="Rotate 90° clockwise"
            >
              ↻ Rotate
            </button>
            <button type="button" className="btn btn-primary btn-small" onClick={() => onDone(edits)}>
              Done
            </button>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className="editor-canvas"
          // Cap the height so tall (portrait) cells still leave room for the controls.
          style={{ width: `min(100%, calc(42vh * ${aspect}))` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />

        <div className="tabs" role="tablist" aria-label="Edit">
          <button type="button" role="tab" aria-selected={tab === 'frame'} onClick={() => setTab('frame')}>
            Frame
          </button>
          <button type="button" role="tab" aria-selected={tab === 'light'} onClick={() => setTab('light')}>
            Light{!isNeutral(adjust) && <span className="tab-dot" aria-label="(edited)" />}
          </button>
        </div>

        {tab === 'frame' ? (
          <div role="tabpanel">
            <p className="hint">Drag to move · pinch or slide to zoom</p>
            <label className="zoom">
              <span>Zoom</span>
              <input
                type="range"
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                value={crop.zoom}
                onChange={(e) => update((c) => ({ ...c, zoom: Number(e.target.value) }))}
              />
            </label>

            <div className="editor-row">
              <button type="button" className="btn btn-soft" disabled={index === 0} onClick={() => onMove(-1, edits)}>
                ↑ Move up
              </button>
              <button
                type="button"
                className="btn btn-soft"
                disabled={index === count - 1}
                onClick={() => onMove(1, edits)}
              >
                ↓ Move down
              </button>
            </div>
            <div className="editor-row">
              <button type="button" className="btn btn-soft" onClick={() => update(() => DEFAULT_CROP)}>
                Reset
              </button>
              <button type="button" className="btn btn-soft" onClick={onReplace}>
                Replace
              </button>
              <button type="button" className="btn btn-danger" onClick={onRemove}>
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div role="tabpanel" className="light">
            {LIGHT_SLIDERS.map(({ key, label, min, max, step }) => (
              // Double-click / double-tap a slider to put it back to 0, like Lightroom.
              <label key={key} className="light-row" onDoubleClick={() => setLight(key, 0)}>
                <span className="light-label">{label}</span>
                <output className="light-value">{formatValue(key, adjust[key])}</output>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={adjust[key]}
                  onChange={(e) => setLight(key, Number(e.target.value))}
                />
              </label>
            ))}
            <div className="editor-row">
              <button
                type="button"
                className="btn btn-soft"
                disabled={isNeutral(adjust)}
                onClick={() => setAdjust(NO_ADJUST)}
              >
                Reset light
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
