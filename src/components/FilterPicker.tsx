import { useEffect, useRef } from 'react'
import { DEFAULT_CROP } from '../lib/crop'
import { applyFilter, FILTERS, type FilterId } from '../lib/filters'
import { drawPhoto } from '../lib/render'

interface Props {
  value: FilterId
  /** Photo used for the chip previews; a sample gradient is shown without one. */
  sample: HTMLCanvasElement | null
  onChange: (id: FilterId) => void
}

const SIZE = 112

function drawSample(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, SIZE, SIZE)
  g.addColorStop(0, '#f6b8c8')
  g.addColorStop(0.5, '#9fcdf3')
  g.addColorStop(1, '#bfe8c9')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, SIZE, SIZE)
}

function Chip({ id, sample }: { id: FilterId; sample: HTMLCanvasElement | null }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    // Filter a tiny copy so chips stay cheap even for 6 filters.
    const canvas = ref.current!
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')!
    if (sample) drawPhoto(ctx, sample, DEFAULT_CROP, { x: 0, y: 0, w: SIZE, h: SIZE })
    else drawSample(ctx)
    applyFilter(canvas, id)
  }, [id, sample])
  return <canvas ref={ref} />
}

export function FilterPicker({ value, sample, onChange }: Props) {
  return (
    <div className="filters" role="radiogroup" aria-label="Filter">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          role="radio"
          aria-checked={value === f.id}
          className="filter-opt"
          onClick={() => onChange(f.id)}
        >
          <Chip id={f.id} sample={sample} />
          <span>{f.name}</span>
        </button>
      ))}
    </div>
  )
}
