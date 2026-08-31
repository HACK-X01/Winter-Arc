// Date + streak helpers (all local time, no external deps)

const DAY_NAMES = ['Ravivvar', 'Somvar', 'Mangalvar', 'Budhvar', 'Guruvar', 'Shukravar', 'Shanivar']

export function toDateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey() {
  return toDateKey()
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function addDateKey(key, n) {
  return toDateKey(addDays(parseDateKey(key), n))
}

export function fmtDate(key) {
  const d = parseDateKey(key)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function fmtDateShort(key) {
  const d = parseDateKey(key)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

export function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(min) {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function fmtTime12(t) {
  const min = timeToMinutes(t)
  let h = Math.floor(min / 60)
  const m = min % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`
}

// Days since challenge start (0-based). Negative if before start.
export function dayIndexOf(startDateKey, dateKey = todayKey()) {
  const start = parseDateKey(startDateKey)
  const d = parseDateKey(dateKey)
  return Math.round((d - start) / 86400000)
}

export function computeEndDate(startDateKey, durationMonths) {
  const d = parseDateKey(startDateKey)
  d.setMonth(d.getMonth() + durationMonths)
  d.setDate(d.getDate() - 1)
  return toDateKey(d)
}

export function daysBetween(aKey, bKey) {
  return Math.round((parseDateKey(bKey) - parseDateKey(aKey)) / 86400000)
}

// Longest consecutive streak of days that are all "complete" (habit-grid style)
export function longestStreak(completeDays) {
  if (!completeDays.length) return 0
  const sorted = [...completeDays].sort()
  let best = 1
  let cur = 1
  for (let i = 1; i < sorted.length; i++) {
    if (daysBetween(sorted[i - 1], sorted[i]) === 1) {
      cur++
    } else {
      best = Math.max(best, cur)
      cur = 1
    }
  }
  return Math.max(best, cur)
}

// Current contiguous streak ending at (or before) today
export function currentStreak(completeDays, today = todayKey()) {
  const set = new Set(completeDays)
  let streak = 0
  let cur = today
  if (!set.has(cur)) cur = addDateKey(cur, -1)
  while (set.has(cur)) {
    streak++
    cur = addDateKey(cur, -1)
  }
  return streak
}

export function weekdayOfDateKey(key) {
  return parseDateKey(key).getDay()
}

export function dayName(index) {
  return DAY_NAMES[index]
}

// Does a reminder's daysOfWeek include the given dateKey? ([] = every day)
export function appliesOnDateKey(reminder, dateKey) {
  if (!reminder.daysOfWeek || reminder.daysOfWeek.length === 0 || reminder.daysOfWeek.length === 7) return true
  return reminder.daysOfWeek.includes(weekdayOfDateKey(dateKey))
}
