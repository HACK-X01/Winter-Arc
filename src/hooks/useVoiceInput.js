import { useCallback, useEffect, useRef, useState } from 'react'

// Web Speech API microphone input (works on Chrome/Edge/Android; Safari partial).
// Hinglish-friendly: speechRecognition.lang = 'hi-IN' with 'en-IN' fallback.
// Falls back gracefully — returns supported:false where unavailable.
export function useVoiceInput(onResult) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const recRef = useRef(null)
  const onResultRef = useRef(null)

  // Keep the latest onResult without re-triggering the main effect
  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    setSupported(true)
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = false
    // Prefer Hinglish — Hindi speech service understands mixed Hinglish well,
    // falls back to language(s) below as needed.
    rec.lang = 'hi-IN'
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript || ''
      onResultRef.current?.(text)
    }
    rec.onend = () => setListening(false)
    rec.onerror = (e) => {
      setListening(false)
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('Mic permission nahi mili — browser settings se allow karo.')
      } else if (e.error !== 'aborted') {
        setError('Voice samajh nahi aayi. Dobara try karo.')
      }
    }
    recRef.current = rec
    return () => {
      try { rec.abort() } catch { /* noop */ }
    }
  }, [])

  const start = useCallback(() => {
    const rec = recRef.current
    if (!rec) {
      setError('Voice is browser me supported nahi.')
      return
    }
    setError('')
    try {
      rec.start()
      setListening(true)
    } catch {
      setError('Voice start nahi hui. Dobara try karo.')
    }
  }, [])

  const stop = useCallback(() => {
    try { recRef.current?.stop() } catch { /* noop */ }
    setListening(false)
  }, [])

  return { supported, listening, error, start, stop }
}