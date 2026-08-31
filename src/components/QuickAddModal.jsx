import { useState, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'
import Modal from './Modal'
import { useVoiceInput } from '../hooks/useVoiceInput'
import { useWeight } from '../hooks/useWeight'
import { MEAL_CATEGORIES } from '../hooks/useMeals'
import { EXERCISE_TYPES } from '../hooks/useExercise'
import { getGymSplitForDate } from '../hooks/useReminders'
import { todayKey } from '../utils/helpers'
import { parseNaturalLanguage, EXAMPLES } from '../utils/smartParser'

const inputCls =
  'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-base text-white outline-none focus:border-flame-500 light:border-black/15 light:bg-white light:text-black'

export default function QuickAddModal({ quickAdd, onClose, water, meals, exercise, settings }) {
  const today = todayKey()
  const weight = useWeight()

  // meal state
  const [category, setCategory] = useState('Breakfast')
  const [name, setName] = useState('')
  // exercise state — pre-fill with today's gym split
  const [type, setType] = useState(() => getGymSplitForDate(today) || 'Gym')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  // weight state
  const [weightVal, setWeightVal] = useState('')
  // smart natural-language input
  const [smart, setSmart] = useState('')
  const [smartErr, setSmartErr] = useState('')
  const voice = useVoiceInput((text) => {
    setSmart(text)
    setSmartErr('')
  })

  const reset = () => {
    setName(''); setDuration(''); setNotes(''); setWeightVal('')
  }

  // Parse natural language: "500ml water", "lunch 400 cal", "gym 45 min", "weight 70kg"
  async function runSmart() {
    if (!smart.trim()) return
    const parsed = parseNaturalLanguage(smart)
    switch (parsed.action) {
      case 'logWater':
        await water.add(parsed.amountMl)
        break
      case 'logMeal':
        await meals.add({ date: today, category: parsed.category, name: parsed.name, calories: parsed.calories })
        break
      case 'logExercise':
        await exercise.add({ date: today, type: parsed.type, durationMin: parsed.durationMin || 45, notes: parsed.notes || '' })
        break
      case 'logWeight':
        await weight.add(today, parsed.weight)
        break
      case 'createReminder':
        setSmartErr(`⏰ Reminder: '${parsed.name}'${parsed.time ? ` at ${parsed.time}` : ''} — Reminders page se confirm karo.`)
        return
      default:
        setSmartErr(parsed.error || 'Samajh nahi aaya. Examples try karo.')
        return
    }
    setSmart(''); setSmartErr(''); reset()
    onClose()
  }

  async function submit() {
    if (quickAdd === 'water') {
      await water.add(settings.waterGoalMl / 4 || 250)
    } else if (quickAdd === 'meal') {
      if (name.trim()) await meals.add({ date: today, category, name: name.trim() })
    } else if (quickAdd === 'exercise') {
      if (duration) await exercise.add({ date: today, type, durationMin: duration, notes })
    } else if (quickAdd === 'weight') {
      if (weightVal) await weight.add(today, weightVal)
    }
    reset()
    onClose()
  }

  const title = {
    smart: 'Smart add ✨',
    water: 'Pani add karo 💧',
    meal: 'Meal log karo 🍽️',
    exercise: 'Workout log karo 💪',
    weight: 'Weight log karo ⚖️',
  }[quickAdd]

  return (
    <Modal open={!!quickAdd} onClose={onClose} title={title}>
      {/* Smart natural-language + voice input — only when quickAdd === 'smart' */}
      {quickAdd === 'smart' && (
      <div className="mb-4 rounded-xl border border-flame-500/30 bg-flame-500/5 p-3">
        <div className="flex gap-2">
          <input
            className={inputCls + ' flex-1 text-sm'}
            placeholder='Bolo ya likho — "500ml water", "lunch 400 cal", "gym 45 min"'
            value={smart}
            onChange={(e) => { setSmart(e.target.value); setSmartErr('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') runSmart() }}
          />
          <button
            onClick={voice.listening ? voice.stop : voice.start}
            disabled={!voice.supported}
            title={!voice.supported ? 'Voice is browser me supported nahi' : voice.listening ? 'Rok do' : 'Bolo'}
            className={`rounded-xl px-3 ${voice.listening ? 'bg-red-500 text-white' : 'bg-white/10 text-white/70'}`}
          >
            {voice.listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button onClick={runSmart} className="rounded-xl bg-flame-500 px-4 font-bold text-white">Go</button>
        </div>
        {voice.listening && <p className="mt-1.5 text-xs text-flame-400">🎙️ Sun raha hoon... bolo!</p>}
        {voice.error && <p className="mt-1.5 text-xs text-red-300">{voice.error}</p>}
        {smartErr && <p className="mt-1.5 text-xs text-red-300">{smartErr}</p>}
        <p className="mt-2 text-[10px] opacity-50">
          Try: {EXAMPLES.slice(0, 4).join(' · ')}
        </p>
      </div>
      )}

      {quickAdd === 'water' && (
        <div className="grid grid-cols-3 gap-2">
          {[settings.waterGoalMl / 8, settings.waterGoalMl / 4, settings.waterGoalMl / 2].map((ml, i) => (
            <button
              key={i}
              onClick={async () => { await water.add(ml); onClose() }}
              className="press-scale rounded-xl bg-flame-500/20 py-4 text-lg font-bold text-flame-400 hover:bg-flame-500/30"
            >
              +{Math.round(ml)}ml
            </button>
          ))}
        </div>
      )}

      {quickAdd === 'meal' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {MEAL_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`press-scale rounded-full px-3 py-1.5 text-sm ${category === c ? 'bg-flame-500 text-white' : 'bg-white/10'}`}
              >
                {c}
              </button>
            ))}
          </div>
          <input className={inputCls} placeholder="Kya khaya? (e.g. Dal chawal)" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      )}

      {quickAdd === 'exercise' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
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
          <input className={inputCls} placeholder="Duration (minutes)" type="number" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} />
          <input className={inputCls} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      )}

      {quickAdd === 'weight' && (
        <div className="space-y-3">
          <input className={inputCls} placeholder={`Weight (${settings.units})`} type="number" inputMode="decimal" value={weightVal} onChange={(e) => setWeightVal(e.target.value)} />
        </div>
      )}

      {quickAdd !== 'water' && (
        <button onClick={submit} className="mt-4 w-full rounded-xl bg-flame-500 py-3 font-bold text-white active:scale-95 transition-transform">
          Save karo
        </button>
      )}
    </Modal>
  )
}
