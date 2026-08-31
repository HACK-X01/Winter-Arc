import { useEffect, useState } from 'react'
import { Plus, Trash2, Dumbbell } from 'lucide-react'
import { useExercise, EXERCISE_TYPES } from '../hooks/useExercise'
import { getGymSplitForDate } from '../hooks/useReminders'
import { todayKey, fmtTime12, addDays, parseDateKey, toDateKey, dayName } from '../utils/helpers'

const inputCls = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-base outline-none focus:border-flame-500 light:border-black/15 light:bg-white light:text-black'

export default function Exercise() {
  const today = todayKey()
  const { exercises, add, remove, allExercises } = useExercise(today)
  const [all, setAll] = useState([])
  const [type, setType] = useState('Gym')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const split = getGymSplitForDate(today)
    if (split) setType(split)
  }, [today])

  useEffect(() => {
    allExercises().then(setAll)
  }, [allExercises, exercises])

  const workoutDays = new Set(all.map((e) => e.date))

  const weeks = []
  const start = addDays(parseDateKey(today), -41)
  for (let w = 0; w < 6; w++) {
    const row = []
    for (let d = 0; d < 7; d++) {
      row.push(addDays(start, w * 7 + d))
    }
    weeks.push(row)
  }

  async function submit() {
    if (!duration) return
    if (navigator.vibrate) navigator.vibrate(5)
    await add({ date: today, type, durationMin: duration, notes })
    setDuration('')
    setNotes('')
  }

  return (
    <div className="px-4 py-5 page-enter">
      <h1 className="mb-1 text-2xl font-extrabold">Exercise 💪</h1>
      <p className="mb-4 text-sm opacity-60">Har din thoda workout — streak banaye rakho.</p>

      {/* habit grid */}
      <section className="mb-5 card card-enter rounded-2xl p-3">
        <h2 className="mb-2 text-sm font-bold opacity-80">Last 6 weeks</h2>
        <div className="grid grid-cols-7 gap-1.5">
          {weeks.flat().map((d) => {
            const k = toDateKey(d)
            const hit = workoutDays.has(k)
            const isToday = k === today
            return (
              <div
                key={k}
                title={dayName(d.getDay())}
                className={`aspect-square rounded-md transition-all ${hit ? 'bg-flame-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]' : 'bg-white/10'} ${isToday ? 'ring-2 ring-ice-400' : ''}`}
              />
            )
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 text-[10px] opacity-50">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
        </div>
      </section>

      {/* add form */}
      <div className="mb-5 card card-enter stagger-2 rounded-2xl p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {EXERCISE_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`press-scale rounded-full px-3 py-1.5 text-sm ${type === t ? 'bg-flame-500 text-white' : 'bg-white/10'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input className={inputCls + ' flex-1'} placeholder="Duration (min)" type="number" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
        <input className={inputCls + ' mt-2'} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button onClick={submit} className="mt-2 w-full rounded-xl bg-flame-500 py-2.5 font-bold text-white active:scale-95 transition-transform">
          <Plus size={16} className="mr-1 inline" /> Add workout
        </button>
      </div>

      {/* today's list */}
      <h2 className="mb-2 text-lg font-bold">Aaj ka Workout</h2>
      {exercises.length === 0 ? (
        <p className="py-4 text-center text-sm opacity-50">Aaj koi workout nahi.</p>
      ) : (
        <ul className="space-y-2">
          {exercises.map((e, i) => (
            <li key={e.id} className="card card-enter flex items-center gap-3 px-3 py-2.5" style={{ animationDelay: `${i * 0.05}s` }}>
              <Dumbbell size={18} className="text-emerald-400" />
              <div className="flex-1">
                <div className="font-medium">{e.type} · {e.durationMin} min</div>
                {e.notes && <div className="text-xs opacity-50">{e.notes}</div>}
              </div>
              <span className="text-xs opacity-50">{fmtTime12(e.time)}</span>
              <button onClick={() => remove(e.id)} className="p-1 text-white/40 hover:text-red-400 active:scale-90"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
