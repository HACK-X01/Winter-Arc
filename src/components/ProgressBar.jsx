// Linear progress bar with optional glow effect
export default function ProgressBar({
  percent,
  color = '#f59e0b',
  trackColor = 'rgba(255,255,255,0.1)',
  height = 8,
  glow = false,
  className = '',
}) {
  const pct = Math.max(0, Math.min(100, percent))
  return (
    <div className={`w-full overflow-hidden rounded-full ${className}`} style={{ height, background: trackColor }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: color,
          transition: 'width 0.7s ease-out',
          boxShadow: glow ? `0 0 12px ${color}66` : undefined,
        }}
      />
    </div>
  )
}
