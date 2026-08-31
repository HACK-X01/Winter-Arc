// Photo backup helpers — convert Photo blobs to/from JSON-safe data-URL strings
// so the JSON export/import stays fully local and portable.

export async function addPhotoToBackup(photos) {
  // photos: [{ id, date, blob, createdAt }]
  const out = []
  for (const p of photos) {
    try {
      const dataUrl = await blobToDataUrl(p.blob)
      out.push({ date: p.date, createdAt: p.createdAt, dataUrl })
    } catch {
      // skip photos that can't be encoded
    }
  }
  return out
}

export async function restorePhotosFromBackup(backedUp) {
  // backedUp: [{ date, createdAt, dataUrl }]
  const out = []
  for (const b of backedUp || []) {
    try {
      const blob = await dataUrlToBlob(b.dataUrl)
      out.push({ date: b.date, createdAt: b.createdAt || Date.now(), blob })
    } catch {
      // skip malformed entries
    }
  }
  return out
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

function dataUrlToBlob(dataUrl) {
  return new Promise((resolve) => {
    const parts = dataUrl.split(',')
    const type = (parts[0].match(/data:([^;]+)/) || [])[1] || 'image/jpeg'
    const bin = atob(parts[1])
    const arr = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
    resolve(new Blob([arr], { type }))
  })
}