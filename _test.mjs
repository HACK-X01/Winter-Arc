import { spawn } from 'node:child_process'
import fs from 'node:fs'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9342
const PROFILE = 'C:/tmp/cdp-test-' + Date.now()
const BASE = process.env.BASE || 'http://localhost:5174'
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--no-first-run', '--disable-gpu', '--no-sandbox', '--window-size=420,900', `${BASE}/#/`], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))
async function getJson(u) { return (await fetch(u)).json() }

async function main() {
  let tabs
  for (let i = 0; i < 30; i++) { try { tabs = await getJson(`http://localhost:${PORT}/json`); if (tabs.length) break } catch {} await sleep(300) }
  const page = tabs.find(t => t.url.includes('localhost'))
  if (!page) { console.log('NO PAGE FOUND'); chrome.kill(); process.exit(1) }
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise(r => ws.onopen = r)
  let id = 0, pending = {}, exc = []
  ws.onmessage = e => {
    const m = JSON.parse(e.data)
    if (m.id && pending[m.id]) { pending[m.id](m.result); delete pending[m.id] }
    if (m.method === 'Runtime.exceptionThrown') exc.push(m.params.exceptionDetails?.exception?.description || '')
  }
  const send = (method, params = {}) => new Promise(res => { const mid = ++id; pending[mid] = res; ws.send(JSON.stringify({ id: mid, method, params })) })
  await send('Runtime.enable')
  const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value
  const clickTxt = t => ev(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('${t}'));if(b){b.click();return true}return false})()`)
  const setVal = (sel, v) => ev(`(()=>{const el=document.querySelector('${sel}');if(!el)return false;const s=Object.getOwnPropertyDescriptor(el.constructor.prototype,'value')?.set;if(s)s.call(el,'${v}');else el.value='${v}';el.dispatchEvent(new Event('input',{bubbles:true}));return true})()`)

  // Seed DB with proper upgrade handler (create all stores) + settings
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
    db.close()
    return 'ok'
  })()`)

  await sleep(500)
  await ev(`location.hash='#/reminders'; location.reload()`)
  await sleep(3000)

  console.log('HREF:', await ev('location.href'))
  const body = await ev('document.body.innerText')
  console.log('BODY (first 300):', body.slice(0, 300).replace(/\n/g, ' | '))
  console.log('EXC count:', exc.length)

  // Test add reminder
  console.log('\n--- ADD REMINDER TEST ---')
  console.log('Click Naya:', await clickTxt('Naya reminder'))
  await sleep(600)

  const modalOpen = await ev(`!![...document.querySelectorAll('button')].find(b=>b.textContent.includes('Save reminder'))`)
  console.log('Modal open:', modalOpen)

  await setVal('input[placeholder*="Name"]', 'Test After Fix')
  await sleep(200)
  console.log('Click Save:', await clickTxt('Save reminder'))
  await sleep(1200)

  const inList = await ev(`document.body.innerText.includes('Test After Fix')`)
  console.log('In list:', inList)
  console.log('EXC:', exc.length ? exc[0] : '(none)')
  console.log('\nRESULT:', inList ? 'PASS' : 'FAIL')

  chrome.kill()
  try { fs.rmSync(PROFILE, { recursive: true, force: true }) } catch {}
  process.exit(inList ? 0 : 1)
}
main().catch(e => { console.error('SCRIPT ERROR:', e); chrome.kill(); process.exit(1) })
