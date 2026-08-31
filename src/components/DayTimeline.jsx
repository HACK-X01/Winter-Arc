import { timeToMinutes, fmtTime12 } from '../utils/helpers'
import { Check, CheckCircle2 } from 'lucide-react'

export default function DayTimeline({ items, isDone, onToggle, emptyText = 'Aaj koi reminders nahi hain.' }) {
  const sorted = [...items].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
  const nowMin = timeToMinutes(new Date().toTimeString().slice(0, 5))

  if (!sorted.length) {
    return <p className="py-8 text-center text-sm opacity-60">{emptyText}</p>
  }

  return (
    <div className="relative ml-3 border-l-2 border-white/10 pl-5">
      {sorted.map((item, idx) => {
        const done = isDone(item.key)
        const past = timeToMinutes(item.time) <= nowMin
        return (
          <div
            key={item.key}
            className="relative mb-4 card-enter"
            style={{ animationDelay: `${idx * 0.06}s` }}
          >
            {/* node on the timeline */}
            <span
              className={`absolute -left-[29px] top-1 h-5 w-5 rounded-full border-2 transition-all ${
                done
                  ? 'border-flame-500 bg-flame-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                  : past
                    ? 'border-white/40 bg-white/10'
                    : 'border-white/30 bg-transparent'
              }`}
            />
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(3)
                onToggle(item.key)
              }}
              className={`press-scale flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                done ? 'bg-white/5 opacity-60' : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <span className="text-2xl">{item.icon || '⏰'}</span>
              <span className="flex-1">
                <span className={`block font-semibold ${done ? 'line-through' : ''}`}>{item.name}</span>
                <span className="block text-xs opacity-60">{fmtTime12(item.time)}</span>
              </span>
              {done ? (
                <CheckCircle2 className="text-flame-500 animate-pop" size={24} />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-white/30">
                  <Check size={16} className="opacity-0" />
                </span>
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}
