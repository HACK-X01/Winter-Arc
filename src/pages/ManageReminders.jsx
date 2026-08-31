import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Pencil, Check } from 'lucide-react'
import { useReminders } from '../hooks/useReminders'
import Modal from '../components/Modal'
import { dayName } from '../utils/helpers'

const inputCls = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-base outline-none focus:border-flame-500 light:border-black/15 light:bg-white light:text-black'

const EMOJIS = ['💧', '📖', '🧼', '💪', '🍽️', '😴', '🏃', '🧘', '🥗', '💊', '✍️', '⏰']

const DAYS = [0, 1, 2, 3, 4, 5, 6]

export default function ManageReminders() {
  const navigate = useNavigate()
  const { reminders, add, update, toggle, remove } = useReminders()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(blankForm())

  function blankForm() {
    return { name: '', icon: '⏰', mode: 'time', time: '12:00', intervalHours: 2, daysOfWeek: [], enabled: true, message: '' }
  }

  function openNew() {
    setEditId(null)
    setForm(blankForm())
    setOpen(true)
  }

  function openEdit(r) {
    setEditId(r.id)
    setForm({
      name: r.name,
      icon: r.icon || '⏰',
      mode: r.intervalHours ? 'interval' : 'time',
      time: r.time || '12:00',
      intervalHours: r.intervalHours || 2,
      daysOfWeek: r.daysOfWeek || [],
      enabled: r.enabled,
      message: r.message || '',
    })
    setOpen(true)
  }

  async function submit() {
    if (!form.name.trim()) return
    if (navigator.vibrate) navigator.vibrate(5)
    const record = {
      name: form.name.trim(),
      icon: form.icon,
      enabled: form.enabled,
      daysOfWeek: form.daysOfWeek,
      message: form.message || undefined,
      time: form.mode === 'time' ? form.time : undefined,
      intervalHours: form.mode === 'interval' ? Number(form.intervalHours) : undefined,
    }
    if (editId != null) await update(editId, record)
    else await add(record)
    setOpen(false)
  }

  function toggleDay(d) {
    setForm((f) => {
      const has = f.daysOfWeek.includes(d)
      const next = has ? f.daysOfWeek.filter((x) => x !== d) : [...f.daysOfWeek, d]
      return { ...f, daysOfWeek: next }
    })
  }

  return (
    <div className="px-4 py-5 page-enter">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Reminders & Chores ⏰</h1>
        <button onClick={() => navigate(-1)} className="press-scale rounded-xl bg-white/5 px-3 py-2 text-sm active:scale-95 transition-transform">Back</button>
      </div>

      <button onClick={openNew} className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-flame-500 py-3 font-bold text-white active:scale-95 transition-transform">
        <Plus size={18} /> Naya reminder
      </button>

      {reminders.length === 0 ? (
        <p className="py-8 text-center text-sm opacity-50">Koi reminders nahi. Naya banao! 👆</p>
      ) : (
        <ul className="space-y-2">
          {reminders.map((r, i) => {
            const active = r.enabled && (!r.daysOfWeek || r.daysOfWeek.length === 0 || r.daysOfWeek.length === 7)
            const customDays = r.daysOfWeek && r.daysOfWeek.length > 0 && r.daysOfWeek.length < 7
            return (
              <li key={r.id} className={`card card-enter rounded-xl p-3 ${!r.enabled ? 'opacity-50' : ''}`} style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{r.icon || '⏰'}</span>
                  <div className="flex-1">
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs opacity-50">
                      {r.time ? `${r.time}` : `har ${r.intervalHours} ghante${r.intervalStart ? ` (${r.intervalStart}–${r.intervalEnd})` : ''}`}
                      {customDays ? ` · ${r.daysOfWeek.map(dayName).join(', ')}` : active ? '' : ''}
                      {!r.enabled ? ' · paused' : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(3)
                      toggle(r.id, !r.enabled)
                    }}
                    className={`relative h-6 w-11 rounded-full transition ${r.enabled ? 'bg-flame-500' : 'bg-white/15'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${r.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => openEdit(r)} className="press-scale flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs active:scale-95 transition-transform"><Pencil size={12} /> Edit</button>
                  <button onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(5)
                    remove(r.id)
                  }} className="press-scale flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs text-red-400 active:scale-95 transition-transform"><Trash2 size={12} /> Delete</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editId != null ? 'Edit reminder' : 'Naya reminder'}>
        <div className="space-y-3">
          <input className={inputCls} placeholder="Name (e.g. Face wash)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <div className="flex flex-wrap gap-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setForm({ ...form, icon: e })}
                className={`press-scale flex h-9 w-9 items-center justify-center rounded-lg text-xl ${form.icon === e ? 'bg-flame-500/30 ring-2 ring-flame-500' : 'bg-white/10'}`}
              >
                {e}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setForm({ ...form, mode: 'time' })}
              className={`press-scale rounded-xl py-2.5 text-sm transition ${form.mode === 'time' ? 'bg-flame-500 text-white' : 'bg-white/10'}`}
            >
              Fixed time
            </button>
            <button
              onClick={() => setForm({ ...form, mode: 'interval' })}
              className={`press-scale rounded-xl py-2.5 text-sm transition ${form.mode === 'interval' ? 'bg-flame-500 text-white' : 'bg-white/10'}`}
            >
              Repeat
            </button>
          </div>

          {form.mode === 'time' ? (
            <input type="time" className={inputCls + ' w-full'} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          ) : (
            <input
              type="number"
              min={0.5}
              step={0.5}
              className={inputCls}
              placeholder="Every X hours (e.g. 2)"
              value={form.intervalHours}
              onChange={(e) => setForm({ ...form, intervalHours: e.target.value })}
            />
          )}

          <div>
            <div className="mb-1 text-sm opacity-70">Days</div>
            <div className="flex gap-1.5">
              {DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={`press-scale h-9 w-9 rounded-lg text-xs font-bold transition ${form.daysOfWeek.includes(d) ? 'bg-flame-500 text-white' : 'bg-white/10'}`}
                >
                  {dayName(d).slice(0, 1)}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] opacity-50">Koi din select nahi = har roz.</p>
          </div>

          <input className={inputCls} placeholder="Custom message (optional, e.g. 'Paani pe lo!')" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        <button onClick={submit} className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl bg-flame-500 py-3 font-bold text-white active:scale-95 transition-transform">
          <Check size={18} /> Save reminder
        </button>
      </Modal>
    </div>
  )
}
