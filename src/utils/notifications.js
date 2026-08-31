import { timeToMinutes, todayKey, appliesOnDateKey } from './helpers'
import { getGymSplitForDate } from '../hooks/useReminders'

// ---- Notification layer ------------------------------------------------
// Best-effort local notifications. Reliable while app is open / recently used.
// Android (Chrome) background works reasonably well via SW; iOS Safari stricter.
// Phase 2 (Capacitor + AlarmManager native) is the guaranteed-alarm path.

const SW_PATH = import.meta.env.PROD ? '/sw.js' : '/sw.js'

export function browserSupportsNotifications() {
  return 'Notification' in window
}

export function permissionState() {
  if (!browserSupportsNotifications()) return 'unsupported'
  return Notification.permission
}

export async function requestPermission() {
  if (!browserSupportsNotifications()) return 'unsupported'
  return Notification.requestPermission()
}

export async function getRegistration() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    return reg || null
  } catch {
    return null
  }
}

// Show a local notification via the service worker (works when tab unfocused)
export async function showLocalNotification(title, body, url = '/') {
  try {
    const reg = (await getRegistration()) || (await registerSW())
    if (!reg || !reg.showNotification) return false
    if (Notification.permission !== 'granted') return false
    await reg.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'winter-arc',
      renotify: true,
      data: { url },
    })
    return true
  } catch {
    return false
  }
}

async function registerSW() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register(SW_PATH)
    return reg
  } catch {
    return null
  }
}

// ---- Scheduling --------------------------------------------------------
// Build today's reminder fire-times (only within wake..sleep window).
// A reminder has either a fixed `time` ('HH:MM') or `intervalHours` (repeat
// every N hours from wake-time). Result: [{ key, title, body, time, url }]
export function buildTodaySchedule(reminders, settings) {
  const dateKey = todayKey()
  const { wakeTime, sleepTime } = settings
  const wakeMin = timeToMinutes(wakeTime)
  const sleepMin = timeToMinutes(sleepTime)

  const jobs = []
  for (const r of reminders || []) {
    if (!r.enabled) continue
    if (!appliesOnDateKey(r, dateKey)) continue

    if (r.time) {
      const min = timeToMinutes(r.time)
      if (min >= wakeMin && min <= sleepMin) {
        jobs.push({ key: r.id, title: interpolate(r, r.message || defaultMessage(r)), body: r.name, time: r.time, url: r.url || defaultUrl(r) })
      }
    } else if (r.intervalHours) {
      // Per-reminder window (intervalStart/intervalEnd) overrides global wake/sleep
      const iStart = r.intervalStart ? timeToMinutes(r.intervalStart) : wakeMin
      const iEnd   = r.intervalEnd   ? timeToMinutes(r.intervalEnd)   : sleepMin
      const step = r.intervalHours * 60
      for (let min = iStart; min <= iEnd; min += step) {
        jobs.push({ key: `${r.id}-${min}`, title: defaultRepeatMessage(r), body: r.name, time: toHHMM(min), url: r.url || '/' })
      }
    }
  }
  return jobs
}

// Sub in dynamic bits: {{gymSplit}} -> today's split (or nothing on rest day)
function interpolate(r, template) {
  const split = getGymSplitForDate(todayKey())
  if (template.includes('{{gymSplit}}')) {
    return split ? template.replace(/\{\{gymSplit\}\}/g, split) : template.replace(/.*\{\{gymSplit\}\}.*\n?/, '').trim()
  }
  return template
}

// Direct navigation targets for tap-to-open
function defaultUrl(r) {
  const name = (r.name || '').toLowerCase()
  if (name.includes('weigh')) return '/#/weight'
  if (name.includes('photo')) return '/#/gallery'
  if (name.includes('workout') || name.includes('gym')) return '/#/exercise'
  return '/'
}

// Build display-only timeline items for a date (used on the Home dashboard).
// Returns: [{ key, name, icon, time }] for enabled, applicable reminders.
export function buildTimelineItems(reminders, settings, dateKey = todayKey()) {
  const { wakeTime, sleepTime } = settings
  const wakeMin = timeToMinutes(wakeTime)
  const sleepMin = timeToMinutes(sleepTime)
  const items = []
  for (const r of reminders || []) {
    if (!r.enabled) continue
    if (!appliesOnDateKey(r, dateKey)) continue
    if (r.time) {
      const min = timeToMinutes(r.time)
      if (min >= wakeMin && min <= sleepMin) {
        items.push({ key: r.id, name: r.name, icon: r.icon || '⏰', time: r.time })
      }
    } else if (r.intervalHours) {
      const iStart = r.intervalStart ? timeToMinutes(r.intervalStart) : wakeMin
      const iEnd   = r.intervalEnd   ? timeToMinutes(r.intervalEnd)   : sleepMin
      const step = r.intervalHours * 60
      for (let min = iStart; min <= iEnd; min += step) {
        items.push({ key: `${r.id}-${min}`, name: r.name, icon: r.icon || '⏰', time: toHHMM(min) })
      }
    }
  }
  return items
}

function toHHMM(min) {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function defaultMessage(r) {
  return (r.name || 'Reminder').toLowerCase() === 'drink water' || (r.name || '').toLowerCase() === 'paani'
    ? '💧 Paani peene ka time ho gaya!'
    : `⏰ ${r.name} ka time ho gaya!`
}

function defaultRepeatMessage(r) {
  return `⏰ ${r.name} ka reminder!`
}

// Arm one-job timers for the rest of today. Returns cleanup function.
// Lightweight fallback: fires via SW only while this page stays alive.
// (Periodic Background Sync is attempted separately and covers the
//  "app recently closed" case on Chrome/Android where supported.)
export function armTodayTimers(jobs, onFire, _settings) {
  const now = new Date()
  const todayKeyStr = todayKey()
  const timers = []

  for (const job of jobs) {
    // Build a Date for job.time today; skip if already passed
    const [h, m] = job.time.split(':').map(Number)
    const fireAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0)
    let delay = fireAt - now
    if (delay < 0) continue // already fired today's instance

    const t = setTimeout(() => onFire(job), delay)
    timers.push(t)
  }

  // Re-arm at midnight in case the app stays open past midnight
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1, 0, 0)
  const midTimer = setTimeout(function scheduleNextDay() {
    window.dispatchEvent(new CustomEvent('winterarc:newday', { detail: todayKeyStr }))
  }, midnight - now)

  return () => {
    timers.forEach(clearTimeout)
    clearTimeout(midTimer)
  }
}

// Register Periodic Background Sync where supported (Chrome/Android).
export async function registerPeriodicSync() {
  try {
    const reg = await getRegistration()
    if (!reg) return 'unsupported'
    if (!('periodicSync' in reg)) return 'unsupported'
    const status = await navigator.permissions.query({ name: 'periodic-background-sync' })
    if (status.state === 'granted') {
      await reg.periodicSync.register('winter-arc-check', { minInterval: 60 * 60 * 1000 })
      return 'registered'
    }
    return 'permission-denied'
  } catch {
    return 'unsupported'
  }
}

export function supportsPeriodicSync() {
  if (!('serviceWorker' in navigator)) return false
  return 'periodicSync' in (navigator.serviceWorker.constructor && {})
}
