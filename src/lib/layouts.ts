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

export type LayoutId =
  | 'double-strip'
  | 'grid'
  | 'strip-panel'
  | 'single-framed'
  | 'single-full'
  | 'single-original'

export interface Layout {
  id: LayoutId
  name: string
  /** Sheet size in pixels (4x6 @ 300 DPI, or the photo's own size for 'original'). */
  width: number
  height: number
  /** Number of photos this layout takes. */
  photoCount: number
  /** Has a visible frame and caption (so the frame and caption controls apply). */
  framed: boolean
  /** Multiplies sticker sizes, so they stay the same relative size on a different-sized sheet. */
  stickerScale: number
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
    width: PRINT_WIDTH,
    height: PRINT_HEIGHT,
    photoCount: PHOTO_COUNT,
    framed: true,
    stickerScale: 1,
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
    width: PRINT_WIDTH,
    height: PRINT_HEIGHT,
    photoCount: PHOTO_COUNT,
    framed: true,
    stickerScale: 1,
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
    width: PRINT_WIDTH,
    height: PRINT_HEIGHT,
    photoCount: PHOTO_COUNT,
    framed: true,
    stickerScale: 1,
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

const SINGLE_PAD = 60
const SINGLE_FOOTER = 240
const SINGLE_FRAMED_PHOTO: Rect = {
  x: SINGLE_PAD,
  y: SINGLE_PAD,
  w: PRINT_WIDTH - SINGLE_PAD * 2,
  h: PRINT_HEIGHT - SINGLE_PAD - SINGLE_FOOTER,
}

const singleBase = {
  width: PRINT_WIDTH,
  height: PRINT_HEIGHT,
  photoCount: 1,
  cutLine: false,
  panels: [FULL],
  stickerArea: FULL,
  stickerRepeat: [0],
  stickerScale: 1,
}

/** One photo on a 4x6 sheet. */
export const SINGLE_LAYOUTS: Layout[] = [
  {
    ...singleBase,
    id: 'single-framed',
    name: '4×6 framed',
    hint: 'Print as a full 4×6 photo.',
    framed: true,
    cells: [{ photo: 0, rect: SINGLE_FRAMED_PHOTO }],
    captions: [
      { x: SINGLE_PAD, y: PRINT_HEIGHT - SINGLE_FOOTER, w: PRINT_WIDTH - SINGLE_PAD * 2, h: SINGLE_FOOTER, scale: 1.5 },
    ],
    aspect: SINGLE_FRAMED_PHOTO.w / SINGLE_FRAMED_PHOTO.h,
  },
  {
    ...singleBase,
    id: 'single-full',
    name: '4×6 full-bleed',
    hint: 'The photo fills the whole 4×6 print.',
    framed: false,
    cells: [{ photo: 0, rect: FULL }],
    captions: [],
    aspect: PRINT_WIDTH / PRINT_HEIGHT,
  },
]

export const ORIGINAL_ID: LayoutId = 'single-original'

/** The photo in its own shape: one full-size cell, no frame. Sized from the photo, so rebuild when it changes. */
export function originalLayout(width: number, height: number): Layout {
  const full: Rect = { x: 0, y: 0, w: width, h: height }
  return {
    ...singleBase,
    id: ORIGINAL_ID,
    name: 'Original shape',
    hint: 'Saved in the photo’s own shape, not a 4×6 print.',
    width,
    height,
    framed: false,
    cells: [{ photo: 0, rect: full }],
    captions: [],
    panels: [full],
    stickerArea: full,
    stickerScale: width / PRINT_WIDTH,
    aspect: width / height,
  }
}

export const DEFAULT_LAYOUT: LayoutId = 'double-strip'

export function getLayout(id: LayoutId): Layout {
  return [...LAYOUTS, ...SINGLE_LAYOUTS].find((l) => l.id === id) ?? LAYOUTS[0]
}

export const DEFAULT_SINGLE_LAYOUT: LayoutId = 'single-framed'

/** Longest side of the original-shape layout used for previews (exports use the photo's full size). */
export const ORIGINAL_PREVIEW_SIDE = 1200

/** `layout` scaled so its long side is `side` px; sticker positions are relative so they carry over. */
export function originalLayoutFor(w: number, h: number, side?: number): Layout {
  const k = side ? side / Math.max(w, h) : 1
  return originalLayout(Math.round(w * k), Math.round(h * k))
}

/** Photo index shown at print coordinates (x, y), or -1. */
export function photoAt(layout: Layout, x: number, y: number): number {
  const cell = layout.cells.find(
    ({ rect: r }) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h,
  )
  return cell ? cell.photo : -1
}
