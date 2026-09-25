import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { MessageCircle, X, Loader2 } from 'lucide-react'
import { formatRupiah } from '@/utils'

/** Jam yang disarankan untuk dihubungi. Rentang, bukan menit persis: penjual
 *  menelepon balik dalam rentang waktu, bukan pada menit tertentu. */
const JAM = ['anytime', 'morning', 'noon', 'afternoon', 'evening']

/** Rencana pembelian sesuai skema yang dilayani ArahInn. */
const RENCANA = ['lelang', 'cessie', 'penjualan_bersama']

/**
 * Nomor telepon → tautan WhatsApp. `0812…` dan `+62812…` sama-sama dinormalkan
 * ke `62812…`; tanpa ini nomor berawalan nol menghasilkan tautan yang tidak
 * pernah sampai.
 */
export function waLink(phone, pesan) {
  let d = String(phone || '').replace(/\D/g, '')
  if (d.startsWith('0')) d = '62' + d.slice(1)
  else if (!d.startsWith('62')) d = '62' + d
  return `https://wa.me/${d}${pesan ? `?text=${encodeURIComponent(pesan)}` : ''}`
}

/**
 * Formulir minat properti — hasilnya dikirim sebagai pesan WhatsApp ke nomor
 * yang didaftarkan pemilik saat membuat listing.
 *
 * Pesannya disusun dengan label tebal dan satu butir per baris. Penjual membaca
 * ini di ponsel, sering sambil berkendara atau di antara panggilan; blok teks
 * yang padat praktis tidak terbaca. Perataan dengan spasi sengaja TIDAK dipakai
 * karena font WhatsApp proporsional — kolom tidak akan pernah lurus.
 */
export default function InterestModal({ property, onClose }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ nama: '', hp: '', email: '', jam: 'anytime', rencana: '' })
  const [dikirim, setDikirim] = useState(false)
  const [sentuh, setSentuh] = useState(false)
  const namaRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => namaRef.current?.focus(), 40)
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    // Latar belakang tidak boleh ikut bergulir saat modal terbuka.
    const sebelumnya = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = sebelumnya
    }
  }, [onClose])

  const ubah = (kolom) => (e) => setForm((f) => ({ ...f, [kolom]: e.target.value }))

  const salahNama    = form.nama.trim().length < 2
  const salahHp      = form.hp.replace(/\D/g, '').length < 8
  const salahRencana = !form.rencana
  // Email opsional; hanya divalidasi bila diisi.
  const salahEmail   = form.email.trim() !== '' && !/^\S+@\S+\.\S+$/.test(form.email.trim())
  const adaSalah     = salahNama || salahHp || salahRencana || salahEmail

  const susunPesan = () => {
    const baris = [
      `*${t('interest.waTitle')}*`,
      '',
      `*${t('interest.waProperty')}*`,
      `${t('interest.waId')}: #${property.id}`,
      `${t('interest.waName')}: ${property.title}`,
    ]
    if (property.price) baris.push(`${t('interest.waPrice')}: ${formatRupiah(property.price)}`)
    if (property.city)  baris.push(`${t('interest.waCity')}: ${property.city}`)
    if (typeof window !== 'undefined') {
      baris.push(`${t('interest.waLinkLabel')}: ${window.location.href}`)
    }

    baris.push('', `*${t('interest.waBuyer')}*`)
    baris.push(`${t('interest.fieldName')}: ${form.nama.trim()}`)
    baris.push(`${t('interest.fieldPhone')}: ${form.hp.trim()}`)
    if (form.email.trim()) baris.push(`${t('interest.fieldEmail')}: ${form.email.trim()}`)
    baris.push(`${t('interest.fieldTime')}: ${t(`interest.time.${form.jam}`)}`)
    baris.push(`${t('interest.fieldPlan')}: ${t(`interest.plan.${form.rencana}`)}`)
    baris.push('', t('interest.waFooter'))

    return baris.join('\n')
  }

  const kirim = (e) => {
    e.preventDefault()
    setSentuh(true)
    if (adaSalah) return
    setDikirim(true)
    // Dibuka lewat window.open, bukan href biasa: pesan disusun saat submit,
    // setelah validasi lolos.
    window.open(waLink(property.contactPhone, susunPesan()), '_blank', 'noopener,noreferrer')
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog" aria-modal="true" aria-labelledby="judul-minat"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="judul-minat" className="text-base font-extrabold text-slate-900">{t('interest.title')}</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{t('interest.subtitle')}</p>
          </div>
          <button
            type="button" onClick={onClose} aria-label={t('interest.close')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={kirim} className="space-y-4 px-5 py-5">
          {/* ID properti terisi sendiri dari properti yang dibuka — tidak bisa
              diketik supaya pesan yang sampai ke penjual tidak pernah salah
              menunjuk listing. */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {t('interest.propertyLabel')}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800 line-clamp-2">{property.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {t('interest.waId')}: <span className="font-semibold text-slate-700">#{property.id}</span>
              {property.city ? ` · ${property.city}` : ''}
            </p>
          </div>

          <Kolom label={t('interest.fieldName')} wajib error={sentuh && salahNama ? t('interest.errName') : ''}>
            <input
              ref={namaRef} value={form.nama} onChange={ubah('nama')}
              autoComplete="name" placeholder={t('interest.phName')} className={gayaInput}
            />
          </Kolom>

          <Kolom label={t('interest.fieldPhone')} wajib error={sentuh && salahHp ? t('interest.errPhone') : ''}>
            <input
              value={form.hp} onChange={ubah('hp')} inputMode="tel" autoComplete="tel"
              placeholder={t('interest.phPhone')} className={gayaInput}
            />
          </Kolom>

          <Kolom label={t('interest.fieldEmail')} error={sentuh && salahEmail ? t('interest.errEmail') : ''}>
            <input
              value={form.email} onChange={ubah('email')} inputMode="email" autoComplete="email"
              placeholder={t('interest.phEmail')} className={gayaInput}
            />
          </Kolom>

          <Kolom label={t('interest.fieldTime')}>
            <select value={form.jam} onChange={ubah('jam')} className={gayaInput}>
              {JAM.map((j) => <option key={j} value={j}>{t(`interest.time.${j}`)}</option>)}
            </select>
          </Kolom>

          <Kolom label={t('interest.fieldPlan')} wajib error={sentuh && salahRencana ? t('interest.errPlan') : ''}>
            <select value={form.rencana} onChange={ubah('rencana')} className={gayaInput}>
              <option value="">{t('interest.phPlan')}</option>
              {RENCANA.map((r) => <option key={r} value={r}>{t(`interest.plan.${r}`)}</option>)}
            </select>
          </Kolom>

          <button
            type="submit" disabled={dikirim}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-60"
          >
            {dikirim
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <MessageCircle className="h-4 w-4" />}
            {t('interest.submit')}
          </button>

          <p className="text-center text-[11px] leading-relaxed text-slate-400">
            {t('interest.note')}
          </p>
        </form>
      </div>
    </div>,
    document.body,
  )
}

const gayaInput =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500'

function Kolom({ label, wajib, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}{wajib ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-[11px] text-red-500">{error}</span> : null}
    </label>
  )
}
