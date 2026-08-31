import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BellRing, Download, Upload, Moon, Sun, ChevronRight } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { exportAllData, downloadJSON, importAllData } from '../utils/exportImport'
import { permissionState, supportsPeriodicSync } from '../utils/notifications'

const inputCls = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-base outline-none focus:border-flame-500 light:border-black/15 light:bg-white light:text-black'

export default function Settings() {
  const { settings, save } = useSettings()
  const [msg, setMsg] = useState('')
  const [notif, setNotif] = useState(permissionState())

  if (!settings) return null

  const set = (key, val) => save({ [key]: val })
  const supportsBgSync = supportsPeriodicSync()
  const notifyOn = notif === 'granted'

  async function doExport() {
    const json = await exportAllData()
    downloadJSON(json)
    setMsg('✅ Backup download ho gaya! (JSON file)')
  }

  async function doImport(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      await importAllData(text)
      setMsg('✅ Data restore ho gaya! App reload ho raha hai...')
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      setMsg(`❌ ${err.message}`)
    }
  }

  async function requestNotif() {
    if ('Notification' in window) {
      const state = await Notification.requestPermission()
      setNotif(state)
    }
  }

  return (
    <div className="px-4 py-5 page-enter">
      <h1 className="mb-1 text-2xl font-extrabold">Settings ⚙️</h1>
      <p className="mb-4 text-sm opacity-60">Winter Arc ka poora control yahan hai.</p>

      {msg && <div className="mb-4 card rounded-xl p-3 text-sm">{msg}</div>}

      {/* notifications */}
      <Section title="Notifications" delay={1}>
        <button onClick={requestNotif} className="card flex w-full items-center gap-3 p-3">
          {notifyOn ? <BellRing className="text-flame-400" /> : <Bell className="text-white/50" />}
          <div className="flex-1 text-left">
            <div className="font-semibold">{notifyOn ? 'Notifications on ✅' : 'Notifications off'}</div>
            <div className="text-xs opacity-50">Reminders ke liye allow karo</div>
          </div>
          <span className="text-xs opacity-50">{notif}</span>
        </button>
        {notifyOn && !supportsBgSync && (
          <p className="mt-2 text-xs text-white/40 light:text-black/50">
            💡 Background reminders Chrome (Android) pe best kaam karte hain. Baaki browsers me app open rehne tak reminders chalenge — reliable hai jab tab active ho.
          </p>
        )}
        {notifyOn && supportsBgSync && (
          <p className="mt-2 text-xs text-flame-400/70">
            ✅ Background sync supported — reminders background me bhi chalenge!
          </p>
        )}
      </Section>

      {/* challenge */}
      <Section title="Challenge" delay={2}>
        <Row label="Start date">
          <input type="date" className={inputCls} value={settings.startDate} onChange={(e) => set('startDate', e.target.value)} />
        </Row>
        <Row label="Duration (months)">
          <input type="number" min={1} max={24} className={inputCls} value={settings.durationMonths} onChange={(e) => set('durationMonths', Math.max(1, Number(e.target.value)))} />
        </Row>
        <Row label="Units">
          <select className={inputCls} value={settings.units} onChange={(e) => set('units', e.target.value)}>
            <option value="kg">kg / ml</option>
            <option value="lb">lb / oz</option>
          </select>
        </Row>
        <Row label="Unit">
          <span className="text-sm opacity-60">Weight: {settings.currentWeight ?? '—'} {settings.units}</span>
        </Row>
      </Section>

      {/* goals */}
      <Section title="Goals & schedule" delay={3}>
        <Row label="Current weight">
          <input type="number" inputMode="decimal" className={inputCls} value={settings.currentWeight ?? ''} placeholder="—" onChange={(e) => set('currentWeight', e.target.value === '' ? null : Number(e.target.value))} />
        </Row>
        <Row label="Goal weight">
          <input type="number" inputMode="decimal" className={inputCls} value={settings.goalWeight ?? ''} placeholder="—" onChange={(e) => set('goalWeight', e.target.value === '' ? null : Number(e.target.value))} />
        </Row>
        <Row label="Water goal (ml)">
          <input type="number" className={inputCls} value={settings.waterGoalMl} onChange={(e) => set('waterGoalMl', Number(e.target.value))} />
        </Row>
        <div className="grid grid-cols-2 gap-2">
          <Row label="Wake up">
            <input type="time" className={inputCls} value={settings.wakeTime} onChange={(e) => set('wakeTime', e.target.value)} />
          </Row>
          <Row label="Sleep">
            <input type="time" className={inputCls} value={settings.sleepTime} onChange={(e) => set('sleepTime', e.target.value)} />
          </Row>
        </div>
      </Section>

      {/* theme */}
      <Section title="Appearance" delay={4}>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => set('theme', 'dark')}
            className={`press-scale flex items-center justify-center gap-2 rounded-xl py-3 transition ${settings.theme === 'dark' ? 'bg-flame-500 text-white' : 'bg-white/10'}`}
          >
            <Moon size={18} /> Dark
          </button>
          <button
            onClick={() => set('theme', 'light')}
            className={`press-scale flex items-center justify-center gap-2 rounded-xl py-3 transition ${settings.theme === 'light' ? 'bg-flame-500 text-white' : 'bg-white/10'}`}
          >
            <Sun size={18} /> Light
          </button>
        </div>
      </Section>

      <Section title="Manage" delay={5}>
        <Link to="/reminders" className="card flex items-center justify-between p-3 font-medium active:scale-[0.98] transition-transform">
          <span>⏰ Manage reminders & chores</span>
          <ChevronRight size={18} className="opacity-50" />
        </Link>

        <button onClick={doExport} className="card mt-2 flex w-full items-center gap-3 p-3">
          <Download size={18} className="text-ice-400" />
          <span className="flex-1 text-left">Export data (backup JSON)</span>
        </button>
        <label className="card mt-2 flex w-full cursor-pointer items-center gap-3 p-3">
          <Upload size={18} className="text-flame-400" />
          <span className="flex-1 text-left">Import data (restore)</span>
          <input type="file" accept="application/json" className="hidden" onChange={doImport} />
        </label>
      </Section>

      <p className="mt-6 text-center text-xs opacity-40">Winter Arc Tracker · local-only · no data leaves your device</p>
    </div>
  )
}

function Section({ title, children, delay = 0 }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 text-sm font-bold opacity-70">{title}</h2>
      <div className={`space-y-2 card-enter`} style={{ animationDelay: `${delay * 0.08}s` }}>{children}</div>
    </section>
  )
}

function Row({ label, children }) {
  return (
    <div>
      <div className="mb-1 text-xs opacity-60">{label}</div>
      {children}
    </div>
  )
}
