import { useEffect, useRef } from 'react'
import { drawPattern, PATTERNS, type PatternId } from '../lib/patterns'
import { isDark } from '../lib/render'

interface Props {
  value: PatternId
  frameColor: string
  onChange: (id: PatternId) => void
}

const SIZE = 112

function Chip({ id, frameColor }: { id: PatternId; frameColor: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = frameColor
    ctx.fillRect(0, 0, SIZE, SIZE)
    const panel = { x: 0, y: 0, w: SIZE, h: SIZE }
    drawPattern(ctx, id, SIZE, SIZE, isDark(frameColor), [panel], 0.55)
  }, [id, frameColor])
  return <canvas ref={ref} />
}

export function PatternPicker({ value, frameColor, onChange }: Props) {
  return (
    <div className="filters" role="radiogroup" aria-label="Frame pattern">
      {PATTERNS.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={value === p.id}
          className="filter-opt"
          onClick={() => onChange(p.id)}
        >
          <Chip id={p.id} frameColor={frameColor} />
          <span>{p.name}</span>
        </button>
      ))}
    </div>
  )
}
