// All coordinates are in print pixels: 4x6 in @ 300 DPI.
export const PRINT_WIDTH = 1200
export const PRINT_HEIGHT = 1800
export const DPI = 300
export const PHOTO_COUNT = 4

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** Area for the caption + date. `scale` multiplies the base font sizes. */
export interface CaptionBox extends Rect {
  scale: number
  /** Run the text bottom-to-top along the box's long side. */
  rotate?: boolean
}

export type LayoutId = 'double-strip' | 'grid' | 'strip-panel'

export interface Layout {
  id: LayoutId
  name: string
  hint: string
  /** Each cell shows photo `photo`; the same photo can appear in several cells. */
  cells: { rect: Rect; photo: number }[]
  captions: CaptionBox[]
  /** Draw cut marks down the middle of the sheet. */
  cutLine: boolean
  /** Separately cut pieces of the sheet (used by the film pattern for its edges). */
  panels: Rect[]
  /** Where stickers live. Sticker positions are stored relative to this area. */
  stickerArea: Rect
  /** Stickers are drawn once per x offset, e.g. on both strips of the double strip. */
  stickerRepeat: number[]
  /** Width / height of every photo cell in this layout. */
  aspect: number
}

const HALF = PRINT_WIDTH / 2

// 2x6 strip: 4 landscape photos with a caption footer.
const STRIP_PAD_X = 40
const STRIP_PAD_TOP = 50
const STRIP_GAP = 20
const STRIP_FOOTER = 210
const STRIP_PHOTO_W = HALF - STRIP_PAD_X * 2
const STRIP_PHOTO_H = (PRINT_HEIGHT - STRIP_PAD_TOP - STRIP_FOOTER - STRIP_GAP * 3) / 4

function strip(offsetX: number) {
  return {
    cells: Array.from({ length: PHOTO_COUNT }, (_, i) => ({
      photo: i,
      rect: {
        x: offsetX + STRIP_PAD_X,
        y: STRIP_PAD_TOP + i * (STRIP_PHOTO_H + STRIP_GAP),
        w: STRIP_PHOTO_W,
        h: STRIP_PHOTO_H,
      },
    })),
    caption: {
      x: offsetX + STRIP_PAD_X,
      y: PRINT_HEIGHT - STRIP_FOOTER,
      w: STRIP_PHOTO_W,
      h: STRIP_FOOTER,
      scale: 1,
    },
  }
}

// 2x2 grid: 4 portrait photos with a wide caption footer.
const GRID_PAD = 60
const GRID_GAP = 30
const GRID_FOOTER = 260
const GRID_PHOTO_W = (PRINT_WIDTH - GRID_PAD * 2 - GRID_GAP) / 2
const GRID_PHOTO_H = (PRINT_HEIGHT - GRID_PAD - GRID_FOOTER - GRID_GAP) / 2

const left = strip(0)
const right = strip(HALF)

const FULL: Rect = { x: 0, y: 0, w: PRINT_WIDTH, h: PRINT_HEIGHT }
const LEFT_HALF: Rect = { x: 0, y: 0, w: HALF, h: PRINT_HEIGHT }
const RIGHT_HALF: Rect = { x: HALF, y: 0, w: HALF, h: PRINT_HEIGHT }

export const LAYOUTS: Layout[] = [
  {
    id: 'double-strip',
    name: 'Double strip',
    hint: 'Print at 4×6 in, then cut down the middle for 2 strips.',
    cells: [...left.cells, ...right.cells],
    captions: [left.caption, right.caption],
    cutLine: true,
    panels: [LEFT_HALF, RIGHT_HALF],
    stickerArea: LEFT_HALF,
    stickerRepeat: [0, HALF],
    aspect: STRIP_PHOTO_W / STRIP_PHOTO_H,
  },
  {
    id: 'grid',
    name: '2×2 grid',
    hint: 'Print as a full 4×6 photo.',
    cells: Array.from({ length: PHOTO_COUNT }, (_, i) => ({
      photo: i,
      rect: {
        x: GRID_PAD + (i % 2) * (GRID_PHOTO_W + GRID_GAP),
        y: GRID_PAD + Math.floor(i / 2) * (GRID_PHOTO_H + GRID_GAP),
        w: GRID_PHOTO_W,
        h: GRID_PHOTO_H,
      },
    })),
    captions: [
      { x: GRID_PAD, y: PRINT_HEIGHT - GRID_FOOTER, w: PRINT_WIDTH - GRID_PAD * 2, h: GRID_FOOTER, scale: 1.5 },
    ],
    cutLine: false,
    panels: [FULL],
    stickerArea: FULL,
    stickerRepeat: [0],
    aspect: GRID_PHOTO_W / GRID_PHOTO_H,
  },
  {
    id: 'strip-panel',
    name: 'Strip + title',
    hint: 'Print at 4×6 in, then cut down the middle: 1 strip + 1 title card.',
    cells: left.cells,
    captions: [
      left.caption,
      { x: HALF + STRIP_PAD_X, y: STRIP_PAD_TOP, w: STRIP_PHOTO_W, h: PRINT_HEIGHT - STRIP_PAD_TOP * 2, scale: 2.4, rotate: true },
    ],
    cutLine: true,
    panels: [LEFT_HALF, RIGHT_HALF],
    stickerArea: FULL,
    stickerRepeat: [0],
    aspect: STRIP_PHOTO_W / STRIP_PHOTO_H,
  },
]

export const DEFAULT_LAYOUT: LayoutId = 'double-strip'

export function getLayout(id: LayoutId): Layout {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0]
}

/** Photo index shown at print coordinates (x, y), or -1. */
export function photoAt(layout: Layout, x: number, y: number): number {
  const cell = layout.cells.find(
    ({ rect: r }) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h,
  )
  return cell ? cell.photo : -1
}
