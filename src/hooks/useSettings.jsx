import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getSettings, saveSettings } from '../db/database'

// Shared settings store. One provider at App root; every consumer reads the
// same live value, so a refresh in Onboarding re-gates App immediately.
const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    let active = true
    getSettings().then((s) => {
      if (active) setSettings(s)
    })
    return () => {
      active = false
    }
  }, [])

  const save = useCallback(async (patch) => {
    const updated = await saveSettings(patch)
    setSettings(updated)
    return updated
  }, [])

  // Re-read settings from IndexedDB (used after onboarding finishes / runs
  // migrations, so the App gate reflects on-disk truth immediately).
  const refresh = useCallback(async () => {
    const s = await getSettings()
    setSettings(s)
    return s
  }, [])

  const value = useMemo(() => ({ settings, save, refresh, ready: !!settings }), [settings, save, refresh])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}