/**
 * Menempelkan error dari server ke kolom form yang tepat (react-hook-form).
 *
 * Bentuk error dari BE:
 *   422 → { message, errors: { email: ['...'], password: ['...'] } }  (Laravel validate)
 *   401 → { error: 'wrong_password',  message: '...' }                 (kredensial)
 *   404 → { error: 'email_not_found', message: '...' }
 *
 * CATATAN: interceptor axios hanya meng-camelCase respons SUKSES, jadi key di
 * `errors` tetap apa adanya dari BE (name/email/password/phone). Konversi
 * snake→camel tetap dilakukan di sini untuk kolom multi-kata.
 *
 * @param  {object} err       error dari axios
 * @param  {Function} setError setError milik react-hook-form
 * @param  {object} codeMap   peta kode bisnis → { field, message }
 * @returns {string|null}     pesan umum bila TIDAK ada error yang menempel ke kolom
 */
const toCamel = (k) => String(k).replace(/_([a-z])/g, (_, c) => c.toUpperCase())

export function applyServerErrors(err, setError, codeMap = {}) {
  const data = err?.response?.data
  if (!data) return 'Tidak dapat terhubung ke server. Cek koneksi internet Anda.'

  // 1) Kode bisnis spesifik (mis. wrong_password) → tempel ke kolomnya
  const code = data.error
  if (code && codeMap[code]) {
    const { field, message } = codeMap[code]
    setError(field, { type: 'server', message: message || data.message }, { shouldFocus: true })
    return null
  }

  // 2) Bag validasi Laravel → tempel per kolom
  const bag = data.errors
  if (bag && typeof bag === 'object') {
    let first = true
    for (const [key, val] of Object.entries(bag)) {
      const message = Array.isArray(val) ? val[0] : String(val)
      setError(toCamel(key), { type: 'server', message }, { shouldFocus: first })
      first = false
    }
    if (!first) return null // minimal satu kolom kena
  }

  // 3) Tidak bisa dipetakan → biar dipakai sebagai pesan umum
  return data.message || 'Terjadi kesalahan. Coba lagi.'
}
