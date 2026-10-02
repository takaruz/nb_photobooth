import type { SheetStyle } from '../types'
import { FilterPicker } from './FilterPicker'
import { PatternPicker } from './PatternPicker'

// Quick picks for the caption; people can still type their own.
const CAPTIONS = [
  'Team Erik 2026',
  'Hello, Little Erik',
  'Certified Erik Fan Club',
  'New Boss in Town: Erik',
  'Erik’s Debut with the Crew',
  'Baby Erik’s Welcome Squad',
  'Wrapped in Love & Little Erik',
  'Little Hands, Big Hearts',
  'Erik’s First Friends',
]

export const DEFAULT_CAPTION = CAPTIONS[0]

const FRAME_COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Cream', value: '#fbf3e4' },
  { name: 'Pastel blue', value: '#cfe4f7' },
  { name: 'Baby pink', value: '#f9d9e2' },
  { name: 'Mint', value: '#d4f0e2' },
  { name: 'Lavender', value: '#e3dcf5' },
  { name: 'Black', value: '#1c1c1e' },
]

interface Props {
  style: SheetStyle
  /** First photo, used to preview filters. */
  sample: HTMLCanvasElement | null
  onChange: (patch: Partial<SheetStyle>) => void
}

export function StyleControls({ style, sample, onChange: set }: Props) {
  const isPreset = FRAME_COLORS.some((c) => c.value === style.frameColor)

  return (
    <section className="card">
      <h2 className="card-title">Style</h2>

      <h3 className="field-label">Filter</h3>
      <FilterPicker value={style.filter} sample={sample} onChange={(filter) => set({ filter })} />

      <h3 className="field-label">Frame color</h3>
      <div className="swatches" role="group" aria-label="Frame color">
        {FRAME_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            className="swatch"
            style={{ background: c.value }}
            aria-label={c.name}
            aria-pressed={style.frameColor === c.value}
            onClick={() => set({ frameColor: c.value })}
          />
        ))}
        <label
          className="swatch swatch-custom"
          aria-pressed={!isPreset}
          style={isPreset ? undefined : { background: style.frameColor }}
          title="Custom color"
        >
          <input
            type="color"
            value={style.frameColor}
            aria-label="Custom frame color"
            onChange={(e) => set({ frameColor: e.target.value })}
          />
        </label>
      </div>

      <h3 className="field-label">Frame pattern</h3>
      <PatternPicker value={style.pattern} frameColor={style.frameColor} onChange={(pattern) => set({ pattern })} />

      <label className="field">
        <span>Caption</span>
        <input
          type="text"
          value={style.title}
          maxLength={32}
          placeholder="Type a caption, or leave empty"
          onChange={(e) => set({ title: e.target.value })}
        />
      </label>
      <div className="caption-chips" role="group" aria-label="Caption suggestions">
        {CAPTIONS.map((c) => (
          <button
            key={c}
            type="button"
            className="chip"
            aria-pressed={style.title === c}
            onClick={() => set({ title: c })}
          >
            {c}
          </button>
        ))}
      </div>

      <label className="check">
        <input type="checkbox" checked={style.showDate} onChange={(e) => set({ showDate: e.target.checked })} />
        <span>Show date</span>
      </label>
    </section>
  )
}
