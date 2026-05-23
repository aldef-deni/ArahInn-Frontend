// ── Konfigurasi upload image global ─────────────────────────────────────────
export const MAX_IMAGE_SIZE_MB        = 5
export const MIN_IMAGE_RESOLUTION_PX  = 800
export const MIN_AVATAR_RESOLUTION_PX = 256

export const ALLOWED_IMAGE_EXTS  = ['jpg', 'jpeg']
export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/pjpeg']

export const IMAGE_SPEC_TEXT  = `Format JPG/JPEG, min. ${MIN_IMAGE_RESOLUTION_PX} px, maks. ${MAX_IMAGE_SIZE_MB} MB per file.`
export const AVATAR_SPEC_TEXT = `Format JPG/JPEG, min. ${MIN_AVATAR_RESOLUTION_PX} px, maks. ${MAX_IMAGE_SIZE_MB} MB.`

const extOf = (name = '') => (name.split('.').pop() || '').toLowerCase()

const getImageDimensions = (file) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })

export const validateImageFile = async (file, opts = {}) => {
  const minPx       = opts.minResolution ?? MIN_IMAGE_RESOLUTION_PX
  const maxMb       = opts.maxSizeMb ?? MAX_IMAGE_SIZE_MB
  const allowedExts = opts.allowedExts ?? ALLOWED_IMAGE_EXTS
  const allowedMimes= opts.allowedMimes ?? ALLOWED_IMAGE_MIMES

  if (!file) return { valid: false, error: 'File tidak ditemukan.' }

  // 1. Validasi ekstensi
  const ext  = extOf(file.name)
  const mime = (file.type || '').toLowerCase()
  if (!allowedExts.includes(ext) || (mime && !allowedMimes.includes(mime))) {
    return {
      valid: false,
      error: `${file.name}: format harus JPG/JPEG (file Anda: .${ext || 'unknown'}).`,
    }
  }

  // 2. Validasi ukuran
  if (file.size > maxMb * 1024 * 1024) {
    const sizeMb = (file.size / 1024 / 1024).toFixed(1)
    return {
      valid: false,
      error: `${file.name}: ukuran ${sizeMb} MB melebihi batas ${maxMb} MB.`,
    }
  }

  // 3. Validasi resolusi
  const dims = await getImageDimensions(file)
  if (!dims) {
    return { valid: false, error: `${file.name}: bukan file gambar yang valid.` }
  }

  if (dims.width < minPx || dims.height < minPx) {
    return {
      valid: false,
      error: `${file.name}: resolusi minimal ${minPx} px (saat ini ${dims.width}×${dims.height}).`,
    }
  }

  return { valid: true, dimensions: dims }
}

export const validateImageFiles = async (files, opts = {}) => {
  const arr = Array.from(files || [])
  const results = await Promise.all(arr.map((f) => validateImageFile(f, opts)))
  const validFiles = arr.filter((_, i) => results[i].valid)
  const errors = results.filter((r) => !r.valid).map((r) => r.error)
  return { validFiles, errors }
}
