import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useMeals, MEAL_CATEGORIES } from '../hooks/useMeals'
import { todayKey, fmtDate, fmtTime12, addDateKey } from '../utils/helpers'

const CATEGORY_EMOJI = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Snacks: '🍪' }

const QUICK_MEALS = {
  Breakfast: [' chai', ' bread', ' eggs', ' poha', ' dosa', ' paratha'],
  Lunch: [' dal-rice', ' sabzi-roti', ' rajma', ' biryani', ' maggi', ' salad'],
  Dinner: [' roti-sabzi', ' rice-dal', ' soup', ' sandwich', ' pasta', ' chapati'],
  Snacks: [' namkeen', ' fruit', ' dry fruits', ' chips', ' biscuit', ' juice'],
}

export default function Meals() {
  const today = todayKey()
  const [date, setDate] = useState(today)
  const { meals, add, remove } = useMeals(date)

  const [category, setCategory] = useState('Breakfast')
  const [name, setName] = useState('')

  const grouped = MEAL_CATEGORIES.map((c) => ({
    cat: c,
    list: meals.filter((m) => (m.category || 'Snacks') === c),
  }))

  async function submit() {
    if (!name.trim()) return
    if (navigator.vibrate) navigator.vibrate(5)
    await add({ date, category, name: name.trim() })
    setName('')
  }

  function quickAdd(mealName) {
    if (navigator.vibrate) navigator.vibrate(5)
    add({ date, category, name: mealName.trim() })
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

      {/* category pills */}
      <div className="mb-3 flex flex-wrap gap-1.5">
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

      {/* quick meal buttons */}
      <div className="mb-3 card card-enter rounded-2xl p-3">
        <p className="mb-2 text-xs opacity-50">Quick add — tap to log instantly:</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_MEALS[category].map((meal) => (
            <button
              key={meal}
              onClick={() => quickAdd(meal)}
              className="press-scale rounded-full bg-white/10 px-3 py-1.5 text-sm active:bg-flame-500/30 transition"
            >
              {meal}
            </button>
          ))}
        </div>
      </div>

      {/* manual add */}
      <div className="mb-5 card card-enter rounded-2xl p-3">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-base outline-none focus:border-flame-500 light:border-black/15 light:bg-white light:text-black"
            placeholder="Ya likho kya khaya..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <button onClick={submit} className="press-scale shrink-0 rounded-xl bg-flame-500 px-4 py-2.5 font-bold text-white active:scale-95 transition-transform">
            <Plus size={18} />
          </button>
        </div>
      </div>

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
                    <div className="text-xs opacity-50">{fmtTime12(m.time)}</div>
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
