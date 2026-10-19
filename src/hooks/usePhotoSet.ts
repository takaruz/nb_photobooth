import { useState } from 'react'
import { NO_ADJUST } from '../lib/adjust'
import { DEFAULT_CROP } from '../lib/crop'
import { loadPhoto, rotateClockwise } from '../lib/loadImage'
import type { Sticker } from '../lib/stickers'
import type { Photo, PhotoEdits } from '../types'

let nextId = 1

/** A set of `count` photo slots plus its stickers; collage and single mode each keep one. */
export function usePhotoSet(count: number, maxSide: number) {
  const [photos, setPhotos] = useState<(Photo | null)[]>(() => Array(count).fill(null))
  const [loading, setLoading] = useState<boolean[]>(() => Array(count).fill(false))
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [error, setError] = useState('')

  const setSlot = (index: number, photo: Photo | null) =>
    setPhotos((prev) => prev.map((p, i) => (i === index ? photo : p)))

  async function fillSlots(files: File[], slots: number[]) {
    setError('')
    setLoading((prev) => prev.map((v, i) => v || slots.includes(i)))
    await Promise.all(
      slots.map(async (slot, k) => {
        try {
          const image = await loadPhoto(files[k], maxSide)
          setSlot(slot, { id: nextId++, image, crop: DEFAULT_CROP, adjust: NO_ADJUST })
        } catch (e) {
          setError((e as Error).message)
        } finally {
          setLoading((prev) => prev.map((v, i) => (i === slot ? false : v)))
        }
      }),
    )
  }

  const setEdits = (index: number, edits: PhotoEdits) =>
    setPhotos((prev) => prev.map((p, i) => (i === index && p ? { ...p, ...edits } : p)))

  /** Swap with a neighbour, keeping the edits made in the editor. Returns the new index. */
  function movePhoto(index: number, dir: -1 | 1, edits: PhotoEdits) {
    const to = index + dir
    setPhotos((prev) => {
      const next = prev.map((p, i) => (i === index && p ? { ...p, ...edits } : p))
      ;[next[index], next[to]] = [next[to], next[index]]
      return next
    })
    return to
  }

  /** Turn the photo 90°; a new id remounts the editor so framing starts fresh, light carries over. */
  function rotate(index: number, adjust: PhotoEdits['adjust']) {
    const photo = photos[index]
    if (!photo) return
    setSlot(index, { id: nextId++, image: rotateClockwise(photo.image), crop: DEFAULT_CROP, adjust })
  }

  return {
    photos,
    loading,
    stickers,
    setStickers,
    error,
    filled: photos.filter(Boolean).length,
    fillSlots,
    setSlot,
    setEdits,
    movePhoto,
    rotate,
  }
}
