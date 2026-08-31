import { useCallback, useEffect, useState } from 'react'
import { getAll, get, put } from '../db/database'

// dailyReports: { date, waterPct, meals, exercise, chores, dayScore, note?, weight? }
//   meals: { count, list:[] }, exercise: { done, type, durationMin }, chores: { completed, total },
//   waterPct: 0-100, dayScore: 0-100
export function useDailyReports() {
  const [reports, setReports] = useState([])

  const refresh = useCallback(async () => {
    const all = await getAll('dailyReports')
    setReports(all)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const getByDate = useCallback(async (date) => {
    return (await get('dailyReports', date)) || null
  }, [])

  const save = useCallback(async (report) => {
    await put('dailyReports', report)
    await refresh()
  }, [refresh])

  const sorted = [...reports].sort((a, b) => b.date.localeCompare(a.date))

  return { reports: sorted, getByDate, save, refresh }
}
