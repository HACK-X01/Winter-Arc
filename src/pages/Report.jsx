import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, UtensilsCrossed, Dumbbell, ClipboardCheck, PenLine, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { useWater } from '../hooks/useWater'
import { useMeals } from '../hooks/useMeals'
import { useExercise } from '../hooks/useExercise'
import { useReminders } from '../hooks/useReminders'
import { useDailyCompletion } from '../hooks/useDailyCompletion'
import { useWeight } from '../hooks/useWeight'
import { useDailyReports } from '../hooks/useDailyReports'
import { todayKey, addDateKey, appliesOnDateKey, fmtDate, dayIndexOf } from '../utils/helpers'
import ProgressRing from '../components/ProgressRing'
import { showLocalNotification } from '../utils/notifications'

const inputCls = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-base outline-none focus:border-flame-500 light:border-black/15 light:bg-white light:text-black'

export default function Report() {
  const navigate = useNavigate()
  const today = todayKey()
  const [date, setDate] = useState(today)
  const { settings } = useSettings()
  const water = useWater(date)
  const meals = useMeals(date)
  const exercise = useExercise(date)
  const { reminders } = useReminders()
  const completion = useDailyCompletion()
  const weight = useWeight()
  const reports = useDailyReports()
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  const goal = settings?.waterGoalMl || 3000
  const waterPct = goal ? Math.min(100, Math.round((water.totalMl / goal) * 100)) : 0

  const applicable = reminders.filter((r) => r.enabled && appliesOnDateKey(r, date))
  const doneMap = completion.byDate[date] || {}
  const choresDone = applicable.filter((r) => doneMap[r.id]).length
  const choresTotal = applicable.length
  const chorePct = choresTotal ? Math.round((choresDone / choresTotal) * 100) : 100

  const mealCount = meals.meals.length
  const mealPct = Math.min(100, Math.round((mealCount / 4) * 100))

  const exerciseDone = exercise.exercises.length > 0
  const exercisePct = exerciseDone ? 100 : 0

  const dayScore = Math.round((waterPct + mealPct + exercisePct + chorePct) / 4)
  const ex = exercise.exercises[0]

  const dayNum = settings ? dayIndexOf(settings.startDate, date) + 1 : null

  const weightEntry = weight.logs.find((l) => l.date === date)
  const weightChange = weightEntry
    ? (() => {
        const idx = weight.logs.findIndex((l) => l.date === date)
        const prev = weight.logs[idx - 1]
        return prev ? weightEntry.weight - prev.weight : null
      })()
    : null

  useEffect(() => {
    reports.getByDate(date).then((r) => {
      setNote(r?.note || '')
      setSaved(!!r)
    })
  }, [date])

  async function saveReport() {
    if (navigator.vibrate) navigator.vibrate(5)
    await reports.save({
      date,
      waterPct,
      meals: { count: mealCount, list: meals.meals.map((m) => m.name) },
      exercise: { done: exerciseDone, type: ex?.type || null, durationMin: ex?.durationMin || 0 },
      chores: { completed: choresDone, total: choresTotal },
      dayScore,
      note,
      weight: weightEntry ? { weight: weightEntry.weight, change: weightChange } : null,
    })
    setSaved(true)
  }

  async function pushNotification() {
    await saveReport()
    await showLocalNotification(
      `📊 Day ${dayNum || '?'} report ready!`,
      `${dayScore}% complete 🔥`,
      '/report'
    )
  }

  const grade = dayScore >= 90 ? '🔥 A-Zoned' : dayScore >= 75 ? '💪 Solid' : dayScore >= 50 ? '📈 Theek thaak' : '🌱 Shuru ho gaya'

  return (
    <div className="px-4 py-5 page-enter">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Daily Report 📊</h1>
        <button onClick={() => navigate('/')} className="press-scale rounded-xl bg-white/5 px-3 py-2 text-sm active:scale-95 transition-transform">Home</button>
      </div>

      {/* date switcher */}
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => setDate(addDateKey(date, -1))} className="press-scale rounded-xl bg-white/10 p-2 active:scale-90 transition-transform"><ChevronLeft size={18} /></button>
        <div className="flex-1 text-center font-semibold">{fmtDate(date)} {date === today && '(Aaj)'}</div>
        <button onClick={() => setDate(addDateKey(date, 1))} disabled={date === today} className="press-scale rounded-xl bg-white/10 p-2 disabled:opacity-40 active:scale-90 transition-transform"><ChevronRight size={18} /></button>
      </div>

      {/* score */}
      <div className="mb-4 card card-enter flex flex-col items-center bg-gradient-to-br from-night-800 to-night-900 py-6">
        <ProgressRing percent={dayScore} size={150} stroke={12} color="#f59e0b" label={`${dayScore}%`} sublabel="day score" />
        <div className="mt-3 text-lg font-bold">{dayNum != null ? `Day ${dayNum}` : ''} · {grade}</div>
      </div>

      {/* breakdown */}
      <div className="mb-4 space-y-2">
        <Row icon={<Droplets className="text-ice-400" />} label="Water" detail={`${(water.totalMl / 1000).toFixed(2)}L / ${(goal / 1000).toFixed(1)}L`} pct={waterPct} />
        <Row icon={<UtensilsCrossed className="text-flame-400" />} label="Meals" detail={`${mealCount} logged`} pct={mealPct} showList={meals.meals.map((m) => m.name)} />
        <Row icon={<Dumbbell className="text-emerald-400" />} label="Exercise" detail={exerciseDone ? `${ex.type} · ${ex.durationMin} min` : 'Nahi kiya'} pct={exercisePct} />
        <Row icon={<ClipboardCheck className="text-violet-400" />} label="Chores" detail={`${choresDone}/${choresTotal} done ${choresTotal && choresDone === choresTotal ? '🎉' : ''}`} pct={chorePct} />
        {weightEntry && (
          <div className="card flex items-center gap-3 p-3">
            <span className="text-xl">⚖️</span>
            <div className="flex-1">
              <div className="text-sm opacity-60">Weight (weigh-in)</div>
              <div className="font-bold">{weightEntry.weight} {settings.units}{weightChange != null ? ` (${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)})` : ''}</div>
            </div>
          </div>
        )}
      </div>

      {/* note */}
      <div className="mb-4 card card-enter rounded-2xl p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold opacity-80"><PenLine size={16} /> Aaj ki reflection (optional)</div>
        <textarea className={inputCls + ' min-h-[70px]'} placeholder="e.g. aaj energy low thi, gym skip kiya..." value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="flex gap-2">
        <button onClick={saveReport} className="flex-1 rounded-xl bg-flame-500 py-3 font-bold text-white active:scale-95 transition-transform">
          {saved ? 'Saved ✓' : 'Save Report'}
        </button>
        <button onClick={pushNotification} className="press-scale rounded-xl bg-white/10 px-4 py-3 font-bold active:scale-95 transition-transform">
          🔔 Notify
        </button>
      </div>

      {/* history */}
      <section className="mt-6">
        <h2 className="mb-2 text-lg font-bold">Report History</h2>
        {reports.reports.length === 0 ? (
          <p className="py-4 text-center text-sm opacity-50">Abhi koi reports nahi. Aaj ka save karo.</p>
        ) : (
          <ul className="space-y-2">
            {reports.reports.map((r, i) => (
              <li key={r.date} className="card card-enter flex items-center gap-3 px-3 py-2.5" style={{ animationDelay: `${i * 0.05}s` }}>
                <ProgressRing size={38} stroke={5} percent={r.dayScore} color="#f59e0b" label={`${r.dayScore}%`} />
                <button
                  onClick={() => setDate(r.date)}
                  className="flex-1 text-left"
                >
                  <div className="font-medium">{fmtDate(r.date)}</div>
                  <div className="text-xs opacity-50">
                    {r.waterPct}% pani · {r.meals?.count} meals · {r.chores?.completed}/{r.chores?.total} chores
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Row({ icon, label, detail, pct, showList }) {
  return (
    <div className="card flex items-center gap-3 p-3">
      {icon}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{label}</span>
          <span className="text-sm opacity-70">{detail}</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-flame-500" style={{ width: `${pct}%`, transition: 'width 0.7s ease-out' }} />
        </div>
      </div>
      {showList && showList.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {showList.map((n, i) => <span key={i} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{n}</span>)}
        </div>
      )}
    </div>
  )
}
