import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from 'react'
import { InstallPrompt } from './components/InstallPrompt'
import { LayoutPicker } from './components/LayoutPicker'
import { PhotoEditor } from './components/PhotoEditor'
import { SlotPicker } from './components/SlotPicker'
import { StickerEditor } from './components/StickerEditor'
import { DEFAULT_CAPTION, StyleControls } from './components/StyleControls'
import { DEFAULT_CROP, type Crop } from './lib/crop'
import { canShareFiles, canvasToJpeg, downloadBlob, shareBlob } from './lib/exportJpeg'
import { FILTERS } from './lib/filters'
import { DEFAULT_LAYOUT, getLayout, LAYOUTS, PHOTO_COUNT, photoAt, PRINT_WIDTH } from './lib/layouts'
import { loadPhoto } from './lib/loadImage'
import { PATTERNS } from './lib/patterns'
import { renderSheet } from './lib/render'
import type { Sticker } from './lib/stickers'
import type { Photo, SheetStyle } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

const fileName = () => {
  const d = new Date()
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
  return `photobooth-${stamp}.jpg`
}

const STYLE_KEY = 'nb-photobooth-style'
const DEFAULT_STYLE: SheetStyle = {
  layout: DEFAULT_LAYOUT,
  filter: 'none',
  frameColor: '#ffffff',
  pattern: 'plain',
  title: DEFAULT_CAPTION,
  showDate: true,
}

// Remembered per device as a convenience; falls back to defaults if storage is unavailable.
function loadStyle(): SheetStyle {
  try {
    const saved = { ...DEFAULT_STYLE, ...JSON.parse(localStorage.getItem(STYLE_KEY) ?? '{}') }
    // Drop ids saved by an older version that no longer exist.
    if (!LAYOUTS.some((l) => l.id === saved.layout)) saved.layout = DEFAULT_STYLE.layout
    if (!FILTERS.some((f) => f.id === saved.filter)) saved.filter = DEFAULT_STYLE.filter
    if (!PATTERNS.some((p) => p.id === saved.pattern)) saved.pattern = DEFAULT_STYLE.pattern
    // 'Photobooth' was the old default caption, not something anyone typed.
    if (saved.title === 'Photobooth') saved.title = DEFAULT_STYLE.title
    return saved
  } catch {
    return DEFAULT_STYLE
  }
}

const canShare = canShareFiles()
let nextId = 1

