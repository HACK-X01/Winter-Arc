import { useState } from 'react'
import { Plus, Trash2, Droplets } from 'lucide-react'
import { useWater } from '../hooks/useWater'
import { useSettings } from '../hooks/useSettings'
import { todayKey, fmtTime12 } from '../utils/helpers'
import ProgressRing from '../components/ProgressRing'
import Modal from '../components/Modal'

const inputCls = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-base outline-none focus:border-flame-500 light:border-black/15 light:bg-white light:text-black'

export default function Water() {
  const today = todayKey()
  const { settings } = useSettings()
  const water = useWater(today)
  const [customOpen, setCustomOpen] = useState(false)
  const [custom, setCustom] = useState('')

  const goal = settings?.waterGoalMl || 3000
  const pct = goal ? Math.min(100, Math.round((water.totalMl / goal) * 100)) : 0
  const remaining = Math.max(0, goal - water.totalMl)

  const quickOptions = [goal / 4, goal / 8, goal / 2]

  return (
    <div className="px-4 py-5 page-enter">
      <h1 className="mb-1 text-2xl font-extrabold">Pani Tracker 💧</h1>
      <p className="mb-5 text-sm opacity-60">Aaj ka target: {(goal / 1000).toFixed(1)}L</p>

      {/* progress ring */}
      <div className="mb-5 card card-enter flex flex-col items-center py-6">
        <ProgressRing percent={pct} size={150} stroke={12} color="#38bdf8" label={`${pct}%`} sublabel="target" />
        <div className="mt-4 text-center">
          <div className="text-2xl font-bold">{(water.totalMl / 1000).toFixed(2)}L</div>
          <div className="text-sm opacity-60">{remaining > 0 ? `${(remaining / 1000).toFixed(2)}L baaki` : 'Ho gaya! 🎉'}</div>
        </div>
      </div>

      {/* quick add */}
      <div className="mb-6 grid grid-cols-3 gap-2 card-enter stagger-2">
        {quickOptions.map((ml, i) => (
          <button
            key={i}
            onClick={() => { if (navigator.vibrate) navigator.vibrate(3); water.add(ml) }}
            className="press-scale rounded-xl bg-ice-500/20 py-4 text-lg font-bold text-ice-400 hover:bg-ice-500/30"
          >
            +{Math.round(ml)}ml
          </button>
        ))}
      </div>
      <button
        onClick={() => setCustomOpen(true)}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-3 text-sm opacity-80 press-scale"
      >
        <Plus size={16} /> Custom amount
      </button>

      {/* today's log */}
      <h2 className="mb-2 text-lg font-bold">Aaj ka Log</h2>
      {water.entries.length === 0 ? (
        <p className="py-6 text-center text-sm opacity-50">Abhi koi paani log nahi hua.</p>
      ) : (
        <ul className="space-y-2">
          {water.entries.map((e, i) => (
            <li key={i} className="card card-enter flex items-center gap-3 px-3 py-2.5" style={{ animationDelay: `${i * 0.05}s` }}>
              <Droplets size={18} className="text-ice-400" />
              <span className="flex-1 font-medium">+{(e.amountMl / 1000).toFixed(2)}L</span>
              <span className="text-xs opacity-50">{fmtTime12(e.time)}</span>
              <button onClick={() => water.remove(i)} className="p-1 text-white/40 hover:text-red-400 active:scale-90">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={customOpen} onClose={() => setCustomOpen(false)} title="Custom paani">
        <div className="flex gap-2">
          <input
            className={inputCls}
            placeholder="ml (e.g. 300)"
            type="number"
            inputMode="numeric"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <button
            onClick={() => { if (custom) { if (navigator.vibrate) navigator.vibrate(5); water.add(Number(custom)); setCustom(''); setCustomOpen(false) } }}
            className="rounded-xl bg-flame-500 px-5 font-bold text-white active:scale-95 transition-transform"
          >
            Add
          </button>
        </div>
      </Modal>
    </div>
  )
}
