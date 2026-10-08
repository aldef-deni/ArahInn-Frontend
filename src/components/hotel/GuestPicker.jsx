import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Plus, Minus, ChevronDown, X } from 'lucide-react'
import {
  KAMAR_MAKS, DEWASA_MAKS, ANAK_MAKS, UMUR_ANAK_MAKS,
  totalDewasa, totalAnak,
} from '@/utils/occupancy'

/**
 * Pemilih kamar & tamu, dengan umur anak per kamar.
 *
 * Menggantikan satu dropdown "jumlah tamu". Dropdown itu tidak bisa menyatakan
 * anak sama sekali — dan umur anak MENENTUKAN HARGA di sisi supplier, bukan
 * sekadar keterangan. Tanpa ini, tamu yang membawa anak mendapat tarif dewasa
 * dan ditolak saat check-in, atau tidak bisa memesan sama sekali.
 *
 * Komposisi dibuat per kamar, bukan satu angka untuk semua: kamar yang isinya
 * berbeda adalah hal biasa (orang tua di satu kamar, anak-anak di kamar lain),
 * dan ETG memakai tepat kasus itu sebagai skenario sertifikasi multiroom.
 */
export default function GuestPicker({ value, onChange, className = '' }) {
  const { t } = useTranslation()
  const [buka, setBuka] = useState(false)
  const wadah = useRef(null)

  // Tutup saat klik di luar. Tanpa ini panelnya menutupi hasil pencarian dan
  // satu-satunya cara menutupnya adalah menekan tombolnya lagi.
  useEffect(() => {
    if (!buka) return
    const diLuar = (e) => { if (wadah.current && !wadah.current.contains(e.target)) setBuka(false) }
    document.addEventListener('mousedown', diLuar)
    return () => document.removeEventListener('mousedown', diLuar)
  }, [buka])

  const rooms = Array.isArray(value) && value.length ? value : [{ adults: 2, children: [] }]

  const ubahKamar = (i, patch) =>
    onChange(rooms.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const ubahDewasa = (i, delta) =>
    ubahKamar(i, { adults: Math.min(DEWASA_MAKS, Math.max(1, rooms[i].adults + delta)) })

  const ubahAnak = (i, delta) => {
    const anak = rooms[i].children ?? []
    if (delta > 0 && anak.length >= ANAK_MAKS) return
    if (delta < 0 && anak.length === 0) return
    // Anak baru lahir dengan umur 7: angka yang jelas-jelas harus diganti,
    // bukan 0 yang terlihat seperti sudah diisi dengan benar.
    ubahKamar(i, { children: delta > 0 ? [...anak, 7] : anak.slice(0, -1) })
  }

  const ubahUmur = (i, j, umur) =>
    ubahKamar(i, { children: rooms[i].children.map((u, idx) => (idx === j ? Number(umur) : u)) })

  const ringkas = [
    t('occupancy.summaryRooms', { rooms: rooms.length }),
    t('occupancy.summaryGuests', { adults: totalDewasa(rooms) }),
  ].join(' · ') + (totalAnak(rooms) ? t('occupancy.summaryChildren', { children: totalAnak(rooms) }) : '')

  return (
    <div ref={wadah} className={`relative ${className}`}>
      <button
        type="button" onClick={() => setBuka(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-left hover:border-slate-300"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Users className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">{ringkas}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${buka ? 'rotate-180' : ''}`} />
      </button>

      {buka && (
        <div className="absolute z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] right-0 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 max-h-[70vh] overflow-y-auto">
          {rooms.map((kamar, i) => (
            <div key={i} className={i > 0 ? 'mt-4 pt-4 border-t border-slate-100' : ''}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-slate-900">{t('occupancy.room', { n: i + 1 })}</span>
                {rooms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onChange(rooms.filter((_, idx) => idx !== i))}
                    className="inline-flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />{t('occupancy.removeRoom')}
                  </button>
                )}
              </div>

              <Baris label={t('occupancy.adults')} nilai={kamar.adults}
                     kurang={() => ubahDewasa(i, -1)} tambah={() => ubahDewasa(i, +1)}
                     bisaKurang={kamar.adults > 1} bisaTambah={kamar.adults < DEWASA_MAKS} />

              <Baris label={t('occupancy.children')} nilai={(kamar.children ?? []).length}
                     kurang={() => ubahAnak(i, -1)} tambah={() => ubahAnak(i, +1)}
                     bisaKurang={(kamar.children ?? []).length > 0}
                     bisaTambah={(kamar.children ?? []).length < ANAK_MAKS} />

              {(kamar.children ?? []).length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {kamar.children.map((umur, j) => (
                    <label key={j} className="block">
                      <span className="block text-[10px] text-slate-500 mb-1">
                        {t('occupancy.childAge', { n: j + 1 })}
                      </span>
                      <select
                        value={umur} onChange={(e) => ubahUmur(i, j, e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm"
                      >
                        {Array.from({ length: UMUR_ANAK_MAKS + 1 }, (_, u) => (
                          <option key={u} value={u}>
                            {u === 0 ? t('occupancy.childAgeUnder1') : t('occupancy.childAgeYears', { n: u })}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">{t('occupancy.childAgeNote')}</p>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button" disabled={rooms.length >= KAMAR_MAKS}
              onClick={() => onChange([...rooms, { adults: 2, children: [] }])}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />{t('occupancy.addRoom')}
            </button>
            <button
              type="button" onClick={() => setBuka(false)}
              className="px-4 py-1.5 rounded-lg bg-brand text-white text-[12px] font-bold"
            >
              {t('occupancy.done')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Baris({ label, nilai, kurang, tambah, bisaKurang, bisaTambah }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <Tombol onClick={kurang} disabled={!bisaKurang}><Minus className="w-3.5 h-3.5" /></Tombol>
        <span className="w-6 text-center text-sm font-bold tabular-nums">{nilai}</span>
        <Tombol onClick={tambah} disabled={!bisaTambah}><Plus className="w-3.5 h-3.5" /></Tombol>
      </div>
    </div>
  )
}

function Tombol({ onClick, disabled, children }) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}
