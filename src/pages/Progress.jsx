import { useEffect, useMemo, useState } from 'react'
import { Flame, Trophy, Droplets } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { useReminders } from '../hooks/useReminders'
import { useDailyCompletion } from '../hooks/useDailyCompletion'
import { useWeight } from '../hooks/useWeight'
import { getAll } from '../db/database'
import {
  todayKey, dayIndexOf, addDateKey, longestStreak, currentStreak,
  parseDateKey, toDateKey, addDays,
} from '../utils/helpers'
import ProgressRing from '../components/ProgressRing'
import ProgressBar from '../components/ProgressBar'

export default function Progress() {
  const today = todayKey()
  const { settings } = useSettings()
  const { reminders } = useReminders()
  const completion = useDailyCompletion()
  const weight = useWeight()
  const [weekData, setWeekData] = useState(null)

  useEffect(() => {
    async function load() {
      const [waterRecs, mealRecs, exRecs] = await Promise.all([
        getAll('waterLogs'),
        getAll('meals'),
        getAll('exercises'),
      ])
      const goal = settings?.waterGoalMl || 3000
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = addDateKey(today, -i)
        const water = waterRecs.find((w) => w.date === d)
        const waterTotal = (water?.entries || []).reduce((s, e) => s + e.amountMl, 0)
        days.push({
          date: d,
          waterPct: Math.min(100, Math.round((waterTotal / goal) * 100)),
          meals: mealRecs.filter((m) => m.date === d).length,
          exercise: exRecs.some((e) => e.date === d),
        })
      }
      setWeekData(days)
    }
    if (settings) load()
  }, [settings, today, completion.records])

  const fullyCompletedDays = useMemo(() => completion.fullyCompletedDays(reminders), [completion, reminders])
  const longest = longestStreak(fullyCompletedDays)
  const curStreak = currentStreak(fullyCompletedDays, today)

  const startW = settings?.currentWeight
  const startWLog = weight.logs[0]
  const weightChange = startW != null ? (weight.latest?.weight ?? startW) - startW : startWLog ? weight.latest.weight - startWLog.weight : null

  const totalDays = settings?.endDate ? dayIndexOf(settings.startDate, settings.endDate) + 1 : settings?.durationMonths * 30
  const dayIndex = settings ? Math.min(dayIndexOf(settings.startDate, today) + 1, totalDays) : 0
  const arcPct = totalDays ? Math.round((dayIndex / totalDays) * 100) : 0

  const gridWeeks = useMemo(() => {
    const start = addDays(parseDateKey(today), -41)
    const rows = []
    for (let w = 0; w < 6; w++) {
      const row = []
      for (let d = 0; d < 7; d++) row.push(toDateKey(addDays(start, w * 7 + d)))
      rows.push(row)
    }
    return rows
  }, [today])

  const doneSetAll = new Set(fullyCompletedDays)
  const choresCompleteOn = (k) => doneSetAll.has(k)

  const waterHit = weekData ? weekData.filter((d) => d.waterPct >= 75).length : 0
  const mealTotal = weekData ? weekData.reduce((s, d) => s + d.meals, 0) : 0
  const workoutDays = weekData ? weekData.filter((d) => d.exercise).length : 0

  if (!settings) return null

  return (
    <div className="px-4 py-5 page-enter">
      <h1 className="mb-4 text-2xl font-extrabold">Progress & Stats 📈</h1>

      {/* overall arc */}
      <section className="mb-4 card card-enter flex items-center gap-4 bg-gradient-to-br from-night-800 to-night-900 p-4">
        <ProgressRing percent={arcPct} size={96} stroke={10} color="#f59e0b" label={`${arcPct}%`} sublabel="arc" />
        <div>
          <div className="font-bold">🔥 Day {dayIndex} / {totalDays}</div>
          <div className="text-sm opacity-60">
            {settings.endDate ? `${Math.max(0, dayIndexOf(today, settings.endDate))} days left` : ''}
          </div>
          <div className="mt-1 text-sm text-flame-400">
            {weightChange != null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} ${settings.units} since start` : 'Weight log karo'}
          </div>
        </div>
      </section>

      {/* streak cards */}
      <section className="mb-4 grid grid-cols-2 gap-3">
        <Stat icon={<Flame className="text-flame-400" />} label="Current streak" value={String(curStreak)} delay={1} />
        <Stat icon={<Trophy className="text-amber-400" />} label="Longest streak" value={String(longest)} delay={2} />
      </section>

      {/* habit grid */}
      <section className="mb-4 card card-enter stagger-3 rounded-2xl p-3">
        <h2 className="mb-2 text-sm font-bold opacity-80">Chore completion (last 6 weeks)</h2>
        <div className="grid grid-cols-7 gap-1.5">
          {gridWeeks.flat().map((k) => (
            <div
              key={k}
              title={k}
              className={`aspect-square rounded-md transition-all ${choresCompleteOn(k) ? 'bg-flame-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]' : 'bg-white/10'} ${k === today ? 'ring-2 ring-ice-400' : ''}`}
            />
          ))}
        </div>
        <div className="mt-2 flex gap-3 text-[10px] opacity-50">
          {['S','M','T','W','T','F','S'].map((d,i) => <span key={i}>{d}</span>)}
        </div>
      </section>

      {/* weekly summary */}
      <section className="card card-enter stagger-4 rounded-2xl p-4">
        <h2 className="mb-3 text-sm font-bold opacity-80">Last 7 days summary</h2>
        {weekData && (
          <>
            <SummaryLine label="Pani target hit" value={`${waterHit}/7 days`} pct={Math.round((waterHit / 7) * 100)} color="#38bdf8" />
            <SummaryLine label="Meals logged" value={`${mealTotal} total`} pct={Math.min(100, (mealTotal / 28) * 100)} color="#f59e0b" />
            <SummaryLine label="Workout days" value={`${workoutDays}/7 days`} pct={Math.round((workoutDays / 7) * 100)} color="#34d399" />
            <p className="mt-3 flex items-center gap-2 text-xs text-ice-400"><Droplets size={14} /> Water target: {settings.waterGoalMl / 1000}L/day</p>
          </>
        )}
      </section>
    </div>
  )
}

function Stat({ icon, label, value, delay = 0 }) {
  return (
    <div className={`card card-enter stagger-${delay} rounded-2xl p-3 text-center`}>
      <div className="mx-auto mb-1 flex justify-center">{icon}</div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs opacity-60">{label}</div>
    </div>
  )
}

function SummaryLine({ label, value, pct, color }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="opacity-70">{value}</span>
      </div>
      <ProgressBar percent={pct} color={color} height={6} glow />
    </div>
  )
}
