/** Réduit une photo (grand côté 1000 px max) et la renvoie en JPEG data URL. */
const MAX_SIDE = 1000

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { source: bitmap, width: bitmap.width, height: bitmap.height }
    } catch {
      /* on retombe sur l'élément image */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return { source: img, width: img.naturalWidth, height: img.naturalHeight }
  } finally {
    // l'image est dessinée tout de suite après : on libère l'adresse un peu plus tard
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }
}

export async function shrinkPhoto(file: File): Promise<string> {
  const { source, width, height } = await decode(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  if ('close' in source) (source as ImageBitmap).close()
  return canvas.toDataURL('image/jpeg', 0.8)
}
