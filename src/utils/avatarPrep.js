const DEFAULT_SIZE = 512
const DEFAULT_QUALITY = 0.85

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gagal memuat gambar.')) }
    img.src = url
  })

export const prepareAvatarFile = async (file, opts = {}) => {
  const size    = opts.size    ?? DEFAULT_SIZE
  const quality = opts.quality ?? DEFAULT_QUALITY

  const img = await loadImage(file)

  const srcSize = Math.min(img.naturalWidth, img.naturalHeight)
  const sx = (img.naturalWidth  - srcSize) / 2
  const sy = (img.naturalHeight - srcSize) / 2

  const canvas = document.createElement('canvas')
  canvas.width  = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, size, size)

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  )
  if (!blob) throw new Error('Gagal memproses gambar.')

  const baseName = (file.name || 'avatar').replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
}
