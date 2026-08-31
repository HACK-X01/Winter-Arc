import { useEffect, useRef } from 'react'
import {
  buildTodaySchedule,
  armTodayTimers,
  showLocalNotification,
  registerPeriodicSync,
  permissionState,
} from '../utils/notifications'

// Top-level notification service. Arms today's reminders and shows them via the
// service worker. Re-arms on foreground, network-return, and at midnight.
// IMPORTANT: PWAs can't guarantee exact-time background alarms everywhere.
// Android (Chrome) works reasonably via SW + periodic sync; iOS Safari is more
// limited. Phase 2 (Capacitor) is the guaranteed path — see code comments.
export function useNotificationService(settings, reminders) {
  const cleanupRef = useRef(null)
  const armedRef = useRef('')

  useEffect(() => {
    if (!settings || !reminders) return
    if (permissionState() !== 'granted') return

    const arm = () => {
      const jobs = buildTodaySchedule(reminders, settings)
      const key = jobs.map((j) => `${j.time}_${j.key}`).join('|')
      if (key === armedRef.current) return
      armedRef.current = key
      if (cleanupRef.current) cleanupRef.current()
      cleanupRef.current = armTodayTimers(
        jobs,
        (job) => {
          showLocalNotification(job.title, job.body, job.url)
        },
        settings
      )
    }

    arm()

    const onForeground = () => {
      if (document.visibilityState === 'visible') arm()
    }
    const onNewDay = () => arm()
    const onOnline = () => arm()
    document.addEventListener('visibilitychange', onForeground)
    window.addEventListener('winterarc:newday', onNewDay)
    window.addEventListener('online', onOnline)

    // Best-effort background sync on Chrome/Android
    registerPeriodicSync()

    return () => {
      if (cleanupRef.current) cleanupRef.current()
      cleanupRef.current = null
      document.removeEventListener('visibilitychange', onForeground)
      window.removeEventListener('winterarc:newday', onNewDay)
      window.removeEventListener('online', onOnline)
    }
  }, [settings, reminders])
}
