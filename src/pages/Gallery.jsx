import { useMemo, useState } from 'react'
import { Camera, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePhoto } from '../hooks/usePhoto'
import { useSettings } from '../hooks/useSettings'
import { fmtDate, todayKey, dayIndexOf } from '../utils/helpers'
import PhotoCapture from '../components/PhotoCapture'

export default function Gallery() {
  const { photos, remove } = usePhoto()
  const { settings } = useSettings()
  const [captureFor, setCaptureFor] = useState(null)
  const [viewIdx, setViewIdx] = useState(-1)

  const photoForDate = useMemo(() => {
    const m = new Map()
    for (const p of photos) m.set(p.date, p)
    return m
  }, [photos])

  const grid = useMemo(() => {
    if (!settings) return []
    const startKey = settings.startDate
    const endKey = todayKey()
    const first = new Date(`${startKey}T00:00:00`)
    const gridStart = new Date(first)
    gridStart.setDate(first.getDate() - first.getDay())
    const cells = []
    const guard = new Date(gridStart)
    const end = new Date(`${endKey}T00:00:00`)
    let idx = 0
    while (idx < 365) {
      const pastEnd = guard.getTime() > end.getTime()
      if (pastEnd && cells.length % 7 === 0) break
      cells.push(dateKeyOf(guard))
      guard.setDate(guard.getDate() + 1)
      idx++
    }
    return cells
  }, [settings])

  const photosSorted = useMemo(() => [...photos].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)), [photos])
  const photoCount = photos.length
  const hasPhotoToday = !!photoForDate.get(todayKey())

  if (!settings) return null

  return (
    <div className="px-4 py-5 page-enter">
      <h1 className="text-2xl font-extrabold">Photo Log 📸</h1>
      <p className="mb-4 text-sm opacity-60">
        Winter Arc ke dauraan ek photo roz — progress visually dekho. Sab local, koi upload nahi.
      </p>

      {/* CTA */}
      <section className="mb-4 card card-enter rounded-2xl p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">{hasPhotoToday ? 'Aaj ka photo ho gaya! ✅' : 'Aaj ki photo leni hai!'}</div>
            <div className="text-xs opacity-50">{photoCount} photos logged · {settings.goalWeight ? `Day ${dayIndexOf(settings.startDate, todayKey()) + 1}` : ''}</div>
          </div>
          <button
            onClick={() => setCaptureFor(todayKey())}
            className="press-scale flex items-center gap-1 rounded-xl bg-flame-500 px-3 py-2 text-sm font-bold text-white active:scale-95 transition-transform"
          >
            <Camera size={16} /> Photo lo
          </button>
        </div>
      </section>

      {/* calendar grid */}
      <section className="mb-5 card card-enter stagger-2 rounded-2xl p-3">
        <h2 className="mb-2 text-sm font-bold opacity-80">Calendar</h2>
        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((k) => {
            const p = photoForDate.get(k)
            const isToday = k === todayKey()
            const beforeStart = settings && k < settings.startDate
            return (
              <button
                key={k}
                onClick={() => (p ? setViewIdx(photosSorted.findIndex((x) => x.id === p.id)) : setCaptureFor(k))}
                className={`group relative aspect-square overflow-hidden rounded-md transition-all ${
                  p ? '' : beforeStart ? 'bg-white/5' : 'bg-white/10 hover:bg-white/20'
                } ${isToday ? 'ring-2 ring-flame-500' : ''}`}
                title={k}
              >
                {p ? (
                  <img src={URL.createObjectURL(p.blob)} alt={k} className="h-full w-full object-cover" />
                ) : (
                  !beforeStart && <Camera size={14} className="absolute inset-0 m-auto text-white/30" />
                )}
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 text-[10px] opacity-50">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
        </div>
      </section>

      {/* full-screen viewer */}
      {viewIdx >= 0 && photosSorted[viewIdx] && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 modal-backdrop-enter">
          <div className="relative max-h-[70vh] w-full max-w-lg modal-sheet-enter">
            <img src={URL.createObjectURL(photosSorted[viewIdx].blob)} alt={photosSorted[viewIdx].date} className="max-h-[70vh] w-full object-contain" />
          </div>
          <div className="mt-2 text-white/70">{fmtDate(photosSorted[viewIdx].date)}</div>
          <div className="mt-4 flex items-center gap-6">
            <button onClick={() => setViewIdx(viewIdx - 1)} disabled={viewIdx <= 0} className="press-scale opacity-70 disabled:opacity-30"><ChevronLeft size={28} /></button>
            <button
              onClick={async () => {
                if (navigator.vibrate) navigator.vibrate(5)
                await remove(photosSorted[viewIdx].id)
                setViewIdx(-1)
              }}
              className="press-scale flex items-center gap-1 rounded-xl bg-red-500/20 px-4 py-2 text-red-300 active:scale-95 transition-transform"
            >
              <Trash2 size={16} /> Delete
            </button>
            <button onClick={() => setViewIdx(viewIdx + 1)} disabled={viewIdx >= photosSorted.length - 1} className="press-scale opacity-70 disabled:opacity-30"><ChevronRight size={28} /></button>
          </div>
          <button onClick={() => setViewIdx(-1)} className="mt-4 text-white/60">✕ Close</button>
        </div>
      )}

      {/* capture modal */}
      {captureFor && (
        <PhotoCapture dateKey={captureFor} onClose={() => setCaptureFor(null)} onSaved={() => setCaptureFor(null)} />
      )}
    </div>
  )
}

function dateKeyOf(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
