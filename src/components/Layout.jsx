import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Flame, Droplets, UtensilsCrossed, TrendingUp, Settings as SettingsIcon, FileText } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { useReminders } from '../hooks/useReminders'
import { useNotificationService } from '../hooks/useNotificationService'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Flame, end: true },
  { to: '/water', label: 'Pani', icon: Droplets },
  { to: '/meals', label: 'Khana', icon: UtensilsCrossed },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Layout() {
  const { settings } = useSettings()
  const { reminders } = useReminders()
  const navigate = useNavigate()
  const location = useLocation()

  useNotificationService(settings, reminders)

  useEffect(() => {
    const root = document.documentElement
    if (settings) {
      root.classList.toggle('dark', settings.theme === 'dark')
      root.classList.toggle('light', settings.theme === 'light')
    }
  }, [settings])

  // scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-night-950 text-night-50 dark:bg-night-950 light:bg-slate-100 light:text-slate-900">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* quick report FAB */}
      <button
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate(5)
          navigate('/report')
        }}
        className="fixed bottom-20 right-4 z-30 flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-br from-flame-400 to-flame-600 text-white shadow-lg shadow-black/40 active:scale-90 transition-transform flame-pulse"
        aria-label="Daily Report"
      >
        <FileText size={22} />
      </button>

      {/* bottom navigation */}
      <nav className="glass-nav fixed inset-x-0 bottom-0 z-30 pb-safe">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(3)
              }}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition active:scale-95 ${
                  isActive ? 'text-flame-400' : 'text-white/50 light:text-slate-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full bg-flame-400 nav-glow" />
                  )}
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={isActive ? 'drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]' : ''}
                  />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