export default function App() {
  const [photos, setPhotos] = useState<(Photo | null)[]>(() => Array(PHOTO_COUNT).fill(null))
  const [loading, setLoading] = useState<boolean[]>(() => Array(PHOTO_COUNT).fill(false))
  const [style, setStyle] = useState<SheetStyle>(loadStyle)
  const [editing, setEditing] = useState<number | null>(null)
  const [stickers, setStickers] = useState<Sticker[]>([])
  /** Sheet rendered without stickers, shown as the backdrop while placing stickers. */
  const [stickerBase, setStickerBase] = useState<HTMLCanvasElement | null>(null)
  const [error, setError] = useState('')
  // The prepared JPG plus the inputs it was rendered from; stale once either changes.
  const [prepared, setPrepared] = useState<{
    blob: Blob
    photos: unknown
    style: unknown
    stickers: unknown
  } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const printImgRef = useRef<HTMLImageElement>(null)
  const multiInputRef = useRef<HTMLInputElement>(null)
  const singleInputRef = useRef<HTMLInputElement>(null)
  const targetSlot = useRef(0)

  const layout = getLayout(style.layout)
  const filled = photos.filter(Boolean).length
  const ready = filled === PHOTO_COUNT
  const missing = PHOTO_COUNT - filled
  const exportBlob =
    ready && prepared?.photos === photos && prepared.style === style && prepared.stickers === stickers
      ? prepared.blob
      : null

  useEffect(() => {
    if (!canvasRef.current) return
    renderSheet(canvasRef.current, photos, style, { date: today(), placeholders: true, stickers })
  }, [photos, style, stickers])

  // Keep a print-ready JPG prepared in the background, so Share can open the
  // share sheet immediately on tap (iOS rejects share() after slow async work).
  useEffect(() => {
    if (!ready) return
    let cancelled = false
    const timer = setTimeout(async () => {
      const canvas = document.createElement('canvas')
      renderSheet(canvas, photos, style, { date: today(), placeholders: false, stickers })
      try {
        const blob = await canvasToJpeg(canvas)
        if (!cancelled) setPrepared({ blob, photos, style, stickers })
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        canvas.width = 0
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [photos, style, stickers, ready])

  useEffect(() => {
    try {
      localStorage.setItem(STYLE_KEY, JSON.stringify(style))
    } catch {
      // Private mode or blocked storage: settings just won't be remembered.
    }
  }, [style])

  const setSlot = (index: number, photo: Photo | null) =>
    setPhotos((prev) => prev.map((p, i) => (i === index ? photo : p)))

  async function fillSlots(files: File[], slots: number[]) {
    setError('')
    setLoading((prev) => prev.map((v, i) => v || slots.includes(i)))
    await Promise.all(
      slots.map(async (slot, k) => {
        try {
          const image = await loadPhoto(files[k])
          setSlot(slot, { id: nextId++, image, crop: DEFAULT_CROP })
        } catch (e) {
          setError((e as Error).message)
        } finally {
          setLoading((prev) => prev.map((v, i) => (i === slot ? false : v)))
        }
      }),
    )
  }

  function onMultiChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    // Fill empty slots first; if everything is full, start over from slot 1.
    let slots = photos.map((p, i) => (p ? -1 : i)).filter((i) => i >= 0)
    if (!slots.length) slots = [...Array(PHOTO_COUNT).keys()]
    slots = slots.slice(0, files.length)
    fillSlots(files.slice(0, slots.length), slots)
  }

  function onSingleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) fillSlots([file], [targetSlot.current])
  }

  function pickSlot(index: number) {
    targetSlot.current = index
    singleInputRef.current?.click()
  }

  function selectSlot(index: number) {
    if (photos[index]) setEditing(index)
    else pickSlot(index)
  }

  function onPreviewClick(e: MouseEvent<HTMLCanvasElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const k = PRINT_WIDTH / box.width
    const index = photoAt(layout, (e.clientX - box.left) * k, (e.clientY - box.top) * k)
    if (index >= 0) selectSlot(index)
  }

  const setCrop = (index: number, crop: Crop) =>
    setPhotos((prev) => prev.map((p, i) => (i === index && p ? { ...p, crop } : p)))

  function movePhoto(index: number, dir: -1 | 1, crop: Crop) {
    const to = index + dir
    setPhotos((prev) => {
      const next = prev.map((p, i) => (i === index && p ? { ...p, crop } : p))
      ;[next[index], next[to]] = [next[to], next[index]]
      return next
    })
    setEditing(to)
  }

  function openStickers() {
    const base = document.createElement('canvas')
    renderSheet(base, photos, style, { date: today(), placeholders: true })
    setStickerBase(base)
  }

  function download() {
    if (exportBlob) downloadBlob(exportBlob, fileName())
  }

  async function share() {
    if (!exportBlob) return
    try {
      await shareBlob(exportBlob, fileName())
    } catch (e) {
      // AbortError = user closed the share sheet; anything else, fall back to a download.
      if ((e as Error).name !== 'AbortError') download()
    }
  }

  async function print() {
    const img = printImgRef.current
    if (!exportBlob || !img) return
    const url = URL.createObjectURL(exportBlob)
    img.src = url
    await img.decode()
    window.print()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  const preparing = ready && !exportBlob
  const primaryLabel = !ready
    ? `Add ${missing} more photo${missing > 1 ? 's' : ''}`
    : preparing
      ? 'Preparing…'
      : canShare
        ? 'Save / Share 4×6 photo'
        : 'Download 4×6 JPG'

  const editingPhoto = editing !== null ? photos[editing] : null

  return (
    <main className="app">
      <header>
        <h1>NB Photobooth</h1>
        <p className="sub">4 photos · 4×6 print</p>
      </header>

      <InstallPrompt />

      <LayoutPicker value={style.layout} onChange={(id) => setStyle((s) => ({ ...s, layout: id }))} />

      <section className="card">
        <h2 className="card-title">Photos</h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => multiInputRef.current?.click()}
        >
          {filled === 0 ? 'Choose 4 photos' : ready ? 'Choose new photos' : `Add ${missing} more`}
        </button>
        <SlotPicker
          photos={photos}
          loading={loading}
          aspect={layout.aspect}
          filter={style.filter}
          onSelect={selectSlot}
        />
        <p className="hint">Tap a photo to adjust, reorder or replace it.</p>
        {error && <p className="error">{error}</p>}
      </section>

      <StyleControls
        style={style}
        sample={photos.find(Boolean)?.image ?? null}
        onChange={(patch) => setStyle((s) => ({ ...s, ...patch }))}
      />

      <section className="card">
        <h2 className="card-title">Stickers</h2>
        <button type="button" className="btn btn-soft" onClick={openStickers}>
          {stickers.length ? `Edit stickers (${stickers.length})` : 'Add stickers'}
        </button>
      </section>

      <section className="preview">
        <canvas ref={canvasRef} aria-label="4x6 print preview" onClick={onPreviewClick} />
        <p className="hint">{layout.hint}</p>
        <div className="secondary-actions">
          {canShare && (
            <button type="button" className="btn btn-soft" disabled={!exportBlob} onClick={download}>
              Download JPG
            </button>
          )}
          <button type="button" className="btn btn-soft" disabled={!exportBlob} onClick={print}>
            Print
          </button>
        </div>
      </section>

      <div className="actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!exportBlob}
          onClick={canShare ? share : download}
        >
          {primaryLabel}
        </button>
      </div>

      {editing !== null && editingPhoto && (
        <PhotoEditor
          key={editingPhoto.id}
          photo={editingPhoto}
          index={editing}
          count={PHOTO_COUNT}
          aspect={layout.aspect}
          filter={style.filter}
          onDone={(crop) => {
            setCrop(editing, crop)
            setEditing(null)
          }}
          onMove={(dir, crop) => movePhoto(editing, dir, crop)}
          onReplace={() => pickSlot(editing)}
          onRemove={() => {
            setSlot(editing, null)
            setEditing(null)
          }}
        />
      )}

      {stickerBase && (
        <StickerEditor
          layout={layout}
          base={stickerBase}
          stickers={stickers}
          onDone={(next) => {
            setStickers(next)
            setStickerBase(null)
          }}
        />
      )}

      {/* Only shown when printing: the exact 4x6 JPG, sized to the page. */}
      <img ref={printImgRef} className="print-sheet" alt="" />

      <input ref={multiInputRef} type="file" accept="image/*" multiple hidden onChange={onMultiChange} />
      <input ref={singleInputRef} type="file" accept="image/*" hidden onChange={onSingleChange} />
    </main>
  )
}
