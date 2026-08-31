import { useCallback, useEffect, useState } from 'react'
import { get, put } from '../db/database'
import { todayKey } from '../utils/helpers'

// Water tracking. Logs are stored per-date as { date, entries:[{time, amountMl}] }.
// Follows the passed dateKey directly (so switching dates on Report works).
export function useWater(dateKey = todayKey()) {
  const [day, setDay] = useState(null)

  useEffect(() => {
    let active = true
    get('waterLogs', dateKey).then((rec) => {
      if (active) setDay(rec || { date: dateKey, entries: [] })
    })
    return () => {
      active = false
    }
  }, [dateKey])

  const add = useCallback(
    async (amountMl) => {
      const rec = (await get('waterLogs', dateKey)) || { date: dateKey, entries: [] }
      const now = new Date()
      rec.entries.push({
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        amountMl,
      })
      await put('waterLogs', rec)
      setDay({ ...rec })
    },
    [dateKey]
  )

  const remove = useCallback(
    async (idx) => {
      const rec = (await get('waterLogs', dateKey)) || { date: dateKey, entries: [] }
      rec.entries.splice(idx, 1)
      await put('waterLogs', rec)
      setDay({ ...rec })
    },
    [dateKey]
  )

  const totalMl = (day?.entries || []).reduce((sum, e) => sum + e.amountMl, 0)

  return { dateKey, day, entries: day?.entries || [], totalMl, add, remove }
}
