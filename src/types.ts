import type { Adjustments } from './lib/adjust'
import type { Crop } from './lib/crop'
import type { FilterId } from './lib/filters'
import type { LayoutId } from './lib/layouts'
import type { PatternId } from './lib/patterns'
import type { Sticker } from './lib/stickers'

export interface Photo {
  id: number
  image: HTMLCanvasElement
  crop: Crop
  adjust: Adjustments
  /** Stickers on this photo only; positions are fractions of its cell. */
  stickers: Sticker[]
}

/** What the photo editor changes: framing, light and stickers. */
export type PhotoEdits = Pick<Photo, 'crop' | 'adjust' | 'stickers'>

export interface SheetStyle {
  /** Collage layout. */
  layout: LayoutId
  /** Output for single-photo mode. */
  singleLayout: LayoutId
  filter: FilterId
  frameColor: string
  pattern: PatternId
  title: string
  showDate: boolean
}
