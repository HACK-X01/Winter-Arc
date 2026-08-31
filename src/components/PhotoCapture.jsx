import { useRef, useState } from 'react'
import Modal from './Modal'
import { usePhoto } from '../hooks/usePhoto'
import { fmtDate, todayKey } from '../utils/helpers'
import { compressImage } from '../utils/imageCompress'

// Camera/upload screen for the daily progress photo.
// Uses <input type="file" accept="image/*" capture> which on mobile opens the camera,
// on desktop opens a file picker. Reads as a Blob and saves to IndexedDB.
export default function PhotoCapture({ dateKey, onClose, onSaved }) {
  const { add } = usePhoto()
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const isToday = dateKey === todayKey()

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      setBusy(true)
      const blob = await compressImage(file)
      setPreview(URL.createObjectURL(blob))
      await add(blob, dateKey)
      setTimeout(() => {
        onSaved()
      }, 600)
    } catch (err) {
      console.error('Photo save failed:', err)
      setError('❌ Photo save nahi ho payi — storage full ho sakta hai. Browser data clear karo aur try again.')
      setBusy(false)
    }
  }

  function openPicker() {
    inputRef.current?.click()
  }

  return (
    <Modal open title={isToday ? 'Aaj ki photo 📸' : `${fmtDate(dateKey)} ki photo 📸`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm opacity-60">
          Same angle, same lighting — consistency se hi progress dikhega. Photo sirf tere device par save hoti hai.
        </p>

        <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

        {preview ? (
          <img src={preview} alt="preview" className="max-h-72 w-full rounded-xl object-cover" />
        ) : (
          <button
            onClick={openPicker}
            disabled={busy}
            className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/20 py-14 text-white/60 disabled:opacity-50"
          >
            <span className="text-4xl">{busy ? '⏳' : '📸'}</span>
            <span className="font-medium">{busy ? 'Saving...' : 'Camera / Photo chuno'}</span>
            <span className="text-xs opacity-50">Mobile par camera khulega, computer par file picker</span>
          </button>
        )}

        {!preview && !busy && (
          <button onClick={openPicker} className="w-full rounded-xl bg-flame-500 py-3 font-bold text-white">
            Photo lo
          </button>
        )}

        {error && <p className="text-center text-xs text-red-400">{error}</p>}
        {preview && !error && (
          <p className="text-center text-sm text-flame-400">✅ Photo save ho gayi!</p>
        )}
      </div>
    </Modal>
  )
}
