import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useMeals, MEAL_CATEGORIES } from '../hooks/useMeals'
import { todayKey, fmtDate, fmtTime12, addDateKey } from '../utils/helpers'

const inputCls = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-base outline-none focus:border-flame-500 light:border-black/15 light:bg-white light:text-black'

const CATEGORY_EMOJI = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Snacks: '🍪' }

export default function Meals() {
  const today = todayKey()
  const [date, setDate] = useState(today)
  const { meals, add, remove } = useMeals(date)

  const [category, setCategory] = useState('Breakfast')
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')

  const grouped = MEAL_CATEGORIES.map((c) => ({
    cat: c,
    list: meals.filter((m) => (m.category || 'Snacks') === c),
  }))

  const totalCal = meals.reduce((s, m) => s + (m.calories || 0), 0)

  async function submit() {
    if (!name.trim()) return
    if (navigator.vibrate) navigator.vibrate(5)
    await add({ date, category, name: name.trim(), calories: calories || null })
    setName('')
    setCalories('')
  }

  return (
    <div className="px-4 py-5 page-enter">
      <h1 className="mb-1 text-2xl font-extrabold">Meal Tracker 🍽️</h1>
      <p className="mb-4 text-sm opacity-60">Khana log karo, sab kuch yaad rahega.</p>

      {/* date switcher */}
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => setDate(addDateKey(date, -1))} className="press-scale rounded-xl bg-white/10 px-3 py-2">←</button>
        <div className="flex-1 text-center font-semibold">{fmtDate(date)}</div>
        <button onClick={() => setDate(addDateKey(date, 1))} disabled={date === today} className="press-scale rounded-xl bg-white/10 px-3 py-2 disabled:opacity-40">→</button>
      </div>

      {/* add form */}
      <div className="mb-5 card card-enter rounded-2xl p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {MEAL_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`press-scale rounded-full px-3 py-1.5 text-sm ${category === c ? 'bg-flame-500 text-white' : 'bg-white/10'}`}
            >
              {CATEGORY_EMOJI[c]} {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input className={inputCls + ' flex-1'} placeholder="Kya khaya?" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={inputCls + ' w-24'} placeholder="kcal" type="number" inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} />
        </div>
        <button onClick={submit} className="mt-2 w-full rounded-xl bg-flame-500 py-2.5 font-bold text-white active:scale-95 transition-transform">
          <Plus size={16} className="mr-1 inline" /> Add meal
        </button>
      </div>

      {totalCal > 0 && <p className="mb-3 text-sm opacity-70">Total: {totalCal} kcal</p>}

      {/* grouped list */}
      {grouped.map(({ cat, list }, sIdx) => (
        <section key={cat} className="mb-4">
          <h2 className="mb-1.5 font-bold opacity-80">{CATEGORY_EMOJI[cat]} {cat}</h2>
          {list.length === 0 ? (
            <p className="px-1 text-sm opacity-40">Kuch nahi khaya (ya log nahi kiya).</p>
          ) : (
            <ul className="space-y-1.5">
              {list.map((m, i) => (
                <li key={m.id} className="card card-enter flex items-center gap-2 px-3 py-2.5" style={{ animationDelay: `${(sIdx * 3 + i) * 0.05}s` }}>
                  <div className="flex-1">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs opacity-50">
                      {fmtTime12(m.time)}
                      {m.calories ? ` · ${m.calories} kcal` : ''}
                    </div>
                  </div>
                  <button onClick={() => remove(m.id)} className="p-1 text-white/40 hover:text-red-400 active:scale-90"><Trash2 size={16} /></button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
