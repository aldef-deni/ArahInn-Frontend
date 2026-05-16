export const MAX_IMAGE_SIZE_MB = 5
export const MIN_IMAGE_RESOLUTION_PX = 1024
export const MIN_AVATAR_RESOLUTION_PX = 256
export const IMAGE_SPEC_TEXT = `Min. resolusi ${MIN_IMAGE_RESOLUTION_PX} px · maks. ${MAX_IMAGE_SIZE_MB} MB per file.`
export const AVATAR_SPEC_TEXT = `Min. resolusi ${MIN_AVATAR_RESOLUTION_PX} px · maks. ${MAX_IMAGE_SIZE_MB} MB.`

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
  const minPx = opts.minResolution ?? MIN_IMAGE_RESOLUTION_PX
  const maxMb = opts.maxSizeMb ?? MAX_IMAGE_SIZE_MB

  if (!file) return { valid: false, error: 'File tidak ditemukan.' }

  if (file.size > maxMb * 1024 * 1024) {
    return { valid: false, error: `${file.name}: ukuran melebihi ${maxMb} MB.` }
  }

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

  return { valid: true }
}

export const validateImageFiles = async (files, opts = {}) => {
  const arr = Array.from(files || [])
  const results = await Promise.all(arr.map((f) => validateImageFile(f, opts)))
  const validFiles = arr.filter((_, i) => results[i].valid)
  const errors = results.filter((r) => !r.valid).map((r) => r.error)
  return { validFiles, errors }
}
