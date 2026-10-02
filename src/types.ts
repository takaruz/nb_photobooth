import type { Crop } from './lib/crop'
import type { FilterId } from './lib/filters'
import type { LayoutId } from './lib/layouts'
import type { PatternId } from './lib/patterns'

export interface Photo {
  id: number
  image: HTMLCanvasElement
  crop: Crop
}

export interface SheetStyle {
  layout: LayoutId
  filter: FilterId
  frameColor: string
  pattern: PatternId
  title: string
  showDate: boolean
}
