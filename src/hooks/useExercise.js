import { useCallback, useEffect, useState } from 'react'
import { getAllByDate, put, del } from '../db/database'
import { todayKey } from '../utils/helpers'

// Today's gym split is pre-filled into the type selector (see ../pages/Exercise),
// so the 3 rotating splits are first-class options alongside generic types.
export const EXERCISE_TYPES = ['Chest + Triceps', 'Back + Biceps', 'Legs + Shoulders', 'Gym', 'Run', 'Yoga', 'Home Workout', 'Walk', 'Sports', 'Other']

// Exercises: { id, date, type, durationMin, notes }
export function useExercise(dateKey = todayKey()) {
  const [exercises, setExercises] = useState([])

  const refresh = useCallback(async () => {
    const all = await getAllByDate('exercises')
    setExercises(all.filter((e) => e.date === dateKey))
  }, [dateKey])

  useEffect(() => {
    refresh()
  }, [refresh])

  const add = useCallback(
    async (entry) => {
      const now = new Date()
      const record = {
        date: entry.date || dateKey,
        type: entry.type || 'Other',
        durationMin: Number(entry.durationMin) || 0,
        notes: entry.notes || '',
        time: entry.time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      }
      const id = await put('exercises', record)
      await refresh()
      return id
    },
    [dateKey, refresh]
  )

  const remove = useCallback(
    async (id) => {
      await del('exercises', id)
      await refresh()
    },
    [refresh]
  )

  // All workouts across all days, for the weekly/streak grid
  const allExercises = useCallback(async () => {
    return getAllByDate('exercises')
  }, [])

  return { exercises, add, remove, refresh, allExercises }
}
