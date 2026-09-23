import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Search, Globe } from 'lucide-react'
import { sortedCountries, countryName } from '@/data/countries'
import { useResidencyStore } from '@/store/residencyStore'

/**
 * Bendera emoji dari kode ISO2. 'ID' → 🇮🇩
 *
 * Huruf A–Z dipetakan ke Regional Indicator Symbol (U+1F1E6…) dengan menggeser
 * 127397 dari kode ASCII-nya. Tidak perlu aset gambar sama sekali.
 */
const bendera = (kode) =>
  String.fromCodePoint(...[...kode.toUpperCase()].map((c) => c.charCodeAt(0) + 127397))

/**
 * Pemilih kewarganegaraan / negara domisili untuk properti mitra.
 *
 * Kenapa customer perlu memilih ini: sebagian tarif hotel hanya boleh dijual
 * kepada penduduk negara tertentu. Tanpa kode negara yang benar, tarif yang
 * tampil bisa berbeda dari yang sebenarnya boleh dipesan — dan baru ketahuan
 * saat prebook, yaitu saat customer sudah memilih kamar.
 *
 * Nilainya dibaca dari store bersama supaya halaman pencarian dan halaman
 * detail tidak pernah memakai negara yang berbeda.
 *
 * `variant`:
 *   'terang' — untuk latar putih (kartu, panel)
 *   'gelap'  — untuk latar gambar/gradien (header hasil pencarian)
 */
export default function ResidencySelect({ variant = 'terang', className = '' }) {
  const { t, i18n } = useTranslation()
  const residency    = useResidencyStore((s) => s.residency)
  const setResidency = useResidencyStore((s) => s.setResidency)

  const [buka, setBuka]   = useState(false)
  const [cari, setCari]   = useState('')
  const [sorot, setSorot] = useState(0)
  const [posisi, setPosisi] = useState(null)

  const tombolRef = useRef(null)
  const panelRef  = useRef(null)
  const cariRef   = useRef(null)

  const negara = useMemo(() => sortedCountries(i18n.language), [i18n.language])
  const terpilih = negara.find((n) => n.code === residency) ?? negara[0]

  const hasil = useMemo(() => {
    const kunci = cari.trim().toLowerCase()
    if (!kunci) return negara
    return negara.filter(
      (n) =>
        n.id.toLowerCase().includes(kunci) ||
        n.en.toLowerCase().includes(kunci) ||
        n.code.toLowerCase() === kunci,
    )
  }, [negara, cari])

  const bukaPanel = () => {
    const r = tombolRef.current?.getBoundingClientRect()
    if (!r) return
    // Panel dibuka ke atas bila ruang di bawah tidak cukup, supaya daftarnya
    // tidak terpotong tepi layar pada perangkat pendek.
    const tinggi = 340
    const keBawah = window.innerHeight - r.bottom > tinggi || r.top < tinggi
    setPosisi({
      left  : Math.min(r.left, window.innerWidth - 300 - 12),
      top   : keBawah ? r.bottom + 8 : undefined,
      bottom: keBawah ? undefined : window.innerHeight - r.top + 8,
      width : Math.max(r.width, 280),
    })
    setCari('')
    setSorot(0)
    setBuka(true)
  }

  useEffect(() => {
    if (!buka) return
    const timer = setTimeout(() => cariRef.current?.focus(), 30)
    const tutupSaatGeser = () => setBuka(false)
    const klikLuar = (e) => {
      if (panelRef.current?.contains(e.target) || tombolRef.current?.contains(e.target)) return
      setBuka(false)
    }
    window.addEventListener('scroll', tutupSaatGeser, true)
    window.addEventListener('resize', tutupSaatGeser)
    document.addEventListener('mousedown', klikLuar)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', tutupSaatGeser, true)
      window.removeEventListener('resize', tutupSaatGeser)
      document.removeEventListener('mousedown', klikLuar)
    }
  }, [buka])

  const pilih = (kode) => {
    setResidency(kode)
    setBuka(false)
  }

  const tombolTekan = (e) => {
    if (e.key === 'Escape') { setBuka(false); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSorot((i) => Math.min(i + 1, hasil.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSorot((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && hasil[sorot]) {
      e.preventDefault()
      pilih(hasil[sorot].code)
    }
  }

  const gelap = variant === 'gelap'

  return (
    <>
      <button
        ref={tombolRef}
        type="button"
        onClick={() => (buka ? setBuka(false) : bukaPanel())}
        title={t('residency.hint')}
        className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
          gelap
            ? 'border-white/25 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md'
            : 'border-slate-200 bg-white text-slate-700 hover:border-brand/40 hover:bg-slate-50'
        } ${className}`}
      >
        <Globe className={`w-3.5 h-3.5 shrink-0 ${gelap ? 'text-white/70' : 'text-slate-400'}`} />
        <span className={gelap ? 'text-white/70 font-medium' : 'text-slate-400 font-medium'}>
          {t('residency.label')}
        </span>
        <span className="text-base leading-none">{bendera(terpilih.code)}</span>
        <span className="max-w-[9rem] truncate">{countryName(terpilih, i18n.language)}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${buka ? 'rotate-180' : ''} ${
            gelap ? 'text-white/70' : 'text-slate-400'
          }`}
        />
      </button>

      {buka && posisi && createPortal(
        <div
          ref={panelRef}
          onKeyDown={tombolTekan}
          style={{ left: posisi.left, top: posisi.top, bottom: posisi.bottom, width: posisi.width }}
          className="fixed z-[60] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="p-2.5 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={cariRef}
                value={cari}
                onChange={(e) => { setCari(e.target.value); setSorot(0) }}
                placeholder={t('residency.search')}
                className="w-full pl-8 pr-2 py-2 text-xs rounded-lg bg-slate-50 border border-slate-200 focus:border-brand/50 focus:bg-white outline-none transition-colors"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {hasil.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-slate-400">{t('residency.empty')}</p>
            ) : (
              hasil.map((n, i) => {
                const aktif = n.code === residency
                return (
                  <button
                    key={n.code}
                    type="button"
                    onMouseEnter={() => setSorot(i)}
                    onClick={() => pilih(n.code)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                      i === sorot ? 'bg-brand/5' : ''
                    } ${aktif ? 'font-bold text-brand' : 'text-slate-700'}`}
                  >
                    <span className="text-base leading-none">{bendera(n.code)}</span>
                    <span className="flex-1 truncate">{countryName(n, i18n.language)}</span>
                    <span className="text-[10px] text-slate-400 tabular-nums">{n.code}</span>
                    {aktif && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>

          <p className="px-3 py-2 border-t border-slate-100 bg-slate-50 text-[10px] leading-relaxed text-slate-500">
            {t('residency.hint')}
          </p>
        </div>,
        document.body,
      )}
    </>
  )
}
