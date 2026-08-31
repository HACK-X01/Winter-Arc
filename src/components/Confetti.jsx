import { useMemo } from 'react'

const COLORS = [
  'var(--color-flame-400)',
  'var(--color-ice-400)',
  'var(--color-flame-500)',
  '#34d399',
  '#e879f9',
  '#f87171',
]

export default function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
        duration: 1.8 + Math.random() * 0.8,
      })),
    []
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
