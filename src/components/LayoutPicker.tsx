import { LAYOUTS, PRINT_HEIGHT, PRINT_WIDTH, type LayoutId } from '../lib/layouts'

interface Props {
  value: LayoutId
  onChange: (id: LayoutId) => void
}

/** Layout options, each drawn as a mini sheet from the real layout geometry. */
export function LayoutPicker({ value, onChange }: Props) {
  return (
    <section className="card">
      <h2 className="card-title">Layout</h2>
      <div className="layouts" role="radiogroup" aria-label="Layout">
        {LAYOUTS.map((layout) => (
          <button
            key={layout.id}
            type="button"
            role="radio"
            aria-checked={value === layout.id}
            className="layout-opt"
            onClick={() => onChange(layout.id)}
          >
            <svg viewBox={`0 0 ${PRINT_WIDTH} ${PRINT_HEIGHT}`} aria-hidden="true">
              <rect className="layout-paper" width={PRINT_WIDTH} height={PRINT_HEIGHT} rx={30} />
              {layout.cells.map(({ rect: r }, i) => (
                <rect key={i} className="layout-cell" x={r.x} y={r.y} width={r.w} height={r.h} rx={14} />
              ))}
              {layout.captions.map((box, i) => {
                // A bar standing in for the caption text.
                const len = (box.rotate ? box.h : box.w) * 0.5
                const thick = 36 * box.scale
                const cx = box.x + box.w / 2
                const cy = box.y + box.h / 2
                const [w, h] = box.rotate ? [thick, len] : [len, thick]
                return <rect key={i} className="layout-text" x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={thick / 2} />
              })}
            </svg>
            <span>{layout.name}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
