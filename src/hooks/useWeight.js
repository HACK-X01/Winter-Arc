import { useCallback, useEffect, useState } from 'react'
import { getAllByDate, put, del } from '../db/database'

// WeightLogs: { id, date, weight }
export function useWeight() {
  const [logs, setLogs] = useState([])

  const refresh = useCallback(async () => {
    const all = await getAllByDate('weightLogs')
    setLogs(all.sort((a, b) => a.date.localeCompare(b.date)))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const add = useCallback(
    async (dateKey, weight) => {
      const existing = (await getAllByDate('weightLogs')).find((l) => l.date === dateKey)
      if (existing) {
        await put('weightLogs', { ...existing, weight: Number(weight) })
      } else {
        await put('weightLogs', { date: dateKey, weight: Number(weight) })
      }
      await refresh()
    },
    [refresh]
  )

  const remove = useCallback(
    async (id) => {
      await del('weightLogs', id)
      await refresh()
    },
    [refresh]
  )

  const latest = logs.length ? logs[logs.length - 1] : null
  const previous = logs.length > 1 ? logs[logs.length - 2] : null

  return { logs, latest, previous, add, remove, refresh }
}
