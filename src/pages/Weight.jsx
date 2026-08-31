import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Plus, Trash2, Scale } from 'lucide-react'
import { useWeight } from '../hooks/useWeight'
import { useSettings } from '../hooks/useSettings'
import { todayKey, fmtDateShort } from '../utils/helpers'

const inputCls = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-base outline-none focus:border-flame-500 light:border-black/15 light:bg-white light:text-black'
const tooltipStyle = { background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#fff', fontSize: 12 }

export default function Weight() {
  const today = todayKey()
  const { settings } = useSettings()
  const { logs, latest, previous, add, remove } = useWeight()
  const [val, setVal] = useState('')

  const goal = settings?.goalWeight
  const units = settings?.units || 'kg'

  const data = logs.map((l) => ({ date: fmtDateShort(l.date), weight: l.weight, key: l.id }))

  const change = previous && latest ? latest.weight - previous.weight : null
  const toGo = goal != null && latest ? latest.weight - goal : null

  const trend =
    change == null
      ? 'Abhi do weigh-ins chahiye trend ke liye.'
      : change < 0
      ? `-${Math.abs(change).toFixed(1)} ${units} last week 📉`
      : change > 0
      ? `+${change.toFixed(1)} ${units} last week 📈`
      : 'Same as last week'

  async function submit() {
    if (!val) return
    if (navigator.vibrate) navigator.vibrate(5)
    await add(today, val)
    setVal('')
  }

  return (
    <div className="px-4 py-5 page-enter">
      <h1 className="mb-1 text-2xl font-extrabold">Weight ⚖️</h1>
      <p className="mb-4 text-sm opacity-60">Weekly weigh-in + progress graph.</p>

      {/* add */}
      <div className="mb-4 flex gap-2 card-enter">
        <input className={inputCls} placeholder={`Weight (${units})`} type="number" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} />
        <button onClick={submit} className="press-scale rounded-xl bg-flame-500 px-5 font-bold text-white active:scale-95 transition-transform"><Plus size={18} /></button>
      </div>

      {/* summary */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="card card-enter stagger-1 rounded-2xl p-3">
          <div className="text-xs opacity-60">Latest</div>
          <div className="text-2xl font-bold">{latest ? `${latest.weight} ${units}` : '—'}</div>
          <div className="text-xs text-flame-400">{trend}</div>
        </div>
        <div className="card card-enter stagger-2 rounded-2xl p-3">
          <div className="text-xs opacity-60">{goal != null ? `Goal (${toGo != null && toGo > 0 ? `${toGo.toFixed(1)} to go` : 'reached 🎉'})` : 'Goal set karo'}</div>
          <div className="text-2xl font-bold">{goal != null ? `${goal} ${units}` : '—'}</div>
        </div>
      </div>

      {/* chart */}
      <div className="mb-4 card card-enter stagger-3 rounded-2xl p-3">
        <h2 className="mb-2 text-sm font-bold opacity-80">Weight over time</h2>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm opacity-50">Pehla weight log karo — graph yahi bnega.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={tooltipStyle} />
              {goal != null && <ReferenceLine y={goal} stroke="#f59e0b" strokeDasharray="6 4" label={{ value: 'Goal', fill: '#f59e0b', fontSize: 11, position: 'insideTopRight' }} />}
              <Line type="monotone" dataKey="weight" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3, fill: '#38bdf8' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* history */}
      <h2 className="mb-2 text-lg font-bold">History</h2>
      {logs.length === 0 ? (
        <p className="py-4 text-center text-sm opacity-50">Abhi koi records nahi.</p>
      ) : (
        <ul className="space-y-2">
          {[...logs].reverse().map((l, i) => (
            <li key={l.id} className="card card-enter flex items-center gap-3 px-3 py-2.5" style={{ animationDelay: `${i * 0.05}s` }}>
              <Scale size={18} className="text-ice-400" />
              <span className="flex-1 font-medium">{l.weight} {units}</span>
              <span className="text-xs opacity-50">{fmtDateShort(l.date)}</span>
              <button onClick={() => remove(l.id)} className="p-1 text-white/40 hover:text-red-400 active:scale-90"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
