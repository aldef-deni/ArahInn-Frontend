import i18n from '@/i18n'

// Konversi harga IDR → USD saat bahasa aktif = English, mengikuti kurs terbaru.
// Kurs (1 USD = ? IDR) diambil dari BE (/fx-rate) & di-cache di localStorage.
const DEFAULT_USD_IDR = 16300
const LS_KEY = 'fx_usd_idr'

const readCached = () => {
  try { const v = Number(localStorage.getItem(LS_KEY)); return v > 1000 ? v : null } catch { return null }
}

let usdIdr = readCached() || DEFAULT_USD_IDR

export const getUsdIdr = () => usdIdr

/** Ambil kurs terbaru dari BE (dipanggil sekali saat app mount). */
export async function loadFxRate() {
  try {
    const base = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/+$/, '')
    const res = await fetch(`${base}/fx-rate`)
    const json = await res.json()
    const rate = Number(json?.data?.usd_idr)
    if (rate > 1000) {
      usdIdr = rate
      try { localStorage.setItem(LS_KEY, String(rate)) } catch { /* abaikan */ }
    }
  } catch { /* gagal → pakai kurs cache/default */ }
}

/**
 * Format uang sesuai bahasa aktif:
 *   - EN → USD (konversi dari IDR pakai kurs terkini), 2 desimal.
 *   - selain itu → IDR (Rp), tanpa desimal.
 */
export function formatMoney(idrAmount) {
  const amt = Number(idrAmount) || 0
  if (i18n.language === 'en') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(amt / usdIdr)
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(amt)
}
