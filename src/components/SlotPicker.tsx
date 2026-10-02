import { useEffect, useRef, type CSSProperties } from 'react'
import { filtered, type FilterId } from '../lib/filters'
import { drawPhoto } from '../lib/render'
import type { Photo } from '../types'

interface Props {
  photos: (Photo | null)[]
  loading: boolean[]
  aspect: number
  filter: FilterId
  onSelect: (index: number) => void
}

const THUMB_W = 208

/** Thumbnail drawn with the photo's crop and filter, so it matches the print. */
function Thumb({ photo, aspect, filter }: { photo: Photo; aspect: number; filter: FilterId }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const h = Math.round(THUMB_W / aspect)
    canvas.width = THUMB_W
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    drawPhoto(ctx, filtered(photo.image, filter), photo.crop, { x: 0, y: 0, w: THUMB_W, h })
  }, [photo, aspect, filter])
  return <canvas ref={ref} />
}

export function SlotPicker({ photos, loading, aspect, filter, onSelect }: Props) {
  return (
    <div className="slots" style={{ '--slot-aspect': aspect } as CSSProperties}>
      {photos.map((photo, i) => (
        <button
          key={i}
          type="button"
          className="slot-btn"
          onClick={() => onSelect(i)}
          aria-label={photo ? `Edit photo ${i + 1}` : `Add photo ${i + 1}`}
        >
          {loading[i] ? (
            <span className="slot-label">…</span>
          ) : photo ? (
            <Thumb photo={photo} aspect={aspect} filter={filter} />
          ) : (
            <span className="slot-label">+{i + 1}</span>
          )}
        </button>
      ))}
    </div>
  )
}
