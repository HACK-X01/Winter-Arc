import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Droplets, UtensilsCrossed, Dumbbell, Scale, Flame, Bell, ChevronRight, Camera,
} from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { useWater } from '../hooks/useWater'
import { useMeals } from '../hooks/useMeals'
import { useExercise } from '../hooks/useExercise'
import { useWeight } from '../hooks/useWeight'
import { usePhoto } from '../hooks/usePhoto'
import { useReminders } from '../hooks/useReminders'
import { useDailyCompletion } from '../hooks/useDailyCompletion'
import { buildTimelineItems } from '../utils/notifications'
import {
  todayKey, dayIndexOf, longestStreak, currentStreak, appliesOnDateKey,
} from '../utils/helpers'
import DayTimeline from '../components/DayTimeline'
import ProgressBar from '../components/ProgressBar'
import ProgressRing from '../components/ProgressRing'
import Confetti from '../components/Confetti'
import QuickAddModal from '../components/QuickAddModal'

function HomeSkeleton() {
  return (
    <div className="px-4 py-5 page-enter">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="mb-2 h-7 w-40 skeleton" />
          <div className="h-4 w-52 skeleton" />
        </div>
        <div className="h-10 w-10 skeleton rounded-xl" />
      </div>
      <div className="mb-4 h-24 skeleton rounded-2xl" />
      <div className="mb-4 grid grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 skeleton rounded-2xl" />
        ))}
      </div>
      <div className="mb-4 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 skeleton rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const today = todayKey()
  const { settings } = useSettings()
  const water = useWater(today)
  const meals = useMeals(today)
  const exercise = useExercise(today)
  const weight = useWeight()
  const photo = usePhoto()
  const { reminders } = useReminders()
  const completion = useDailyCompletion()

  const [quickAdd, setQuickAdd] = useState(null)
  const [celebrate, setCelebrate] = useState(false)

  const timeline = useMemo(
    () => (settings ? buildTimelineItems(reminders, settings, today) : []),
    [reminders, settings, today]
  )

  const applicableToday = useMemo(
    () => reminders.filter((r) => r.enabled && appliesOnDateKey(r, today)),
    [reminders, today]
  )

  // Merge manual checkboxes with auto-detected completion from tracker data.
  // Logging a meal/workout/photo/weight auto-checks the matching reminder.
  const doneSet = useMemo(() => {
    const base = { ...(completion.byDate[today] || {}) }

    // Meal reminder -> auto-check when its category is logged
    const MEAL_REMINDER_MAP = {
      'Pre-workout Meal': 'Breakfast',
      'Post-workout Meal': 'Breakfast',
      'Mid-meal / Snack': 'Snacks',
      'Lunch': 'Lunch',
      'Dinner': 'Dinner',
    }
    const loggedCategories = new Set(meals.meals.map((m) => m.category))

    // Tracker data availability for today
    const exerciseLogged = exercise.exercises.length > 0
    const photoLogged = !!photo.getForDate(today)
    const weightLogged = weight.logs.some((l) => l.date === today)

    const EXERCISE_REMINDERS = new Set(['Gym Workout', 'Log Workout'])

    for (const r of applicableToday) {
      const cat = MEAL_REMINDER_MAP[r.name]
      if (cat && loggedCategories.has(cat)) {
        base[r.id] = true
      } else if (EXERCISE_REMINDERS.has(r.name) && exerciseLogged) {
        base[r.id] = true
      } else if (r.name === 'Daily Progress Photo' && photoLogged) {
        base[r.id] = true
      } else if (r.name === 'Weekly Weigh-in' && weightLogged) {
        base[r.id] = true
      }
    }
    return base
  }, [completion.byDate, today, applicableToday, meals.meals, exercise.exercises, photo, weight.logs])

  const choresDone = applicableToday.filter((r) => doneSet[r.id]).length
  const choresTotal = applicableToday.length
  const allChoresDone = choresTotal > 0 && choresDone === choresTotal

  // Water: sip = goal / number of daily checkpoints, so every notification
  // tap logs one sip and the daily goal fills exactly by the last one.
  const waterReminder = reminders.find((r) => r.name === 'Drink Water')
  const numSips = timeline.filter((t) => String(t.key).startsWith(waterReminder?.id + '-')).length || 16
  const sipMl = settings ? Math.round(settings.waterGoalMl / numSips) : 250

  const waterPct = settings?.waterGoalMl ? Math.round((water.totalMl / settings.waterGoalMl) * 100) : 0
  const exerciseDone = exercise.exercises.length > 0

  const dayIndex = settings ? dayIndexOf(settings.startDate, today) + 1 : 0
  const endDate = settings?.endDate
  const totalDays = endDate ? dayIndexOf(settings.startDate, endDate) + 1 : settings?.durationMonths * 30
  const daysLeft = endDate ? Math.max(0, dayIndexOf(today, endDate)) : 0
  const arcPct = totalDays ? Math.round((Math.min(dayIndex, totalDays) / totalDays) * 100) : 0

  const fullyCompletedDays = useMemo(
    () => completion.fullyCompletedDays(reminders),
    [completion, reminders]
  )
  const longest = longestStreak(fullyCompletedDays)
  const curStreak = currentStreak(fullyCompletedDays, today)

  const toggleChore = (rid) => {
    const next = !doneSet[rid]
    // Checking a water checkpoint = taking one sip -> log it toward the goal
    if (next && waterReminder && rid.startsWith(waterReminder.id + '-')) {
      water.add(sipMl)
    }
    completion.setDone(today, rid, next)
    if (next && choresDone + 1 === choresTotal) {
      setCelebrate(true)
      setTimeout(() => setCelebrate(false), 2600)
    }
  }

  if (!settings) return <HomeSkeleton />

  return (
    <div className="px-4 py-5">
      {celebrate && <Confetti />}

      {/* header */}
      <header className="mb-4 flex items-center justify-between page-enter">
        <div>
          <h1 className="text-2xl font-extrabold">Winter Arc 🔥</h1>
          <p className="text-sm opacity-60">Aaj: {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <Link to="/report" className="rounded-xl bg-white/5 p-2 hover:bg-white/10 active:scale-95 transition-transform">
          <Bell size={22} />
        </Link>
      </header>

      {/* winter arc progress */}
      <section className="mb-4 card card-enter rounded-2xl bg-gradient-to-br from-night-800 to-night-900 p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">🔥 Winter Arc Progress</span>
          <span className="opacity-60">Day {dayIndex}</span>
        </div>
        <div className="mb-1 flex justify-between text-xs opacity-70">
          <span>Day {dayIndex} of ~{totalDays}</span>
          <span>{daysLeft} days left</span>
        </div>
        <ProgressBar percent={arcPct} color="#f59e0b" glow />
      </section>

      {/* summary cards */}
      <section className="mb-4 grid grid-cols-2 gap-3">
        <SummaryCard
          icon={<Droplets className="text-ice-400" />}
          label="Pani"
          value={`${(water.totalMl / 1000).toFixed(1)}L`}
          sub={`/ ${(settings.waterGoalMl / 1000).toFixed(1)}L`}
          pct={waterPct}
          color="#38bdf8"
          onClick={() => setQuickAdd('water')}
          delay={0}
        />
        <SummaryCard
          icon={<UtensilsCrossed className="text-flame-400" />}
          label="Meals"
          value={String(meals.meals.length)}
          sub="logged"
          onClick={() => navigate('/meals')}
          delay={1}
        />
        <SummaryCard
          icon={<Dumbbell className="text-emerald-400" />}
          label="Exercise"
          value={exerciseDone ? '✅' : '—'}
          sub={exerciseDone ? `${exercise.exercises[0].durationMin} min` : 'abhi nahi'}
          onClick={() => navigate('/exercise')}
          delay={2}
        />
        <SummaryCard
          icon={<Flame className="text-red-400" />}
          label="Streak"
          value={String(curStreak)}
          sub={`${longest} best`}
          onClick={() => navigate('/progress')}
          delay={3}
        />
        <SummaryCard
          icon={<Camera className="text-violet-400" />}
          label="Photo Log"
          value="📸"
          sub="Roz ka photo"
          onClick={() => navigate('/gallery')}
          delay={4}
        />
      </section>

      {/* quick add */}
      <section className="mb-4 grid grid-cols-5 gap-2 card-enter stagger-5">
        <QuickBtn icon={<Plus />} label="Smart" onClick={() => setQuickAdd('smart')} />
        <QuickBtn icon={<Droplets />} label="Pani" onClick={() => setQuickAdd('water')} />
        <QuickBtn icon={<UtensilsCrossed />} label="Meal" onClick={() => setQuickAdd('meal')} />
        <QuickBtn icon={<Dumbbell />} label="Workout" onClick={() => setQuickAdd('exercise')} />
        <QuickBtn icon={<Scale />} label="Weight" onClick={() => setQuickAdd('weight')} />
      </section>

      {/* today's timeline */}
      <section className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold">Aaj ka Schedule</h2>
          <Link to="/reminders" className="flex items-center text-sm text-flame-400 active:scale-95 transition-transform">
            Manage <ChevronRight size={16} />
          </Link>
        </div>
        <div className="mb-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
          <span>Chores</span>
          <span className={allChoresDone ? 'font-bold text-flame-400' : ''}>
            {choresDone}/{choresTotal} {allChoresDone && '🎉'}
          </span>
        </div>
        <DayTimeline
          items={timeline}
          isDone={(key) => !!doneSet[key]}
          onToggle={toggleChore}
        />
      </section>

      <QuickAddModal quickAdd={quickAdd} onClose={() => setQuickAdd(null)} water={water} meals={meals} exercise={exercise} settings={settings} />
    </div>
  )
}

function SummaryCard({ icon, label, value, sub, pct, color, onClick, delay = 0 }) {
  return (
    <button onClick={onClick} className={`card card-enter stagger-${delay + 1} p-3 text-left`}>
      <div className="mb-1 flex items-center gap-2 text-sm opacity-70">
        {icon} <span>{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xl font-bold">{value}</div>
          {sub && <div className="text-[11px] opacity-50">{sub}</div>}
        </div>
        {typeof pct === 'number' && (
          <ProgressRing size={40} stroke={5} percent={pct} color={color} label={`${pct}%`} />
        )}
      </div>
    </button>
  )
}

function QuickBtn({ icon, label, onClick }) {
  return (
    <button
      onClick={() => {
        if (navigator.vibrate) navigator.vibrate(3)
        onClick()
      }}
      className="press-scale flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 py-3 text-xs hover:bg-white/10 transition"
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
