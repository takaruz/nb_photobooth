import type { Rect } from './layouts'

export type PatternId = 'plain' | 'dots' | 'stripes' | 'gingham' | 'hearts' | 'film'

export const PATTERNS: { id: PatternId; name: string }[] = [
  { id: 'plain', name: 'Plain' },
  { id: 'dots', name: 'Dots' },
  { id: 'stripes', name: 'Stripes' },
  { id: 'gingham', name: 'Gingham' },
  { id: 'hearts', name: 'Hearts' },
  { id: 'film', name: 'Film' },
]

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath()
  ctx.moveTo(x, y + s * 0.35)
  ctx.bezierCurveTo(x - s * 0.1, y - s * 0.05, x - s * 0.55, y + s * 0.05, x - s * 0.5, y - s * 0.2)
  ctx.bezierCurveTo(x - s * 0.45, y - s * 0.5, x - s * 0.05, y - s * 0.5, x, y - s * 0.2)
  ctx.bezierCurveTo(x + s * 0.05, y - s * 0.5, x + s * 0.45, y - s * 0.5, x + s * 0.5, y - s * 0.2)
  ctx.bezierCurveTo(x + s * 0.55, y + s * 0.05, x + s * 0.1, y - s * 0.05, x, y + s * 0.35)
  ctx.fill()
}

/**
 * Paint a frame pattern over the frame color, using a translucent ink so it
 * works on any color. `unit` scales the pattern (1 = print size).
 */
export function drawPattern(
  ctx: CanvasRenderingContext2D,
  id: PatternId,
  w: number,
  h: number,
  dark: boolean,
  panels: Rect[],
  unit = 1,
) {
  if (id === 'plain') return
  ctx.save()
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.07)'

  if (id === 'dots') {
    const step = 64 * unit
    const r = 9 * unit
    for (let row = 0, y = step / 2; y < h + step; row++, y += step) {
      for (let x = row % 2 ? step : step / 2; x < w + step; x += step) {
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  } else if (id === 'stripes') {
    const step = 64 * unit
    const diag = Math.hypot(w, h)
    ctx.translate(w / 2, h / 2)
    ctx.rotate(-Math.PI / 4)
    for (let x = -diag; x < diag; x += step) ctx.fillRect(x, -diag, step * 0.4, diag * 2)
  } else if (id === 'gingham') {
    // Overlapping translucent bands: crossings come out darker, like woven gingham.
    const step = 80 * unit
    const band = step / 2
    for (let x = 0; x < w; x += step) ctx.fillRect(x, 0, band, h)
    for (let y = 0; y < h; y += step) ctx.fillRect(0, y, w, band)
  } else if (id === 'hearts') {
    const step = 110 * unit
    for (let row = 0, y = step / 2; y < h + step; row++, y += step) {
      for (let x = row % 2 ? step : step / 2; x < w + step; x += step) heart(ctx, x, y, 34 * unit)
    }
  } else if (id === 'film') {
    // Sprocket holes down both edges of every panel.
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.16)'
    const hw = 22 * unit
    const hh = 30 * unit
    const step = 60 * unit
    const inset = 9 * unit
    for (const p of panels) {
      for (let y = p.y + step / 2 - hh / 2; y + hh < p.y + p.h; y += step) {
        for (const x of [p.x + inset, p.x + p.w - inset - hw]) {
          ctx.beginPath()
          ctx.roundRect(x, y, hw, hh, 5 * unit)
          ctx.fill()
        }
      }
    }
  }

  ctx.restore()
}
