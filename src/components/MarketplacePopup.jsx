import { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { ShoppingCart, ChevronRight } from 'lucide-react'

/**
 * Popup Market ArahInn — tampil sekali per hari saat pengguna membuka web.
 * Gambar sudah memuat tombol "Jelajahi" + ikon X, jadi:
 *  - klik area gambar  → buka marketplace
 *  - hotspot transparan tepat di atas ikon X yang tergambar → menutup
 * Di bawah gambar ditambah CTA beranimasi shimmer (samakan dgn CTA header).
 */
const MARKET_URL = 'https://market.arahinn.com/'
const SEEN_KEY   = 'arahinn_market_popup_seen'
// Jangan ganggu saat pengguna sedang di alur bayar
const SKIP_PATHS = ['/payment', '/checkout', '/tiket/bayar']

const today = () => new Date().toISOString().slice(0, 10)

export default function MarketplacePopup() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  const dismiss = useCallback(() => {
    setOpen(false)
    try { localStorage.setItem(SEEN_KEY, today()) } catch { /* mode privat */ }
  }, [])

  const goMarket = useCallback(() => {
    dismiss()
    window.open(MARKET_URL, '_blank', 'noopener,noreferrer')
  }, [dismiss])

  // Tampilkan sekali per hari, beri jeda singkat agar halaman sempat render
  useEffect(() => {
    if (SKIP_PATHS.some(p => pathname.startsWith(p))) return
    let seen = null
    try { seen = localStorage.getItem(SEEN_KEY) } catch { /* mode privat */ }
    if (seen === today()) return
    const t = setTimeout(() => setOpen(true), 800)
    return () => clearTimeout(t)
  }, [pathname])

  // Esc menutup + kunci scroll latar
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') dismiss() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, dismiss])

  if (!open) return null

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Market ArahInn"
      onClick={dismiss}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[430px] max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl shadow-black/50 ring-1 ring-amber-300/25 bg-[#002144] animate-slide-up-checkout"
      >
        {/* Gambar promo — klik di mana saja (termasuk tombol yang tergambar) menuju marketplace */}
        <button type="button" onClick={goMarket} aria-label="Buka Market ArahInn" className="block w-full">
          <img
            src="/market-arahinn.webp"
            alt="Market ArahInn — semua kebutuhan Anda dalam satu marketplace"
            width={1000} height={1000}
            className="w-full h-auto select-none rounded-t-3xl"
            draggable={false}
          />
        </button>

        {/* Hotspot tutup — tepat di atas ikon X yang sudah tergambar di pojok kanan atas */}
        <button
          type="button" onClick={dismiss} aria-label="Tutup"
          className="absolute top-[1.5%] right-[1.5%] w-[12%] aspect-square rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        />

        {/* CTA beranimasi — gaya sama dengan CTA di header */}
        <div className="px-5 pb-5 pt-1 bg-gradient-to-b from-[#002144] to-[#00132e] rounded-b-3xl">
          <button
            type="button" onClick={goMarket}
            className="group relative w-full overflow-hidden rounded-2xl py-4 text-base font-extrabold tracking-tight text-amber-950 ring-1 ring-amber-200/70 shadow-[0_10px_28px_-8px_rgba(245,158,11,0.65)] bg-[linear-gradient(110deg,#fbbf24,35%,#fff7cd,50%,#fbbf24,65%,#f59e0b)] bg-[length:200%_100%] animate-shimmer transition-all hover:brightness-105 active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center justify-center gap-2.5">
              <ShoppingCart className="w-[22px] h-[22px] shrink-0 drop-shadow-sm" strokeWidth={2.5} />
              <span>Jelajahi Market ArahInn</span>
              <ChevronRight className="w-[18px] h-[18px] shrink-0 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={3} />
            </span>
          </button>

          <button
            type="button" onClick={dismiss}
            className="mt-2.5 w-full text-center text-[12px] text-slate-400/90 hover:text-slate-200 transition-colors"
          >
            Nanti saja
          </button>
        </div>
      </div>
    </div>
  )
}
