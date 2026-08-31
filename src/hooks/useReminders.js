import { useCallback, useEffect, useState } from 'react'
import { getAll, put, del } from '../db/database'

// Gym split cycle: 3-day repeating, 6 days/week, Sunday rest
// Sunday=0 ... Saturday=6
export const GYM_SPLITS = [
  [1, 'Chest + Triceps'],
  [2, 'Back + Biceps'],
  [3, 'Legs + Shoulders'],
  [4, 'Chest + Triceps'],
  [5, 'Back + Biceps'],
  [6, 'Legs + Shoulders'],
]
const GYM_SPLIT_MAP = Object.fromEntries(GYM_SPLITS) // {1:'Chest + Triceps', ...}

// Return today's gym split for a dateKey. Rest day (Sunday) returns null.
export function getGymSplitForDate(dateKey) {
  const d = new Date(`${dateKey}T00:00:00`)
  return GYM_SPLIT_MAP[d.getDay()] || null
}

export const DEFAULT_REMINDER_SUGGESTIONS = [
  // Water — every 45 minutes, active 9 AM – 9 PM (intervalStart/End override wake/sleep)
  { name: 'Drink Water', icon: '💧', intervalHours: 0.75, intervalStart: '09:00', intervalEnd: '21:00', enabled: true, daysOfWeek: [], message: '💧 Paani peene ka time ho gaya!' },

  // Meals — 5 fixed slots (skip Pre-/Post-workout on Sunday rest)
  { name: 'Pre-workout Meal', icon: '🥤', time: '05:30', enabled: true, daysOfWeek: [1,2,3,4,5,6], message: '🥤 Pre-workout meal ka time!' },
  { name: 'Post-workout Meal', icon: '🍳', time: '08:00', enabled: true, daysOfWeek: [1,2,3,4,5,6], message: '🍳 Post-workout meal ka time! Protein le.' },
  { name: 'Mid-meal / Snack', icon: '🥜', time: '11:30', enabled: true, daysOfWeek: [], message: '🥜 Mid-meal snack ka time!' },
  { name: 'Lunch', icon: '🍚', time: '13:30', enabled: true, daysOfWeek: [], message: '🍚 Lunch ka time! Healthy khao.' },
  { name: 'Dinner', icon: '🍽️', time: '20:30', enabled: true, daysOfWeek: [], message: '🍽️ Dinner ka time!' },

  // Exercise — gym at 6:00 AM, daily photo at 6:10 AM, then log at 8:00 AM
  { name: 'Gym Workout', icon: '💪', time: '06:00', enabled: true, daysOfWeek: [1,2,3,4,5,6], message: '💪 Gym ka time! {{gymSplit}}' },
  { name: 'Daily Progress Photo', icon: '📸', time: '06:10', enabled: true, daysOfWeek: [], message: '📸 Time for your daily photo!' },
  { name: 'Log Workout', icon: '📝', time: '08:00', enabled: true, daysOfWeek: [1,2,3,4,5,6], message: '📝 Log today\'s workout — {{gymSplit}} 💪' },

  // Daily chores / habits
  { name: 'Face Wash (Ice, Post-Gym)', icon: '🧊', time: '08:15', enabled: true, daysOfWeek: [1,2,3,4,5,6], message: '🧊 Face wash (ice) — gym ke baad!' },
  { name: 'Soak Daal/Chana/Chia', icon: '🌱', time: '21:00', enabled: true, daysOfWeek: [], message: '🌱 Soak daal/chana/chia seeds' },
  { name: 'Read 5 Pages', icon: '📖', time: '22:00', enabled: true, daysOfWeek: [], message: '📖 5 pages — life-changing book' },
  { name: 'Face Wash (Night)', icon: '🧼', time: '22:15', enabled: true, daysOfWeek: [], message: '🧼 Night face wash' },
  { name: 'Sleep on Time', icon: '😴', time: '22:30', enabled: true, daysOfWeek: [], message: '😴 So ja bhai, 10:30 ho gaya!' },

  // Weekly weigh-in — Saturday
  { name: 'Weekly Weigh-in', icon: '⚖️', time: '07:00', enabled: true, daysOfWeek: [6], message: '⚖️ Time for your weekly weigh-in!' },
]

// Reminders: { id, name, icon, time? OR intervalHours?, daysOfWeek[], enabled, message? }
export function useReminders() {
  const [reminders, setReminders] = useState([])

  const refresh = useCallback(async () => {
    const all = await getAll('reminders')
    setReminders(all)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const add = useCallback(
    async (reminder) => {
      const id = await put('reminders', reminder)
      await refresh()
      return id
    },
    [refresh]
  )

  const update = useCallback(
    async (id, patch) => {
      const all = await getAll('reminders')
      const existing = all.find((r) => r.id === id)
      if (existing) {
        await put('reminders', { ...existing, ...patch, id })
        await refresh()
      }
    },
    [refresh]
  )

  const toggle = useCallback(
    async (id, enabled) => update(id, { enabled }),
    [update]
  )

  const remove = useCallback(
    async (id) => {
      await del('reminders', id)
      await refresh()
    },
    [refresh]
  )

  return { reminders, add, update, toggle, remove, refresh }
}
