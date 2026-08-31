import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAll, put, del } from '../db/database'
import { appliesOnDateKey } from '../utils/helpers'

// dailyCompletion: { id:'<date>_<reminderId>', date, reminderId, done }
export function useDailyCompletion() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const all = await getAll('dailyCompletion')
    setRecords(all)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setDone = useCallback(
    async (date, reminderId, done) => {
      const id = `${date}_${reminderId}`
      if (done) {
        await put('dailyCompletion', { id, date, reminderId, done: true })
      } else {
        await del('dailyCompletion', id)
      }
      await refresh()
    },
    [refresh]
  )

  // Map: date -> Set(reminderId done), plus lookups
  const byDate = useMemo(() => {
    const map = {}
    for (const r of records) {
      if (!map[r.date]) map[r.date] = {}
      map[r.date][r.reminderId] = r.done
    }
    return map
  }, [records])

  const getForDate = useCallback(
    (date) => {
      const map = byDate[date] || {}
      return (rid) => !!map[rid]
    },
    [byDate]
  )

  // Which full days had ALL enabled+applicable reminders done
  const fullyCompletedDays = useCallback(
    (reminders) => {
      const done = {}
      for (const r of records) {
        if (r.done) {
          if (!done[r.date]) done[r.date] = []
          done[r.date].push(r.reminderId)
        }
      }
      const result = []
      for (const date of Object.keys(done)) {
        const applicable = reminders
          .filter((r) => r.enabled && appliesOnDateKey(r, date))
          .map((r) => r.id)
        if (applicable.length > 0 && applicable.every((rid) => done[date].includes(rid))) {
          result.push(date)
        }
      }
      return result
    },
    [records]
  )

  return { records, loading, setDone, getForDate, byDate, fullyCompletedDays, refresh }
}
