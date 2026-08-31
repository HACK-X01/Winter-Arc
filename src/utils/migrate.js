import { getAll, put, clear, get, saveSettings } from '../db/database'
import { DEFAULT_REMINDER_SUGGESTIONS } from '../hooks/useReminders'

// One-time migration for users who onboarded before the personalised config:
// their stored reminders were the old generic set. Detect the old set and
// replace with the user's full schedule (water 45min, meals, gym split,
// chores, weigh-in, daily photo).
const OLD_NAMES = ['Drink Water', 'Read a Book', 'Face Wash', 'Workout', 'Log Meals', 'Sleep on Time']

export async function migrateToPersonalisedConfig() {
  try {
    const settings = await get('settings', 'user')
    if (!settings) return // never onboarded — defaults will be used

    // Only run once (bump when schema changes)
    if (settings.reminderConfigVersion === 3) return
    const reminders = await getAll('reminders')
    const usesOldSet = reminders.length > 0 && reminders.every((r) => OLD_NAMES.includes(r.name))

    if (usesOldSet) {
      await clear('reminders')
      for (const r of DEFAULT_REMINDER_SUGGESTIONS) {
        await put('reminders', r)
      }
    }

    // v3: patch existing Drink Water reminder with 9 AM – 9 PM window
    if (settings.reminderConfigVersion < 3) {
      const waterR = reminders.find((r) => r.name === 'Drink Water')
      if (waterR && !waterR.intervalStart) {
        await put('reminders', { ...waterR, intervalStart: '09:00', intervalEnd: '21:00' })
      }
    }

    // Refresh profile defaults for anyone who onboarded pre-config
    const patch = {}
    if (!settings.wakeTime || settings.wakeTime === '07:00') patch.wakeTime = '05:30'
    if (!settings.sleepTime || settings.sleepTime === '23:00') patch.sleepTime = '22:30'
    if (!settings.currentWeight) patch.currentWeight = 57
    if (!settings.goalWeight) patch.goalWeight = 70
    if (!settings.waterGoalMl || settings.waterGoalMl === 3000) patch.waterGoalMl = 4000
    if (settings.weighInDay === 0 && reminders.length === 0) patch.weighInDay = 6
    patch.reminderConfigVersion = 3

    await saveSettings(patch)
  } catch {
    // Database not ready yet — skip silently, migration runs again next launch
  }
}