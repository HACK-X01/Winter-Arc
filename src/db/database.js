import { openDB } from 'idb'

// Winter Arc Tracker — IndexedDB schema.
// Single-user, fully local. All data lives in one database on-device.
// Object stores:
//   settings         -> single record { id:'user', ... }  (challenge dates, goals, units, theme)
//   reminders        -> { id, name, icon, time?, intervalHours?, intervalStart?, intervalEnd?, daysOfWeek[], enabled, message? }
//   waterLogs        -> { date:'YYYY-MM-DD', entries:[{ time, amountMl }] }
//   meals            -> { id, date, category, name, calories?, notes?, time }
//   exercises        -> { id, date, type, durationMin, notes }
//   weightLogs       -> { id, date, weight }
//   dailyCompletion  -> { id:'<date>_<reminderId>', date, reminderId, done }
//   dailyReports     -> { date, waterPct, meals, exercise, chores, dayScore, note?, weight? }
//   photos           -> { id, date, blob, createdAt }

const DB_NAME = 'winter-arc-tracker'
// Bump to 3 so the photos store is added on existing installs.
const DB_VERSION = 3

let dbPromise

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // IMPORTANT: during upgrade you must create indexes via the object store
        // returned by createObjectStore() — calling db.transaction() here throws
        // "A version change transaction is running" and aborts the whole upgrade.
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' })

        if (!db.objectStoreNames.contains('reminders')) {
          db.createObjectStore('reminders', { keyPath: 'id', autoIncrement: true }).createIndex('by-date', 'date')
        }
        if (!db.objectStoreNames.contains('waterLogs')) db.createObjectStore('waterLogs', { keyPath: 'date' })
        if (!db.objectStoreNames.contains('meals')) {
          db.createObjectStore('meals', { keyPath: 'id', autoIncrement: true }).createIndex('by-date', 'date')
        }
        if (!db.objectStoreNames.contains('exercises')) {
          db.createObjectStore('exercises', { keyPath: 'id', autoIncrement: true }).createIndex('by-date', 'date')
        }
        if (!db.objectStoreNames.contains('weightLogs')) {
          db.createObjectStore('weightLogs', { keyPath: 'id', autoIncrement: true }).createIndex('by-date', 'date')
        }
        if (!db.objectStoreNames.contains('dailyCompletion')) {
          db.createObjectStore('dailyCompletion', { keyPath: 'id' }).createIndex('by-date', 'date')
        }
        if (!db.objectStoreNames.contains('dailyReports')) db.createObjectStore('dailyReports', { keyPath: 'date' })
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true }).createIndex('by-date', 'date')
        }
      },
    })
  }
  return dbPromise
}

// --- helpers -------------------------------------------------------------
export async function getAll(store) {
  return (await getDB()).getAll(store)
}

export async function getAllByDate(store) {
  return (await getDB()).getAllFromIndex(store, 'by-date')
}

export async function put(store, value) {
  return (await getDB()).put(store, value)
}

export async function get(store, key) {
  return (await getDB()).get(store, key)
}

export async function del(store, key) {
  return (await getDB()).delete(store, key)
}

export async function clear(store) {
  return (await getDB()).clear(store)
}

// --- settings -------------------------------------------------------------
export const DEFAULT_SETTINGS = {
  id: 'user',
  startDate: '2026-09-01',
  endDate: null, // computed from durationMonths
  durationMonths: 6,
  wakeTime: '05:30',
  sleepTime: '22:30',
  currentWeight: 57,
  goalWeight: 70,
  waterGoalMl: 4000,
  units: 'kg', // 'kg' | 'lb'
  theme: 'dark', // 'dark' | 'light'
  weighInDay: 6, // 0 = Sunday ... 6 = Saturday; null = off
  onboardingComplete: false,
}

export async function getSettings() {
  const settings = await get('settings', 'user')
  return { ...DEFAULT_SETTINGS, ...(settings || {}) }
}

export async function saveSettings(patch) {
  const existing = await getSettings()
  await put('settings', { ...existing, ...patch })
  return getSettings()
}
