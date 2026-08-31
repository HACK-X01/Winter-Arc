// Downscale very large images so IndexedDB stays lean (max ~1200px, JPEG ~0.85)
export async function compressImage(file) {
  if (typeof createImageBitmap === 'undefined') return file
  try {
    const img = await createImageBitmap(file)
    const MAX = 1200
    const scale = Math.min(1, MAX / Math.max(img.width, img.height))
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85))
    img.close()
    return blob || file
  } catch {
    return file
  }
}