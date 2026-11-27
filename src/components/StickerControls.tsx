import { useState } from 'react'
import type { StickerLayer } from '../hooks/useStickerLayer'
import { STICKER_MAX, STICKER_MIN, STICKERS } from '../lib/stickers'
import { EmojiPicker } from './EmojiPicker'

/** Size / rotate / delete for the selected sticker, or the Emoji | Stickers picker when none is selected. */
export function StickerControls({ layer }: { layer: StickerLayer }) {
  const { current, stickers, setStickers, setSelected, updateSelected, add } = layer
  const [tab, setTab] = useState<'emoji' | 'sticker'>('emoji')

  if (current) {
    const degrees = Math.round((((current.rotation * 180) / Math.PI + 540) % 360) - 180)
    return (
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
              setStickers((prev) => prev.filter((s) => s.id !== current.id))
              setSelected(null)
            }}
          >
            Delete sticker
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Sticker type">
        {(['emoji', 'sticker'] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {t === 'emoji' ? 'Emoji' : 'Stickers'}
          </button>
        ))}
      </div>
      {tab === 'emoji' ? (
        <EmojiPicker onPick={add} />
      ) : (
        <div className="emoji-grid sticker-grid" role="group" aria-label="Add a sticker">
          {STICKERS.map((def) => (
            <button key={def.key} type="button" className="emoji-btn" aria-label={def.label} onClick={() => add(def.key)}>
              <img src={def.image!.src} alt="" />
            </button>
          ))}
        </div>
      )}
      {stickers.length > 0 && (
        <div className="editor-row">
          <button type="button" className="btn btn-danger" onClick={() => setStickers(() => [])}>
            Clear all stickers
          </button>
        </div>
      )}
    </>
  )
}
