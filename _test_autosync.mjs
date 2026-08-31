import { spawn } from 'node:child_process'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9352
const PROFILE = 'C:/tmp/cdp-as3-' + Date.now()
const BASE = process.env.BASE || 'http://localhost:5174'
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--no-first-run', '--disable-gpu', '--no-sandbox', '--window-size=420,900', `${BASE}/#/`], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))
async function getJson(u) { return (await fetch(u)).json() }

async function main() {
  let tabs
  for (let i = 0; i < 30; i++) { try { tabs = await getJson(`http://localhost:${PORT}/json`); if (tabs.length) break } catch {} await sleep(300) }
  const page = tabs.find(t => t.url.includes('localhost'))
  if (!page) { console.log('NO PAGE'); chrome.kill(); process.exit(1) }
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise(r => ws.onopen = r)
  let id = 0, pending = {}
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending[m.id]) { pending[m.id](m.result); delete pending[m.id] } }
  const send = (method, params = {}) => new Promise(res => { const mid = ++id; pending[mid] = res; ws.send(JSON.stringify({ id: mid, method, params })) })
  await send('Runtime.enable')
  const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value

  // Seed DB
  await ev(`(async () => {
    function openDB() {
      return new Promise((res, rej) => {
        const req = indexedDB.open('winter-arc-tracker', 3)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' })
          if (!db.objectStoreNames.contains('reminders')) db.createObjectStore('reminders', { keyPath: 'id', autoIncrement: true })
          if (!db.objectStoreNames.contains('waterLogs')) db.createObjectStore('waterLogs', { keyPath: 'date' })
          if (!db.objectStoreNames.contains('meals')) db.createObjectStore('meals', { keyPath: 'id', autoIncrement: true })
          if (!db.objectStoreNames.contains('exercises')) db.createObjectStore('exercises', { keyPath: 'id', autoIncrement: true })
          if (!db.objectStoreNames.contains('weightLogs')) db.createObjectStore('weightLogs', { keyPath: 'id', autoIncrement: true })
          if (!db.objectStoreNames.contains('dailyCompletion')) db.createObjectStore('dailyCompletion', { keyPath: 'id' })
          if (!db.objectStoreNames.contains('dailyReports')) db.createObjectStore('dailyReports', { keyPath: 'date' })
          if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true })
        }
        req.onsuccess = () => res(req.result)
        req.onerror = () => rej(req.error)
      })
    }
    const db = await openDB()
    await new Promise((res, rej) => {
      const tx = db.transaction('settings', 'readwrite')
      tx.objectStore('settings').put({ id: 'user', startDate: '2026-09-01', durationMonths: 6, wakeTime: '05:30', sleepTime: '22:30', waterGoalMl: 4000, units: 'kg', theme: 'dark', weighInDay: 6, onboardingComplete: true })
      tx.oncomplete = () => res()
      tx.onerror = () => rej(tx.error)
    })
    await new Promise((res, rej) => {
      const tx = db.transaction('meals', 'readwrite')
      tx.objectStore('meals').clear()
      tx.oncomplete = () => res()
      tx.onerror = () => rej(tx.error)
    })
    await new Promise((res, rej) => {
      const tx = db.transaction('dailyCompletion', 'readwrite')
      tx.objectStore('dailyCompletion').clear()
      tx.oncomplete = () => res()
      tx.onerror = () => rej(tx.error)
    })
    db.close()
    return 'ok'
  })()`)

  await sleep(1000)
  await ev(`location.reload()`)
  await sleep(4000)

  // Check what page we're on
  console.log('URL:', await ev('location.href'))
  const bodyText = await ev('document.body.innerText')
  console.log('Body length:', bodyText.length)
  console.log('First 500:', bodyText.slice(0, 500).replace(/\n/g, ' | '))

  // Check if onboarding is showing
  const hasOnboarding = bodyText.includes('onboarding') || bodyText.includes('Start') || bodyText.includes('Shuru')
  console.log('Onboarding visible:', hasOnboarding)

  // Check if React rendered
  const rootHTML = await ev('document.getElementById("root")?.innerHTML?.slice(0, 200) || "NO ROOT"')
  console.log('Root HTML:', rootHTML)

  // Check console errors
  const consoleErrors = await ev(`(() => {
    try {
      const errors = []
      const origError = console.error
      // Just check if there are visible error overlays
      const overlay = document.querySelector('[class*="error"]') || document.querySelector('vite-error-overlay')
      return overlay ? overlay.textContent?.slice(0, 200) : 'no error overlay'
    } catch(e) { return e.message }
  })()`)
  console.log('Error overlay:', consoleErrors)

  chrome.kill()
  try { const fs = await import('node:fs'); fs.rmSync(PROFILE, { recursive: true, force: true }) } catch {}
  process.exit(0)
}
main().catch(e => { console.error('ERROR:', e); chrome.kill(); process.exit(1) })
