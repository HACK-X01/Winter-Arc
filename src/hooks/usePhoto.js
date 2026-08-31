import { useCallback, useEffect, useState } from 'react'
import { getAllByDate, put, del } from '../db/database'
import { todayKey } from '../utils/helpers'

// Daily progress photos. Stored as blobs in IndexedDB — fully local, no upload.
// Photos: { id, date:'YYYY-MM-DD', blob, createdAt }
export function usePhoto() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    getAllByDate('photos').then((all) => {
      if (!active) return
      setPhotos(all)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const refresh = useCallback(async () => {
    setPhotos(await getAllByDate('photos'))
  }, [])

  // Save photo for a date. If one already exists for that date, replace it.
  const add = useCallback(
    async (blob, date = todayKey()) => {
      const existing = photos.find((p) => p.date === date)
      if (existing) {
        await put('photos', { ...existing, blob, createdAt: Date.now() })
      } else {
        await put('photos', { date, blob, createdAt: Date.now() })
      }
      await refresh()
    },
    [photos, refresh]
  )

  const remove = useCallback(
    async (id) => {
      await del('photos', id)
      await refresh()
    },
    [refresh]
  )

  const getForDate = useCallback((date) => photos.find((p) => p.date === date) || null, [photos])

  return { photos, loading, add, remove, getForDate, refresh }
}