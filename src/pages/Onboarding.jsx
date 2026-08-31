import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { saveSettings, put } from '../db/database'
import { useSettings } from '../hooks/useSettings'
import { DEFAULT_REMINDER_SUGGESTIONS } from '../hooks/useReminders'
import { requestPermission } from '../utils/notifications'
import { computeEndDate } from '../utils/helpers'

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium opacity-80">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs opacity-50">{hint}</span>}
    </label>
  )
}

const inputCls =
  'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white outline-none focus:border-flame-500 light:border-black/15 light:bg-white light:text-black'

const STEPS = [
  'Swagat', 'Dates', 'Weight', 'Goal', 'Pani', 'Schedule', 'Reminders',
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { refresh } = useSettings()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    startDate: '2026-09-01',
    durationMonths: 6,
    currentWeight: '57',
    goalWeight: '70',
    units: 'kg',
    waterGoalMl: 4000,
    wakeTime: '05:30',
    sleepTime: '22:30',
    weighInDay: 6,
  })
  const [reminders, setReminders] = useState(
    DEFAULT_REMINDER_SUGGESTIONS.map((r) => ({ ...r, daysOfWeek: r.daysOfWeek || [] }))
  )
  const endDate = computeEndDate(form.startDate, form.durationMonths)

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  async function requestNotifPermission() {
    const state = await requestPermission()
    return state
  }

  async function finish() {
    await saveSettings({
      ...form,
      currentWeight: form.currentWeight ? Number(form.currentWeight) : null,
      goalWeight: form.goalWeight ? Number(form.goalWeight) : null,
      endDate,
      theme: 'dark',
      onboardingComplete: true,
    })
    for (const r of reminders) {
      await put('reminders', r)
    }
    navigate('/', { replace: true })
    // Re-read settings so App re-gates off onboarding instead of showing stale state
    await refresh()
  }

  const next = async () => {
    if (step === 5) {
      const state = await requestNotifPermission()
      setNotifState(state)
    }
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  const [notifState, setNotifState] = useState('')

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-night-950 px-6 py-8 text-white">
      {/* progress dots */}
      <div className="mb-6 flex gap-1.5">
        {STEPS.map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-flame-500' : 'bg-white/15'}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-1 flex-col justify-center text-center">
          <Flame size={64} className="mx-auto mb-4 text-flame-500 flame-pulse" />
          <h1 className="text-3xl font-extrabold">Welcome to your Winter Arc 🔥</h1>
          <p className="mt-3 text-white/60">
            Agle 6 mahine — apna sabse disciplined version banane ka time. Sab kuch isi app me, sirf tere device par.
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col justify-center">
          <h2 className="mb-6 text-2xl font-bold">Challenge dates 🗓️</h2>
          <div className="space-y-4">
            <Field label="Start date" hint="Default: 1 September 2026">
              <input type="date" className={inputCls} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </Field>
            <Field label="Duration (months)" hint={`End date: ${endDate}`}>
              <input
                type="number"
                min={1}
                max={24}
                className={inputCls}
                value={form.durationMonths}
                onChange={(e) => set('durationMonths', Math.max(1, Number(e.target.value)))}
              />
            </Field>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col justify-center">
          <h2 className="mb-2 text-2xl font-bold">Current body weight ⚖️</h2>
          <p className="mb-6 text-sm text-white/50">Aaj ka weight — seedha start point.</p>
          <div className="flex gap-3">
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 72.5"
              className={inputCls}
              value={form.currentWeight}
              onChange={(e) => set('currentWeight', e.target.value)}
            />
            <select className={inputCls + ' w-28'} value={form.units} onChange={(e) => set('units', e.target.value)}>
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-1 flex-col justify-center">
          <h2 className="mb-6 text-2xl font-bold">Goal weight 🎯</h2>
          <input
            type="number"
            inputMode="decimal"
            placeholder={form.units === 'kg' ? 'e.g. 68' : 'e.g. 150'}
            className={inputCls}
            value={form.goalWeight}
            onChange={(e) => set('goalWeight', e.target.value)}
          />
          {form.currentWeight && form.goalWeight && (
            <p className="mt-3 text-sm text-flame-400">
              {form.units === 'kg' ? Number(form.goalWeight) - Number(form.currentWeight) : ''} to go
            </p>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-1 flex-col justify-center">
          <h2 className="mb-6 text-2xl font-bold">Daily water goal 💧</h2>
          <div className="grid grid-cols-3 gap-2">
            {[2000, 3000, 3500, 4000, 4500, 5000].map((ml) => (
              <button
                key={ml}
                onClick={() => set('waterGoalMl', ml)}
                className={`press-scale rounded-xl border px-2 py-3 text-sm font-medium transition ${
                  form.waterGoalMl === ml ? 'border-flame-500 bg-flame-500/20 text-flame-400' : 'border-white/15 bg-white/5'
                }`}
              >
                {ml / 1000}L
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="flex flex-1 flex-col justify-center">
          <h2 className="mb-6 text-2xl font-bold">Daily schedule & alerts ⏰</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Wake up">
                <input type="time" className={inputCls} value={form.wakeTime} onChange={(e) => set('wakeTime', e.target.value)} />
              </Field>
              <Field label="Sleep">
                <input type="time" className={inputCls} value={form.sleepTime} onChange={(e) => set('sleepTime', e.target.value)} />
              </Field>
            </div>
            <Field label="Weekly weigh-in day">
              <select className={inputCls} value={form.weighInDay} onChange={(e) => set('weighInDay', Number(e.target.value))}>
                <option value={0}>Ravivar (Sunday)</option>
                <option value={1}>Somvar (Monday)</option>
                <option value={2}>Mangalvar (Tuesday)</option>
                <option value={3}>Budhvar (Wednesday)</option>
                <option value={4}>Guruvar (Thursday)</option>
                <option value={5}>Shukravar (Friday)</option>
                <option value={6}>Shanivar (Saturday)</option>
              </select>
            </Field>
            <button
              onClick={() => requestNotifPermission()}
              className={`w-full rounded-xl border px-4 py-3 text-sm font-medium ${
                notifState === 'granted' ? 'border-flame-500 bg-flame-500/20 text-flame-400' : 'border-white/15 bg-white/5'
              }`}
            >
              {notifState === 'granted' ? '✅ Notifications on — dhanyavad!' : '🔔 Allow notifications (reminders ke liye)'}
            </button>
            <p className="text-xs text-white/40">
              Reminders sirf jaagne aur sone ke beech chalenge. Exact-time background alarms sab phones par guaranteed nahi hain — best effort.
            </p>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-1 text-2xl font-bold">Daily chores & reminders 📋</h2>
          <p className="mb-4 text-sm text-white/50">Ye teri daily habit list hai — baad me Settings se badal sakta hai.</p>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {reminders.map((r, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <span className="text-2xl">{r.icon}</span>
                <span className="flex-1">
                  <span className="block font-medium">{r.name}</span>
                  <span className="block text-xs opacity-50">
                    {r.time ? `at ${r.time}` : `har ${r.intervalHours} ghante${r.intervalStart ? ` (${r.intervalStart}–${r.intervalEnd})` : ''}`}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={r.enabled}
                  onChange={(e) => setReminders((rs) => rs.map((x, xi) => (xi === i ? { ...x, enabled: e.target.checked } : x)))}
                  className="h-5 w-5 accent-flame-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* nav buttons */}
      <div className="mt-8 flex items-center justify-between">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} className="press-scale flex items-center gap-1 rounded-xl px-4 py-3 text-white/70 active:scale-95 transition-transform">
            <ChevronLeft size={20} /> Back
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <button onClick={next} className="press-scale flex items-center gap-1 rounded-xl bg-flame-500 px-6 py-3 font-bold text-white active:scale-95 transition-transform">
            Next <ChevronRight size={20} />
          </button>
        ) : (
          <button onClick={finish} className="press-scale flex items-center gap-1 rounded-xl bg-flame-500 px-6 py-3 font-bold text-white active:scale-95 transition-transform">
            Shuru karo <Check size={20} />
          </button>
        )}
      </div>
    </div>
  )
}
