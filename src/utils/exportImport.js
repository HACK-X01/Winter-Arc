import { getDB } from '../db/database'
import { addPhotoToBackup, restorePhotosFromBackup } from './backupPhotos'

const STORES = ['settings', 'reminders', 'waterLogs', 'meals', 'exercises', 'weightLogs', 'dailyCompletion', 'dailyReports']
const JSON_STORES = STORES // plain-JSON stores
const PHOTO_STORE = 'photos'

export async function exportAllData() {
  const db = await getDB()
  const payload = { app: 'winter-arc-tracker', version: 2, exportedAt: new Date().toISOString(), data: {} }
  for (const store of JSON_STORES) {
    payload.data[store] = (await db.getAll(store)) || []
  }
  // Photos are blobs — JSON.stringify can't encode them directly,
  // so a csv of blob blobs is wasteful; convert each to a data-URL string.
  const photos = (await db.getAll(PHOTO_STORE)) || []
  payload.data[PHOTO_STORE] = await addPhotoToBackup(photos)
  return JSON.stringify(payload, null, 2)
}

export function downloadJSON(jsonString, filename = `winter-arc-backup-${new Date().toISOString().slice(0, 10)}.json`) {
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importAllData(jsonString) {
  let payload
  try {
    payload = JSON.parse(jsonString)
  } catch {
    throw new Error('Invalid JSON file')
  }
  if (payload.app !== 'winter-arc-tracker' || !payload.data) {
    throw new Error('Not a Winter Arc Tracker backup file')
  }
  const db = await getDB()

  // v1 backups didn't include a photos store worth restoring this way;
  // only restore photos from v2+ backups.
  const allStores = [...STORES]
  const hasPhotos = payload.version >= 2 && Array.isArray(payload.data.photos)
  if (hasPhotos) allStores.push('photos')

  const tx = db.transaction(allStores, 'readwrite')
  await Promise.all(allStores.map((s) => tx.objectStore(s).clear()))
  for (const store of allStores) {
    if (store === 'photos') continue // handled separately below (blob conversion)
    const rows = payload.data[store] || []
    for (const row of rows) {
      tx.objectStore(store).put(row)
    }
  }
  await tx.done

  // Photos are stored as dataUrl strings in the JSON — convert to blobs.
  if (hasPhotos) {
    const restored = await restorePhotosFromBackup(payload.data.photos)
    const tx2 = db.transaction(['photos'], 'readwrite')
    for (const p of restored) tx2.objectStore('photos').put(p)
    await tx2.done
  }
  return true
}
