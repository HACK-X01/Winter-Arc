import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children }) {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setVisible(true)
      setClosing(false)
    } else {
      // Parent closed us externally (e.g. submit-success calling onClose).
      // X-button path keeps `open` true during its exit animation, so this only
      // fires for direct closes — unmount immediately.
      setVisible(false)
      setClosing(false)
    }
  }, [open])

  const handleClose = useCallback(() => {
    setClosing(true)
    if (navigator.vibrate) navigator.vibrate(5)
    setTimeout(() => {
      setVisible(false)
      setClosing(false)
      onClose()
    }, 250)
  }, [onClose])

  if (!visible && !closing) return null

  return (
    <div
      className={`fixed inset-0 z-40 flex items-end justify-center bg-black/70 backdrop-blur-sm ${
        closing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-lg rounded-t-3xl bg-night-900 p-5 pb-safe light:bg-white ${
          closing ? 'modal-sheet-exit' : 'modal-sheet-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* drag handle */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 light:bg-black/15" />

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            onClick={handleClose}
            className="rounded-full p-1.5 hover:bg-white/10 active:scale-90 transition-transform"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
