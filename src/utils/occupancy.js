/**
 * Komposisi tamu per kamar, dan cara membawanya lewat URL.
 *
 * Bentuk datar lama — satu angka `guests` — tidak bisa menyatakan kamar yang
 * isinya berbeda, dan sama sekali tidak bisa menyatakan anak. Padahal umur anak
 * MENENTUKAN HARGA di sisi supplier: anak 3 tahun dan 17 tahun pada kamar yang
 * sama menghasilkan tarif berbeda.
 *
 * Susunannya harus SAMA PERSIS di seluruh tahap (pencarian → halaman hotel →
 * prebook → pemesanan). Kalau berbeda satu angka saja, ETG menganggapnya
 * konteks pencarian lain dan tarif yang dipilih tamu lenyap saat prebook.
 * Karena itu bentuknya dibawa utuh di URL, bukan disimpan di state yang hilang
 * saat halaman dimuat ulang atau tautannya dibagikan.
 *
 * Format: `2-3|2-1,5,17`
 *   → kamar 1: 2 dewasa + 1 anak umur 3
 *   → kamar 2: 2 dewasa + 3 anak umur 1, 5, 17
 */

export const KAMAR_MAKS   = 9
export const DEWASA_MAKS  = 6
export const ANAK_MAKS    = 4
export const UMUR_ANAK_MAKS = 17

/** Satu kamar berisi 2 dewasa — bawaan yang sama seperti sebelumnya. */
export const occupancyBawaan = () => [{ adults: 2, children: [] }]

/** `[{adults, children}]` → `"2-3|2-1,5,17"`. Kamar tanpa anak ditulis `"2"`. */
export function encodeOccupancy(rooms) {
  if (!Array.isArray(rooms) || rooms.length === 0) return ''
  return rooms
    .map((r) => {
      const dewasa = Math.max(1, Number(r.adults) || 1)
      const anak = (r.children ?? []).map((n) => Number(n) || 0)
      return anak.length ? `${dewasa}-${anak.join(',')}` : String(dewasa)
    })
    .join('|')
}

/**
 * `"2-3|2-1,5,17"` → `[{adults, children}]`.
 *
 * Nilai rusak TIDAK melempar: URL bisa disunting siapa saja, dan membuat
 * halaman pencarian mati karena satu karakter salah jauh lebih buruk daripada
 * diam-diam kembali ke komposisi bawaan.
 */
export function decodeOccupancy(teks) {
  if (!teks || typeof teks !== 'string') return occupancyBawaan()

  const rooms = teks
    .split('|')
    .slice(0, KAMAR_MAKS)
    .map((bagian) => {
      const [dewasaTeks, anakTeks] = bagian.split('-')
      const adults = batas(Number(dewasaTeks), 1, DEWASA_MAKS, 2)
      const children = (anakTeks ? anakTeks.split(',') : [])
        .slice(0, ANAK_MAKS)
        .map((u) => batas(Number(u), 0, UMUR_ANAK_MAKS, 0))
      return { adults, children }
    })
    .filter(Boolean)

  return rooms.length ? rooms : occupancyBawaan()
}

/** Bentuk yang dikirim ke API: `[{adults, children:[umur]}]`. */
export const occupancyKeApi = (rooms) =>
  rooms.map((r) => ({ adults: r.adults, children: r.children ?? [] }))

export const totalDewasa = (rooms) =>
  rooms.reduce((n, r) => n + (Number(r.adults) || 0), 0)

export const totalAnak = (rooms) =>
  rooms.reduce((n, r) => n + (r.children?.length ?? 0), 0)

export const totalTamu = (rooms) => totalDewasa(rooms) + totalAnak(rooms)

function batas(nilai, min, max, cadangan) {
  if (!Number.isFinite(nilai)) return cadangan
  return Math.min(max, Math.max(min, Math.round(nilai)))
}
