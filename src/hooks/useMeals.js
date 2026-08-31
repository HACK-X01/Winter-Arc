import { useCallback, useEffect, useState } from 'react'
import { getAllByDate, put, del } from '../db/database'
import { todayKey } from '../utils/helpers'

export const MEAL_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

// Meals: { id, date, category, name, calories?, notes?, time }
export function useMeals(dateKey = todayKey()) {
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    getAllByDate('meals').then((all) => {
      if (!active) return
      const filtered = all.filter((m) => m.date === dateKey)
      setMeals(filtered)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [dateKey])

  const refresh = useCallback(async () => {
    const all = await getAllByDate('meals')
    setMeals(all.filter((m) => m.date === dateKey))
  }, [dateKey])

  const add = useCallback(
    async (entry) => {
      const now = new Date()
      const record = {
        date: entry.date || dateKey,
        category: entry.category || 'Snacks',
        name: entry.name,
        calories: entry.calories ? Number(entry.calories) : null,
        notes: entry.notes || '',
        time: entry.time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      }
      const id = await put('meals', record)
      await refresh()
      return id
    },
    [dateKey, refresh]
  )

  const remove = useCallback(
    async (id) => {
      await del('meals', id)
      await refresh()
    },
    [refresh]
  )

  return { meals, loading, add, remove, refresh }
}
