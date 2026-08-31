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
  const inputRef = useRef(null)
  const isToday = dateKey === todayKey()

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const blob = await compressImage(file)
    setPreview(URL.createObjectURL(blob))
    await add(blob, dateKey)
    setBusy(true)
    // give the tiny delay for state settle before closing
    setTimeout(() => {
      onSaved()
    }, 400)
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
            className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/20 py-14 text-white/60"
          >
            <span className="text-4xl">📸</span>
            <span className="font-medium">Camera / Photo chuno</span>
            <span className="text-xs opacity-50">Mobile par camera khulega, computer par file picker</span>
          </button>
        )}

        {!preview && (
          <button onClick={openPicker} className="w-full rounded-xl bg-flame-500 py-3 font-bold text-white">
            Photo lo
          </button>
        )}

        {busy && !preview && (
          <p className="text-center text-sm text-flame-400">✅ Photo save ho gayi!</p>
        )}
        {preview && (
          <p className="text-center text-sm text-flame-400">✅ Photo save ho gayi! Bahar nikl ke dekho.</p>
        )}
      </div>
    </Modal>
  )
}

