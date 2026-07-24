import { create } from 'zustand'

// Lokasi real user — dipakai untuk pencarian akomodasi TERDEKAT.
// Persist di localStorage: sekali "connect" (izin diberikan & koordinat didapat),
// kunjungan berikutnya tidak perlu minta izin lagi (langsung pakai yang tersimpan,
// lalu disegarkan diam-diam bila izin masih ada).
const KEY = 'arahinn_geo_v1'
const TTL = 24 * 60 * 60 * 1000 // koordinat dianggap "fresh" 24 jam

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}
const save = (v) => {
  try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* ignore */ }
}

export const useLocationStore = create((set, get) => ({
  coords: load(),        // { lat, lng, ts } | null
  status: 'idle',        // idle | prompting | granted | denied | unsupported

  /**
   * Ambil lokasi real. Kalau sudah tersimpan → pakai langsung (tak prompt ulang),
   * lalu segarkan diam-diam. Kalau belum → minta izin sekali.
   * @param {boolean} force  paksa ambil ulang walau sudah tersimpan
   */
  acquire: (force = false) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      set({ status: 'unsupported' })
      return
    }
    const cached = get().coords
    const hasFresh = cached && (Date.now() - (cached.ts || 0) < TTL)
    if (cached) set({ status: 'granted' })       // sudah pernah connect → jangan blokir UI
    if (hasFresh && !force) {
      // masih fresh → refresh diam-diam saja (silent), tak wajib
    }
    set(s => ({ status: s.coords ? 'granted' : 'prompting' }))

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() }
        save(coords)
        set({ coords, status: 'granted' })
      },
      () => {
        // Gagal/ditolak: kalau sudah punya koordinat lama, tetap pakai itu.
        set(s => ({ status: s.coords ? 'granted' : 'denied' }))
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    )
  },
}))

/** Helper non-hook untuk baca koordinat tersimpan (mis. dari util). */
export const getGeo = () => useLocationStore.getState().coords
