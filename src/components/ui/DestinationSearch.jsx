import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { MapPin, Navigation, Loader2, Building2, ArrowLeft, Search, X } from 'lucide-react'

/**
 * Input destinasi + dropdown ala Traveloka:
 *  - "Dekat saya" → minta lokasi browser, panggil onNearMe(lat, lng)
 *  - "Destinasi Populer" → kota dgn akomodasi terbanyak (yg sudah join ArahInn)
 * value/onChange untuk teks; onPickCity(city) saat pilih destinasi.
 *
 * Desktop  : dropdown fixed di bawah input (portal, agar tidak ter-clip).
 * Mobile   : overlay full-screen — input di atas + daftar mengisi ruang di atas
 *            keyboard, jadi saran tidak pernah tertutup keyboard HP.
 */
export default function DestinationSearch({
  value, onChange, onNearMe, onPickCity,
  placeholder = 'Kota, hotel, tempat wisata', inputClassName = '',
}) {
  const [open, setOpen]         = useState(false)
  const [locating, setLocating] = useState(false)
  const [geoErr, setGeoErr]     = useState('')
  const [rect, setRect]         = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const wrapRef    = useRef(null)
  const overlayInputRef = useRef(null)

  const { data: destinations = [] } = useQuery({
    queryKey: ['popular-destinations'],
    queryFn : () => hotelApi.popularDestinations().then(r => r.data?.data || []),
    staleTime: 10 * 60 * 1000,
  })

  // Deteksi mobile (lebar < lg/1024) — reaktif terhadap resize/rotate.
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const reposition = useCallback(() => {
    if (wrapRef.current) setRect(wrapRef.current.getBoundingClientRect())
  }, [])

  // Desktop: reposisi dropdown + tutup saat klik di luar.
  useEffect(() => {
    if (!open || isMobile) return
    reposition()
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    const onDocClick = (e) => {
      if (wrapRef.current?.contains(e.target)) return
      if (e.target.closest?.('[data-dest-dropdown]')) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
      document.removeEventListener('mousedown', onDocClick)
    }
  }, [open, isMobile, reposition])

  // Mobile: kunci scroll body + fokus input overlay saat overlay terbuka.
  useEffect(() => {
    if (!(open && isMobile)) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const id = setTimeout(() => overlayInputRef.current?.focus(), 60)
    return () => { document.body.style.overflow = prev; clearTimeout(id) }
  }, [open, isMobile])

  const q = (value || '').toLowerCase()
  const filtered = q ? destinations.filter(d => (d.city || '').toLowerCase().includes(q)) : destinations

  const handleNearMe = () => {
    setGeoErr('')
    if (!navigator.geolocation) { setGeoErr('Browser tidak mendukung lokasi.'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); setOpen(false); onNearMe?.(pos.coords.latitude, pos.coords.longitude) },
      () => { setLocating(false); setGeoErr('Tidak bisa akses lokasi. Izinkan akses lokasi di browser.') },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  // Daftar saran (dipakai dropdown desktop & overlay mobile).
  const list = (
    <>
      {/* Dekat saya */}
      <button type="button" onClick={handleNearMe} disabled={locating}
        className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 hover:bg-blue-50 transition-colors text-left">
        <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          {locating ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Navigation className="w-[18px] h-[18px]" />}
        </span>
        <span className="font-semibold text-blue-600 text-sm">{locating ? 'Mencari lokasi…' : 'Dekat saya'}</span>
      </button>
      {geoErr && <p className="px-4 py-2 text-xs text-red-500">{geoErr}</p>}

      {/* Destinasi populer */}
      <p className="px-4 pt-3 pb-1.5 text-sm font-bold text-slate-900">Destinasi Populer</p>
      {filtered.length === 0 ? (
        <p className="px-4 py-3 text-xs text-slate-400">Tidak ada destinasi cocok.</p>
      ) : filtered.map((d) => (
        <button key={`${d.city}-${d.province}`} type="button"
          onClick={() => { onPickCity?.(d.city); setOpen(false) }}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left">
          <span className="flex items-center gap-2.5 min-w-0">
            <MapPin className="w-4 h-4 text-slate-300 shrink-0" />
            <span className="min-w-0">
              <span className="block font-semibold text-slate-800 text-sm truncate">{d.city}</span>
              <span className="block text-xs text-slate-400 truncate">{d.province || 'Indonesia'}</span>
            </span>
          </span>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Kota</span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1"><Building2 className="w-3 h-3" /> {d.hotelCount}</span>
          </span>
        </button>
      ))}
    </>
  )

  // Dropdown desktop
  const desktopDropdown = open && !isMobile && rect ? createPortal(
    <div data-dest-dropdown
      style={{ position: 'fixed', top: rect.bottom + 8, left: rect.left, width: Math.max(rect.width, 300), maxWidth: '92vw' }}
      className="max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl z-[60] text-left">
      {list}
    </div>,
    document.body,
  ) : null

  // Overlay full-screen mobile — input di atas, daftar di bawah (di atas keyboard).
  const mobileOverlay = open && isMobile ? createPortal(
    <div data-dest-dropdown className="fixed inset-0 z-[80] bg-white flex flex-col">
      {/* Header: tombol kembali + input pencarian */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-100"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        <button type="button" onClick={() => setOpen(false)} aria-label="Tutup"
          className="p-2 -ml-1 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex items-center gap-2 flex-1 bg-slate-100 rounded-2xl px-3.5 py-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={overlayInputRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 min-w-0 bg-transparent text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {value ? (
            <button type="button" onClick={() => onChange('')} aria-label="Hapus" className="shrink-0 p-0.5 rounded-full hover:bg-slate-200">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          ) : null}
        </div>
      </div>
      {/* Daftar saran — scroll, mengisi ruang di atas keyboard */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {list}
      </div>
    </div>,
    document.body,
  ) : null

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={(e) => {
          setOpen(true)
          // Mobile: blur input asli agar keyboard tak muncul di belakang overlay;
          // overlay punya input sendiri yang auto-focus.
          if (window.innerWidth < 1024) e.target.blur()
        }}
        placeholder={placeholder}
        className={inputClassName}
      />
      {desktopDropdown}
      {mobileOverlay}
    </div>
  )
}
