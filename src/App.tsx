import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from 'react'
import { InstallPrompt } from './components/InstallPrompt'
import { LayoutPicker } from './components/LayoutPicker'
import { PhotoEditor } from './components/PhotoEditor'
import { SlotPicker } from './components/SlotPicker'
import { StickerEditor } from './components/StickerEditor'
import { DEFAULT_CAPTION, StyleControls } from './components/StyleControls'
import { canShareFiles, canvasToJpeg, downloadBlob, shareBlob } from './lib/exportJpeg'
import { FILTERS } from './lib/filters'
import { usePhotoSet } from './hooks/usePhotoSet'
import {
  DEFAULT_LAYOUT,
  DEFAULT_SINGLE_LAYOUT,
  getLayout,
  LAYOUTS,
  ORIGINAL_ID,
  ORIGINAL_PREVIEW_SIDE,
  originalLayoutFor,
  PHOTO_COUNT,
  photoAt,
  SINGLE_LAYOUTS,
  type Layout,
} from './lib/layouts'
import { MAX_SIDE } from './lib/loadImage'
import { PATTERNS } from './lib/patterns'
import { renderSheet } from './lib/render'
import type { SheetStyle } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

const fileName = (prefix: string) => {
  const d = new Date()
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
  return `${prefix}-${stamp}.jpg`
}

type Mode = 'collage' | 'single'
const MODE_KEY = 'nb-photobooth-mode'
const SINGLE_MAX_SIDE = 3000
// Placeholder shape for the original-shape output until a photo is chosen.
const NO_PHOTO_SIZE: [number, number] = [4, 3]

function loadMode(): Mode {
  try {
    return localStorage.getItem(MODE_KEY) === 'single' ? 'single' : 'collage'
  } catch {
    return 'collage'
  }
}

