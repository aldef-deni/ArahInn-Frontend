import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { MapPin, Navigation, Loader2, Building2 } from 'lucide-react'

/**
 * Input destinasi + dropdown ala Traveloka:
 *  - "Dekat saya" → minta lokasi browser, panggil onNearMe(lat, lng)
 *  - "Destinasi Populer" → kota dgn akomodasi terbanyak (yg sudah join ArahInn)
 * value/onChange untuk teks; onPickCity(city) saat pilih destinasi.
 *
 * Dropdown dirender via portal (fixed) supaya tidak terpotong oleh container
 * ber-overflow-hidden (hero search box).
 */
export default function DestinationSearch({
  value, onChange, onNearMe, onPickCity,
  placeholder = 'Kota, hotel, tempat wisata', inputClassName = '',
}) {
  const [open, setOpen]         = useState(false)
  const [locating, setLocating] = useState(false)
  const [geoErr, setGeoErr]     = useState('')
  const [rect, setRect]         = useState(null)
  const wrapRef = useRef(null)

  const { data: destinations = [] } = useQuery({
    queryKey: ['popular-destinations'],
    queryFn : () => hotelApi.popularDestinations().then(r => r.data?.data || []),
    staleTime: 10 * 60 * 1000,
  })

  const reposition = useCallback(() => {
    if (wrapRef.current) setRect(wrapRef.current.getBoundingClientRect())
  }, [])

  useEffect(() => {
    if (!open) return
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
  }, [open, reposition])

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

  const dropdown = open && rect ? createPortal(
    <div data-dest-dropdown
      style={{ position: 'fixed', top: rect.bottom + 8, left: rect.left, width: Math.max(rect.width, 300), maxWidth: '92vw' }}
      className="max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl z-[60] text-left">
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
          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left">
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
    </div>,
    document.body,
  ) : null

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={inputClassName}
      />
      {dropdown}
    </div>
  )
}
