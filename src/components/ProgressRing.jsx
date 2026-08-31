import { useMemo } from 'react'

export default function ProgressRing({
  percent,
  size = 96,
  stroke = 10,
  color = '#f59e0b',
  trackColor = 'rgba(255,255,255,0.08)',
  label,
  sublabel,
}) {
  const filterId = useMemo(() => `glow-${Math.random().toString(36).slice(2, 8)}`, [])
  const pct = Math.max(0, Math.min(100, percent))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        {pct > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `url(#${filterId})`,
            }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold" style={{ fontSize: size / 4.4, color }}>
          {label}
        </span>
        {sublabel && <span className="text-[10px] opacity-60">{sublabel}</span>}
      </div>
    </div>
  )
}