const STYLE_KEY = 'nb-photobooth-style'
const DEFAULT_STYLE: SheetStyle = {
  layout: DEFAULT_LAYOUT,
  singleLayout: DEFAULT_SINGLE_LAYOUT,
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
    if (![...SINGLE_LAYOUTS.map((l) => l.id), ORIGINAL_ID].includes(saved.singleLayout)) {
      saved.singleLayout = DEFAULT_STYLE.singleLayout
    }
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

export default function App() {
  const [mode, setMode] = useState<Mode>(loadMode)
  // Both sets stay mounted, so switching modes never loses work.
  const collage = usePhotoSet(PHOTO_COUNT, MAX_SIDE)
  const single = usePhotoSet(1, SINGLE_MAX_SIDE)
  const set = mode === 'collage' ? collage : single
  const { photos, stickers } = set
  const isSingle = mode === 'single'
  const count = photos.length

  const [style, setStyle] = useState<SheetStyle>(loadStyle)
  const [editing, setEditing] = useState<number | null>(null)
  /** Sheet rendered without stickers, shown as the backdrop while placing stickers. */
  const [stickerBase, setStickerBase] = useState<HTMLCanvasElement | null>(null)
  const [exportError, setExportError] = useState('')
  // The prepared JPG plus the inputs it was rendered from; stale once any changes.
  const [prepared, setPrepared] = useState<{
    blob: Blob
    layout: Layout
    photos: unknown
    style: unknown
    stickers: unknown
  } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const printImgRef = useRef<HTMLImageElement>(null)
  const multiInputRef = useRef<HTMLInputElement>(null)
  const singleInputRef = useRef<HTMLInputElement>(null)
  const targetSlot = useRef(0)

  // Layout shown in the preview, and the one exported. They differ only for the
  // original shape: the preview is small (fast), the export is the photo's full size.
  const firstImage = isSingle ? photos[0]?.image : undefined
  const imgW = firstImage?.width
  const imgH = firstImage?.height
  const { layout, exportLayout } = useMemo(() => {
    if (!isSingle) {
      const l = getLayout(style.layout)
      return { layout: l, exportLayout: l }
    }
    if (style.singleLayout === ORIGINAL_ID) {
      const [w, h] = imgW && imgH ? [imgW, imgH] : NO_PHOTO_SIZE
      return {
        layout: originalLayoutFor(w, h, ORIGINAL_PREVIEW_SIDE),
        exportLayout: imgW && imgH ? originalLayoutFor(w, h) : originalLayoutFor(w, h, ORIGINAL_PREVIEW_SIDE),
      }
    }
    const l = getLayout(style.singleLayout)
    return { layout: l, exportLayout: l }
  }, [isSingle, style.layout, style.singleLayout, imgW, imgH])

  const is4x6 = exportLayout.id !== ORIGINAL_ID
  const filled = set.filled
  const ready = filled === count
  const missing = count - filled
  const exportBlob =
    ready &&
    prepared?.photos === photos &&
    prepared.style === style &&
    prepared.stickers === stickers &&
    prepared.layout === exportLayout
      ? prepared.blob
      : null

  useEffect(() => {
    if (!canvasRef.current) return
    renderSheet(canvasRef.current, layout, photos, style, { date: today(), placeholders: true, stickers })
  }, [layout, photos, style, stickers])

  // Keep a print-ready JPG prepared in the background, so Share can open the
  // share sheet immediately on tap (iOS rejects share() after slow async work).
  useEffect(() => {
    if (!ready) return
    let cancelled = false
    const timer = setTimeout(async () => {
      const canvas = document.createElement('canvas')
      renderSheet(canvas, exportLayout, photos, style, { date: today(), placeholders: false, stickers })
      try {
        const blob = await canvasToJpeg(canvas)
        if (!cancelled) setPrepared({ blob, layout: exportLayout, photos, style, stickers })
      } catch (e) {
        if (!cancelled) setExportError((e as Error).message)
      } finally {
        canvas.width = 0
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [exportLayout, photos, style, stickers, ready])

  useEffect(() => {
    try {
      localStorage.setItem(STYLE_KEY, JSON.stringify(style))
    } catch {
      // Private mode or blocked storage: settings just won't be remembered.
    }
  }, [style])

  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, mode)
    } catch {
      // Same as above.
    }
  }, [mode])

  function onMultiChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    // Fill empty slots first; if everything is full, start over from slot 1.
    let slots = photos.map((p, i) => (p ? -1 : i)).filter((i) => i >= 0)
    if (!slots.length) slots = [...Array(count).keys()]
    slots = slots.slice(0, files.length)
    set.fillSlots(files.slice(0, slots.length), slots)
  }

  function onSingleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) set.fillSlots([file], [targetSlot.current])
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
    const k = e.currentTarget.width / box.width
    const index = photoAt(layout, (e.clientX - box.left) * k, (e.clientY - box.top) * k)
    if (index >= 0) selectSlot(index)
  }

  function openStickers() {
    const base = document.createElement('canvas')
    renderSheet(base, layout, photos, style, { date: today(), placeholders: true })
    setStickerBase(base)
  }

  const name = () => fileName(isSingle ? 'photo' : 'photobooth')

  function download() {
    if (exportBlob) downloadBlob(exportBlob, name())
  }

  async function share() {
    if (!exportBlob) return
    try {
      await shareBlob(exportBlob, name())
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

  const what = is4x6 ? '4×6 photo' : 'photo'
  const preparing = ready && !exportBlob
  const primaryLabel = !ready
    ? isSingle
      ? 'Choose a photo'
      : `Add ${missing} more photo${missing > 1 ? 's' : ''}`
    : preparing
      ? 'Preparing…'
      : canShare
        ? `Save / Share ${what}`
        : is4x6
          ? 'Download 4×6 JPG'
          : 'Download JPG'

  const editingPhoto = editing !== null ? photos[editing] : null
  const error = set.error || exportError

  return (
    <main className="app">
      <header>
        <h1>NB Photobooth</h1>
        <p className="sub">{isSingle ? '1 photo · 4×6 or original shape' : '4 photos · 4×6 print'}</p>
      </header>

      <InstallPrompt />

      <div className="tabs mode-tabs" role="tablist" aria-label="Mode">
        {(['collage', 'single'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
          >
            {m === 'collage' ? 'Collage' : 'Single photo'}
          </button>
        ))}
      </div>

      {isSingle ? (
        <LayoutPicker
          title="Output"
          options={[...SINGLE_LAYOUTS, originalLayoutFor(...(imgW && imgH ? [imgW, imgH] as const : NO_PHOTO_SIZE))]}
          value={style.singleLayout}
          onChange={(id) => setStyle((s) => ({ ...s, singleLayout: id }))}
        />
      ) : (
        <LayoutPicker options={LAYOUTS} value={style.layout} onChange={(id) => setStyle((s) => ({ ...s, layout: id }))} />
      )}

      <section className="card">
        <h2 className="card-title">{isSingle ? 'Photo' : 'Photos'}</h2>
        {!isSingle && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => multiInputRef.current?.click()}
          >
            {filled === 0 ? 'Choose 4 photos' : ready ? 'Choose new photos' : `Add ${missing} more`}
          </button>
        )}
        <SlotPicker
          photos={photos}
          loading={set.loading}
          aspect={layout.aspect}
          filter={style.filter}
          onSelect={selectSlot}
        />
        <p className="hint">
          {isSingle ? 'Tap the photo to crop, adjust, rotate or replace it.' : 'Tap a photo to adjust, reorder or replace it.'}
        </p>
        {error && <p className="error">{error}</p>}
      </section>

      <StyleControls
        style={style}
        framed={layout.framed}
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
        <canvas ref={canvasRef} aria-label="Preview" onClick={onPreviewClick} />
        <p className="hint">{layout.hint}</p>
        <div className="secondary-actions">
          {canShare && (
            <button type="button" className="btn btn-soft" disabled={!exportBlob} onClick={download}>
              Download JPG
            </button>
          )}
          {is4x6 && (
            <button type="button" className="btn btn-soft" disabled={!exportBlob} onClick={print}>
              Print
            </button>
          )}
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
          count={count}
          aspect={layout.aspect}
          filter={style.filter}
          onDone={(edits) => {
            set.setEdits(editing, edits)
            setEditing(null)
          }}
          onMove={(dir, edits) => setEditing(set.movePhoto(editing, dir, edits))}
          onReplace={() => pickSlot(editing)}
          onRotate={(adjust) => set.rotate(editing, adjust)}
          onRemove={() => {
            set.setSlot(editing, null)
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
            set.setStickers(next)
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
