import { useEffect, useMemo, useRef, useState } from 'react'
import { useStickerLayer } from '../hooks/useStickerLayer'
import type { Layout } from '../lib/layouts'
import type { Sticker } from '../lib/stickers'
import { StickerControls } from './StickerControls'

interface Props {
  layout: Layout
  /** The sheet rendered without stickers. */
  base: HTMLCanvasElement
  stickers: Sticker[]
  onDone: (stickers: Sticker[]) => void
}

export function StickerEditor({ layout, base, stickers: initial, onDone }: Props) {
  // Work in 4x6 print units (sticker sizes are stored in them), even when the sheet
  // is another size: the canvas shows the sticker area divided by the layout's sticker scale.
  const src = layout.stickerArea
  const k = layout.stickerScale
  const area = useMemo(() => ({ w: src.w / k, h: src.h / k }), [src, k])
  const [stickers, setStickers] = useState(initial)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const layer = useStickerLayer(stickers, setStickers, canvasRef, 1, pointers)
  const { draw } = layer

  // The canvas shows the sticker area at print resolution.
  useEffect(() => {
    const canvas = canvasRef.current!
    canvas.width = area.w
    canvas.height = area.h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(base, src.x, src.y, src.w, src.h, 0, 0, area.w, area.h)
    draw(ctx, area.w, area.h)
  })

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

  const aspect = area.w / area.h

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
          onPointerDown={layer.onPointerDown}
          onPointerMove={layer.onPointerMove}
          onPointerUp={layer.onPointerUp}
          onPointerCancel={layer.onPointerUp}
        />
        <p className="hint">
          {layout.stickerRepeat.length > 1 ? 'Stickers are copied onto both strips. ' : ''}
          Drag to move · pinch to resize and rotate
        </p>

        <StickerControls layer={layer} />
      </div>
    </div>
  )
}
