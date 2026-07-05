import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  TrainFront, ArrowRight, Clock, User, Calendar, Phone, CreditCard,
  Loader2, AlertCircle, CheckCircle2, ChevronLeft, ShieldCheck, Mail, X, Users, ChevronRight,
  Armchair, Check, ChevronUp, ChevronDown,
} from 'lucide-react'
import { travelApi } from '@/services/index'
import { formatRupiah } from '@/utils'
import SEO from '@/components/SEO'
import DateField from '@/components/ui/DateField'
import PromoField from '@/components/travel/PromoField'
import { travelCheckoutError } from '@/utils/travelCheckoutError'

const gradeLabel = (g) => ({ E: 'Eksekutif', B: 'Bisnis', K: 'Ekonomi' }[g] || g || '-')
const formatDMY = (ymd) => { if (!ymd) return '-'; const [y,m,d] = ymd.split('-'); return `${d}/${m}/${y}` }

function emptyAdult()  { return { name: '', birthdate: '', phone: '', idNumber: '', kiaNumber: '' } }
function emptyChild()  { return { name: '', birthdate: '', idNumber: '' } }
function emptyInfant() { return { name: '', birthdate: '', idNumber: '' } }

export default function TrainBooking() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const sel = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('train_selection') || 'null') } catch { return null }
  }, [])

  const [adults, setAdults]   = useState([])
  const [children, setChildren] = useState([])
  const [infants, setInfants] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [booked, setBooked]   = useState(null)  // hasil book
  const [appliedPromo, setAppliedPromo] = useState(null)   // { code, discount }
  // Data pemesan (kontak) — e-tiket dikirim ke kontak ini.
  const [contact, setContact] = useState({ name: '', phone: '', email: '' })
  const [contactDone, setContactDone] = useState(false)
  const [showContact, setShowContact] = useState(false)
  // Seat selection (setelah book): Modal 1 ringkasan, Modal 2 denah kursi.
  const [bookingResult, setBookingResult] = useState(null)   // hasil checkout (kode, vendor codes, seats)
  const [chosenSeats, setChosenSeats] = useState([])         // seat per penumpang bayar (aligned)
  const [showSeatSummary, setShowSeatSummary] = useState(false)
  const [showSeatPicker, setShowSeatPicker] = useState(false)

  useEffect(() => {
    if (!sel) { navigate('/tiket/kereta', { replace: true }); return }
    // Pulihkan draft penumpang & kontak agar isian tak hilang saat balik (back).
    let draft = null
    try { draft = JSON.parse(sessionStorage.getItem('train_pax_draft') || 'null') } catch { draft = null }
    const build = (count, make, saved) => Array.from({ length: count }, (_, i) => ({ ...make(), ...(saved?.[i] || {}) }))
    setAdults(build(sel.adult || 1, emptyAdult, draft?.adults))
    setChildren(build(sel.child || 0, emptyChild, draft?.children))
    setInfants(build(sel.infant || 0, emptyInfant, draft?.infants))
    const c = draft?.contact
    const contactOk = !!(c?.name && c?.phone && c?.email)
    if (c) setContact(prev => ({ ...prev, ...c }))
    setContactDone(contactOk)
    setShowContact(!contactOk)  // modal Data Pemesan muncul otomatis hanya bila kontak belum lengkap
  }, [sel, navigate])

  // Simpan draft tiap perubahan (bertahan lintas navigasi dalam satu sesi).
  useEffect(() => {
    if (!adults.length && !children.length && !infants.length) return
    try { sessionStorage.setItem('train_pax_draft', JSON.stringify({ adults, children, infants, contact })) } catch { /* abaikan */ }
  }, [adults, children, infants, contact])

  if (!sel) return null

  const { origin, destination, date, train, seat } = sel
  const priceAdult = Number(seat?.priceAdult) || 0
  const priceChild = Number(seat?.priceChild) || priceAdult
  const svcFee     = sel.svcFee || { amount: 0, percent: 0 }
  const payingPax  = (sel.adult || 1) + (sel.child || 0)            // bayi tidak kena kursi
  const pax        = payingPax
  const ticketSub  = (priceAdult * (sel.adult || 1)) + (priceChild * (sel.child || 0))
  // Convenience Fee: persen → % dari subtotal tiket; selain itu nominal × pax.
  const markupSub  = Number(svcFee.percent) > 0
    ? Math.round(Number(svcFee.percent) / 100 * ticketSub)
    : (Number(svcFee.amount) || 0) * payingPax
  // Biaya Penanganan: nominal flat per pesanan (biaya admin).
  const adminFee   = Number(svcFee.adminAmount) || 0
  const total      = ticketSub + markupSub + adminFee
  const promoDiscount = appliedPromo?.discount || 0
  const finalTotal    = Math.max(0, total - promoDiscount)

  // Deadline countdown (ms) di-anchor ke jam CLIENT saat booking dibuat, dari sisa detik server
  // (time_left_seconds) → bebas selisih jam & tak pernah lewat dari window (mis. 60:00).
  const payDeadlineMs = useMemo(() => {
    const s = bookingResult?.timeLeftSeconds
    return s == null ? null : Date.now() + Math.max(0, Number(s)) * 1000
  }, [bookingResult])

  // Batas tanggal lahir: dewasa min. 3 tahun (lahir ≤ 3 thn lalu), bayi maks. 3 tahun (lahir ≥ 3 thn lalu).
  const _todayD   = new Date()
  const _pad2     = n => String(n).padStart(2, '0')
  const _fmtDate  = d => `${d.getFullYear()}-${_pad2(d.getMonth() + 1)}-${_pad2(d.getDate())}`
  const todayStr        = _fmtDate(_todayD)
  const threeYearsAgoStr = _fmtDate(new Date(_todayD.getFullYear() - 3, _todayD.getMonth(), _todayD.getDate()))

  const setAdultField  = (i, k, v) => setAdults(a => a.map((p, idx) => idx === i ? { ...p, [k]: v } : p))
  const setChildField  = (i, k, v) => setChildren(a => a.map((p, idx) => idx === i ? { ...p, [k]: v } : p))
  const setInfantField = (i, k, v) => setInfants(a => a.map((p, idx) => idx === i ? { ...p, [k]: v } : p))

  const contactValid = contact.name.trim() && contact.phone.replace(/\D/g, '').length >= 8 && /\S+@\S+\.\S+/.test(contact.email)
  const valid = contactDone && contactValid
             && adults.every(p => p.name && p.birthdate && p.phone && /^\d{16}$/.test(p.idNumber))
             && children.every(p => p.name && p.birthdate && /^\d{16}$/.test(p.idNumber))
             && infants.every(p => p.name && p.birthdate)

  const adultNikError = () => {
    for (let i = 0; i < adults.length; i++) {
      const p = adults[i]
      const who = t('travel.adultPax', { n: i + 1 })
      if (!p.idNumber) return t('travel.errNeedNik', { who })
      if (!/^\d{16}$/.test(p.idNumber)) return t('travel.errNikDigits', { who })
    }
    return null
  }

  const submit = async () => {
    const childKiaError = () => {
      for (let i = 0; i < children.length; i++) {
        const p = children[i]

        if (!p.idNumber)
          return `No. KIA Anak ${i + 1} wajib diisi.`

        if (!/^\d{16}$/.test(p.idNumber))
          return `No. KIA Anak ${i + 1} harus terdiri dari 16 digit angka.`

      }

      return null
    }
const nikError = adultNikError()
    const kiaError = childKiaError()

    if (!contactDone || !contactValid) {
      setShowContact(true)
      setError('Lengkapi Data Pemesan (nama, no. telp, email) terlebih dahulu.')
      return
    }
    if (!valid || nikError || kiaError) {
      setError(
        nikError ||
        kiaError ||
        'Lengkapi semua data penumpang.'
      )
      return
    }
     setLoading(true); setError(null)
    try {
      const res = await travelApi.checkout({
        moda: 'kereta',
        origin: origin.idStasiun,
        destination: destination.idStasiun,
        date,
        train_number: train.trainNumber,
        grade: seat.grade,
        class: seat.class,
        adult: sel.adult || 1,
        child: sel.child || 0,
        infant: sel.infant || 0,
        price_adult: priceAdult,
        price_child: priceChild,
        markup: markupSub,
        promo_code: appliedPromo?.code || undefined,
        train_name: train.trainName,
        departure_station: origin.namaStasiun,
        departure_time: train.departureTime,
        arrival_station: destination.namaStasiun,
        arrival_time: train.arrivalTime,
        contact: { name: contact.name, email: contact.email, phone: contact.phone },
        passengers: {
          adults: adults.map(p => ({ name: p.name, birthdate: p.birthdate, phone: p.phone, id_number: p.idNumber, kia_number: p.kiaNumber || '' })),
          children: children.map(p => ({ name: p.name, birthdate: p.birthdate, id_number: p.idNumber })),
          infants: infants.map(p => ({ name: p.name, birthdate: p.birthdate, id_number: p.idNumber || '' })),
        },
      })
      const booking = res.data?.data
      if (booking?.code || booking?.id) {
        // Booking berhasil (kursi auto-assigned vendor). Tampilkan Modal 1 untuk
        // konfirmasi kursi + opsi ganti nomor kursi sebelum lanjut bayar.
        setBookingResult(booking)
        setChosenSeats(Array.isArray(booking?.meta?.book?.seats) ? booking.meta.book.seats : [])
        setShowSeatSummary(true)
      } else setError('Gagal membuat pesanan.')
    } catch (e) {
      setError(travelCheckoutError(e))
    } finally {
      setLoading(false)
    }
  }

  /* ── Booking sukses ─────────────────────────────────────────── */
  if (booked) {
    return (
      <div className="min-h-[70vh] bg-slate-50">
        <SEO title="Booking Kereta Berhasil" url="/tiket/kereta/pesan" />
        <div className="container max-w-lg py-8">
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h1 className="font-display text-xl font-bold text-slate-900">Booking Berhasil Dibuat</h1>
            <p className="text-sm text-slate-500 mt-1">Selesaikan pembayaran sebelum batas waktu.</p>

            <div className="mt-5 space-y-2.5 text-left bg-slate-50 rounded-xl p-4">
              <Row label="Kode Booking" value={booked.bookingCode} mono />
              <Row label="ID Transaksi" value={booked.transactionId} mono />
              <Row label="Kereta" value={train.trainName} />
              <Row label="Rute" value={`${origin.namaStasiun} → ${destination.namaStasiun}`} />
              <Row label="Batas Bayar" value={booked.timeLimit} />
              <div className="border-t border-dashed border-slate-200 my-1" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-500">Total</span>
                <span className="font-display text-lg font-bold text-orange-600">{formatRupiah(finalTotal)}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800">Pembayaran (potong saldo & issue e-tiket) sedang difinalisasi. Tim akan memproses booking ini.</p>
            </div>

            <button onClick={() => navigate('/tiket/kereta')} className="w-full mt-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50">
              Cari Tiket Lain
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Form penumpang ─────────────────────────────────────────── */
  return (
    <div className="min-h-[70vh] bg-slate-50">
      <SEO title="Data Penumpang — Tiket Kereta" url="/tiket/kereta/pesan" />
      <div className="container max-w-lg py-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 mb-4 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" /> Kembali
        </button>

        {/* Jadwal & kereta yang dipilih */}
        <div className="mb-4"><TripSummaryCard sel={sel} /></div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Data Pemesan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
          <p className="font-bold text-sm text-slate-900 flex items-center gap-1.5"><Users className="w-4 h-4 text-orange-500" /> Data Pemesan</p>
          <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Semua e-Tiket / voucher akan kami kirimkan ke kontak ini.</p>
          {contactDone && contactValid ? (
            <button onClick={() => setShowContact(true)} className="w-full flex items-center justify-between gap-2 border border-slate-200 rounded-xl px-3.5 py-3 hover:bg-slate-50 text-left">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-900 truncate">{contact.name}</p>
                <p className="text-xs text-slate-500 truncate">{contact.phone} · {contact.email}</p>
              </div>
              <span className="text-xs font-semibold text-orange-600 shrink-0">Ubah</span>
            </button>
          ) : (
            <button onClick={() => setShowContact(true)} className="w-full flex items-center justify-between gap-2 border border-dashed border-orange-300 bg-orange-50/50 rounded-xl px-3.5 py-3 text-orange-600 font-semibold text-sm hover:bg-orange-50">
              <span className="flex items-center gap-2"><User className="w-4 h-4" /> Isi Data Pemesan</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Detail Penumpang */}
        <p className="font-bold text-sm text-slate-900 mb-2 mt-1 px-1">Detail Penumpang</p>

        {/* Passenger forms */}
        {adults.map((p, i) => (
          <div key={`a${i}`} className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
            <p className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5"><User className="w-4 h-4 text-orange-500" /> Penumpang Dewasa {i + 1}</p>
            <div className="space-y-2.5">
              <Field label="Nama Lengkap (sesuai KTP)" icon={User} value={p.name} onChange={v => setAdultField(i, 'name', v)} placeholder="Nama sesuai identitas" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <DateField label="Tanggal Lahir" value={p.birthdate} onChange={v => setAdultField(i, 'birthdate', v)} max={threeYearsAgoStr} />
                <Field label="No. HP" icon={Phone} value={p.phone} onChange={v => setAdultField(i, 'phone', v.replace(/[^0-9]/g, '').slice(0, 15))} placeholder="08xxx" inputMode="numeric" maxLength={15} />
              </div>
              <Field label="No. KTP / NIK" icon={CreditCard} value={p.idNumber} onChange={v => setAdultField(i, 'idNumber', v.replace(/\D/g, '').slice(0, 16))} placeholder="16 digit NIK" inputMode="numeric" maxLength={16} />
              <Field
                label="Input Nomor KIA"
                icon={CreditCard}
                value={p.kiaNumber}
                onChange={v => setAdultField(i, 'kiaNumber', v.replace(/\D/g, '').slice(0, 16))}
                placeholder="Opsional, 16 digit"
                inputMode="numeric"
                maxLength={16}
              />
            </div>
          </div>
        ))}

        {children.map((p, i) => (
          <div key={`c${i}`} className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
            <p className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5"><User className="w-4 h-4 text-amber-500" /> Anak-anak {i + 1}</p>
            <div className="space-y-2.5">
              <Field label="Nama Lengkap Anak" icon={User} value={p.name} onChange={v => setChildField(i, 'name', v)} placeholder="Nama sesuai KIA" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <DateField label="Tanggal Lahir" value={p.birthdate} onChange={v => setChildField(i, 'birthdate', v)} />
                <Field
                  label="No. Induk KIA"
                  icon={CreditCard}
                  value={p.idNumber}
                  onChange={v =>
                    setChildField(
                      i,
                      'idNumber',
                      v.replace(/\D/g, '').slice(0, 16)
                    )
                  }
                  placeholder="Nomor KIA anak"
                  inputMode="numeric"
                  maxLength={16}
                />
              </div>
              <p className="text-[11px] text-slate-400">Kategori anak untuk tiket kereta: usia 3-12 tahun.</p>
            </div>
          </div>
        ))}

        {infants.map((p, i) => (
          <div key={`inf${i}`} className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
            <p className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5"><User className="w-4 h-4 text-sky-500" /> Bayi {i + 1}</p>
            <div className="space-y-2.5">
              <Field label="Nama Lengkap" icon={User} value={p.name} onChange={v => setInfantField(i, 'name', v)} placeholder="Nama bayi" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <DateField label="Tanggal Lahir" value={p.birthdate} onChange={v => setInfantField(i, 'birthdate', v)} min={threeYearsAgoStr} max={todayStr} />
                <Field
                  label="Input Nomor KIA"
                  icon={CreditCard}
                  value={p.idNumber}
                  onChange={v => setInfantField(i, 'idNumber', v.replace(/\D/g, '').slice(0, 16))}
                  placeholder="Opsional, 16 digit"
                  inputMode="numeric"
                  maxLength={16}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Kode promo */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
          <PromoField moda="kereta" total={total} departDate={date} onApplied={setAppliedPromo} />
        </div>

        {/* Rincian harga */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
          <p className="font-bold text-sm text-slate-900 mb-2.5">Rincian Harga</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Harga tiket ({pax} × {formatRupiah(priceAdult)})</span><span className="text-slate-900">{formatRupiah(ticketSub)}</span></div>
            {markupSub > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">Convenience Fee</span><span className="text-slate-900">{formatRupiah(markupSub)}</span></div>
            )}
            {adminFee > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">Biaya Penanganan</span><span className="text-slate-900">{formatRupiah(adminFee)}</span></div>
            )}
            {promoDiscount > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">Diskon Promo {appliedPromo?.code ? `(${appliedPromo.code})` : ''}</span><span className="font-medium text-green-600">- {formatRupiah(promoDiscount)}</span></div>
            )}
            <div className="flex justify-between pt-1.5 border-t border-slate-100"><span className="font-bold text-slate-900">Total</span><span className="font-bold text-orange-600">{formatRupiah(finalTotal)}</span></div>
          </div>
        </div>

        {/* Price + submit */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky bottom-2 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Total ({sel.adult || 1} dewasa{(sel.child || 0) > 0 ? `, ${sel.child} anak` : ''}{(sel.infant || 0) > 0 ? `, ${sel.infant} bayi` : ''})</p>
              <p className="font-display text-xl font-bold text-orange-600">{formatRupiah(finalTotal)}</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600"><ShieldCheck className="w-3.5 h-3.5" /> Resmi KAI</div>
          </div>
          <button onClick={submit} disabled={!valid || loading}
            className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses booking...</> : <>Lanjutkan ke Pembayaran <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>

      {showContact && (
        <ContactModal
          sel={sel}
          initial={contact}
          onClose={() => setShowContact(false)}
          onSubmit={(c) => {
            setContact(c); setContactDone(true); setShowContact(false); setError(null)
            // Auto-isi nama & No. HP Penumpang Dewasa 1 dari data pemesan bila masih kosong (tetap bisa diubah).
            setAdults(prev => prev.map((p, i) => i === 0
              ? { ...p, name: p.name?.trim() ? p.name : c.name, phone: p.phone?.trim() ? p.phone : c.phone }
              : p))
          }}
        />
      )}

      {/* Modal 1 — ringkasan kursi + rincian harga */}
      {showSeatSummary && bookingResult && (
        <SeatSummaryModal
          sel={sel}
          deadlineMs={payDeadlineMs}
          pax={[...adults.map(p => ({ name: p.name, type: 'Dewasa' })), ...children.map(p => ({ name: p.name, type: 'Anak' }))]}
          seats={chosenSeats}
          price={{ ticketSub, markupSub, adminFee, finalTotal, priceAdult, adult: sel.adult || 1, child: sel.child || 0, priceChild, originName: origin.namaStasiun }}
          onPickSeat={() => setShowSeatPicker(true)}
          onConfirm={() => { try { sessionStorage.removeItem('train_pax_draft') } catch { /* abaikan */ } navigate(`/tiket/bayar/${bookingResult.code ?? bookingResult.id}`, { state: { moda: 'kereta' } }) }}
          onClose={() => setShowSeatSummary(false)}
        />
      )}

      {/* Modal 2 — denah kursi gerbong */}
      {showSeatPicker && bookingResult && (
        <SeatPickerModal
          sel={sel}
          deadlineMs={payDeadlineMs}
          paxCount={(sel.adult || 1) + (sel.child || 0)}
          paxNames={[...adults.map(p => p.name), ...children.map(p => p.name)]}
          bookingCode={bookingResult.vendorBookingCode ?? bookingResult.meta?.book?.bookingCode}
          transactionId={bookingResult.vendorTransactionId ?? bookingResult.meta?.book?.transactionId}
          initialSeats={chosenSeats}
          onClose={() => setShowSeatPicker(false)}
          onSaved={(newSeats) => { setChosenSeats(newSeats); setShowSeatPicker(false) }}
        />
      )}
    </div>
  )
}

// Ringkasan jadwal & kereta yang dipilih — dipakai di halaman & modal Data Pemesan.
function TripSummaryCard({ sel }) {
  const { origin, destination, date, train, seat } = sel
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0"><TrainFront className="w-4 h-4 text-orange-600" /></div>
          <span className="font-bold text-sm text-slate-900">Kereta Api</span>
        </div>
        <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0"><Calendar className="w-3 h-3" />{formatDMY(date)}</span>
      </div>
      <div className="flex items-start justify-between gap-3 mt-3">
        <div className="min-w-0">
          <p className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
            <span className="truncate">{origin.namaStasiun}</span>
            <ArrowRight className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="truncate">{destination.namaStasiun}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{train.trainName} · {gradeLabel(seat.grade)} ({seat.class}) · NOMOR KA: {train.trainNumber}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-slate-900 text-sm whitespace-nowrap">{train.departureTime} - {train.arrivalTime}</p>
          <p className="text-[10px] text-slate-400 flex items-center justify-end gap-0.5"><Clock className="w-2.5 h-2.5" />{train.duration}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">Tidak bisa Refund</span>
        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">Tidak bisa Reschedule</span>
      </div>
    </div>
  )
}

// Modal "Isi Data Pemesan" — kontak penerima e-tiket (Nama Lengkap, No. Telp, Email).
function ContactModal({ sel, initial, onClose, onSubmit }) {
  const [form, setForm] = useState(initial || { name: '', phone: '', email: '' })
  const [err, setErr]   = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handle = () => {
    if (!form.name.trim())                       return setErr('Nama lengkap wajib diisi.')
    if (form.phone.replace(/\D/g, '').length < 8) return setErr('No. telp minimal 8 digit.')
    if (!/\S+@\S+\.\S+/.test(form.email))         return setErr('Email belum valid.')
    onSubmit({ name: form.name.trim(), phone: form.phone, email: form.email.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50" onClick={onClose}>
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0"><Users className="w-4.5 h-4.5 text-orange-600" /></div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm">Isi Data Pemesan</h3>
              <p className="text-[11px] text-slate-400">E-Tiket dikirim ke kontak ini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 shrink-0"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-5 py-4 space-y-3 flex-1 overflow-y-auto">
          {sel && <TripSummaryCard sel={sel} />}
          {err && (
            <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><p className="text-xs text-red-700">{err}</p>
            </div>
          )}
          <Field label="Nama Lengkap" icon={User} value={form.name} onChange={v => set('name', v)} placeholder="Nama pemesan" />
          <Field label="No. Telp" icon={Phone} value={form.phone} onChange={v => set('phone', v.replace(/[^0-9]/g, '').slice(0, 15))} placeholder="08xxxxxxxxxx" inputMode="numeric" maxLength={15} />
          <Field label="Email" icon={Mail} value={form.email} onChange={v => set('email', v)} placeholder="nama@email.com" type="email" />
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3.5 border-t border-slate-100 bg-slate-50 shrink-0">
          <button onClick={handle}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">
            Lanjut ke Data Penumpang <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Countdown pembayaran: deadline (ms) sudah di-anchor ke jam CLIENT di induk (bebas
// selisih jam server/klien). Dipakai bersama Modal 1 & Modal 2.
function usePayCountdownMs(deadlineMs) {
  const [nowMs, setNowMs] = useState(Date.now())
  useEffect(() => {
    if (!deadlineMs) return
    const t = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(t)
  }, [deadlineMs])
  const validDl  = !!deadlineMs
  const remainMs = validDl ? Math.max(0, deadlineMs - nowMs) : 0
  return {
    validDl,
    cdExpired: validDl && remainMs <= 0,
    cdMin: Math.floor(remainMs / 60000),
    cdSec: Math.floor((remainMs % 60000) / 1000),
  }
}

function PayCountdownBanner({ deadlineMs }) {
  const { validDl, cdExpired, cdMin, cdSec } = usePayCountdownMs(deadlineMs)
  if (!validDl) return null
  const pad = (n) => String(n).padStart(2, '0')
  return (
    <div className={`shrink-0 mx-4 mt-3 mb-1 rounded-xl border px-3 py-2.5 flex items-center gap-2.5 ${cdExpired ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
      <Clock className={`w-4 h-4 shrink-0 ${cdExpired ? 'text-rose-600' : 'text-amber-600'}`} />
      {cdExpired ? (
        <p className="text-xs font-semibold text-rose-700">Waktu pemesanan habis. Silakan pesan ulang tiket.</p>
      ) : (
        <p className="text-xs text-amber-800 flex-1">Selesaikan pemilihan kursi &amp; pembayaran dalam <span className="font-mono font-bold text-amber-900 tabular-nums">{pad(cdMin)}:{pad(cdSec)}</span></p>
      )}
    </div>
  )
}

// Modal 1 — ringkasan kursi per penumpang + rincian harga (muncul setelah booking).
function SeatSummaryModal({ sel, pax, seats, price, deadlineMs, onPickSeat, onConfirm, onClose }) {
  const [showPrice, setShowPrice] = useState(true)
  const { cdExpired } = usePayCountdownMs(deadlineMs)
  const seatLabel = (s) => {
    if (!s) return null
    const col = s.column ?? s.seatColumn ?? ''
    const row = s.row ?? s.seatRow ?? ''
    const num = (col || row) ? `${col}${row}` : (s.seatNumber || s.seat || '')
    return num ? `KURSI ${num}` : null
  }
  // Wajib: setiap penumpang harus punya nomor kursi sebelum lanjut bayar.
  const allSeatsChosen = pax.length > 0 && pax.every((_, i) => !!seatLabel(seats[i]))
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div className="relative bg-slate-50 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <PayCountdownBanner deadlineMs={deadlineMs} />
        <div className="p-4 pb-0"><TripSummaryCard sel={sel} /></div>

        <div className="p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Fasilitas Tambahan</p>
          <button onClick={onPickSeat} className="w-full flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3.5 hover:bg-slate-50">
            <span className="flex items-center gap-2.5 font-semibold text-sm text-slate-900"><Armchair className="w-5 h-5 text-orange-500" /> Nomor Kursi</span>
            <ChevronRight className="w-5 h-5 text-orange-500" />
          </button>

          <div className="bg-white border border-slate-200 rounded-xl mt-3 divide-y divide-slate-100">
            {pax.map((p, i) => {
              const sl = seatLabel(seats[i])
              return (
                <div key={i} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{i + 1}. {p.name || '-'} <span className="text-[10px] font-bold text-orange-500 border border-orange-300 rounded-full px-1.5 py-0.5 ml-1">{p.type}</span></p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{gradeLabel(sel.seat.grade)} / {sl || 'Kursi otomatis'}</p>
                  </div>
                  <button onClick={onPickSeat} className="text-xs font-bold text-orange-500 shrink-0">GANTI</button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="px-4 pb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Rincian Harga</p>
          <div className="bg-white border border-slate-200 rounded-xl">
            <button onClick={() => setShowPrice(v => !v)} className="w-full flex items-center justify-between gap-2 px-4 py-3">
              <span className="font-bold text-sm text-slate-900">Harga Total <span className="text-slate-300">|</span> <span className="text-orange-600">{formatRupiah(price.finalTotal)}</span></span>
              {showPrice ? <ChevronUp className="w-4 h-4 text-orange-500" /> : <ChevronDown className="w-4 h-4 text-orange-500" />}
            </button>
            {showPrice && (
              <div className="px-4 pb-3 pt-1 space-y-1.5 text-sm border-t border-slate-100">
                <div className="flex justify-between gap-3"><span className="text-slate-500 min-w-0 truncate">{price.originName} (Dewasa) x{price.adult}</span><span className="text-slate-900 shrink-0">{formatRupiah(price.priceAdult * price.adult)}</span></div>
                {price.child > 0 && <div className="flex justify-between gap-3"><span className="text-slate-500 min-w-0 truncate">Anak x{price.child}</span><span className="text-slate-900 shrink-0">{formatRupiah(price.priceChild * price.child)}</span></div>}
                {price.markupSub > 0 && <div className="flex justify-between gap-3"><span className="text-slate-500 min-w-0 truncate">Convenience Fee</span><span className="text-slate-900 shrink-0">{formatRupiah(price.markupSub)}</span></div>}
                {price.adminFee > 0 && <div className="flex justify-between gap-3"><span className="text-slate-500 min-w-0 truncate">Biaya Penanganan</span><span className="text-slate-900 shrink-0">{formatRupiah(price.adminFee)}</span></div>}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-50 p-4 border-t border-slate-200">
          {!allSeatsChosen && (
            <div className="flex items-start gap-2 p-2.5 mb-2.5 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">Silakan pilih <strong>nomor kursi untuk semua penumpang</strong> dulu dengan menekan tombol <strong>“Nomor Kursi”</strong> sebelum lanjut ke pembayaran.</p>
            </div>
          )}
          <button onClick={cdExpired ? onClose : onConfirm} disabled={!allSeatsChosen && !cdExpired}
            className={`w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${cdExpired ? 'bg-rose-500 hover:bg-rose-600' : 'bg-orange-500 hover:bg-orange-600'}`}>
            {cdExpired ? 'Pesan Ulang' : <>Simpan &amp; Lanjut Bayar <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal 2 — denah kursi 1 gerbong, pilih kursi per penumpang (paginasi 1/N).
function SeatPickerModal({ sel, deadlineMs, paxCount, paxNames, bookingCode, transactionId, initialSeats, onClose, onSaved }) {
  const [wagons, setWagons]   = useState([])
  const [wagonIdx, setWagonIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr]         = useState(null)
  const [saving, setSaving]   = useState(false)
  const [current, setCurrent] = useState(0)
  const [picked, setPicked]   = useState(() => (initialSeats || []).slice(0, paxCount))

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true); setErr(null)
      try {
        const res = await travelApi.seatLayout({
          origin: sel.origin.idStasiun, destination: sel.destination.idStasiun,
          date: sel.date, trainNumber: sel.train.trainNumber,
        })
        const data = res.data?.data
        if (alive) setWagons(Array.isArray(data) ? data : [])
      } catch (e) { if (alive) setErr(e?.response?.data?.message || 'Gagal memuat denah kursi.') }
      finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [])

  const wagon = wagons[wagonIdx]
  const rows = useMemo(() => {
    const map = new Map()
    for (const s of (wagon?.layout || [])) {
      const r = String(s.row)
      if (!map.has(r)) map.set(r, [])
      map.get(r).push(s)
    }
    return [...map.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))
  }, [wagon])

  const seatKey   = (s) => `${wagon?.wagonCode}|${wagon?.wagonNumber}|${s.row}|${s.column}`
  const pickedKey = (p) => p ? `${p.wagonCode}|${p.wagonNumber}|${p.row}|${p.column}` : ''
  const isPickedByOther   = (s) => picked.some((p, idx) => idx !== current && pickedKey(p) === seatKey(s))
  const isPickedByCurrent = (s) => pickedKey(picked[current]) === seatKey(s)
  const isFilled = (s) => s.isFilled == 1 || s.isFilled === '1' || s.isFilled === true

  const pick = (s) => {
    if (isFilled(s) || isPickedByOther(s)) return
    const seat = { wagonCode: wagon.wagonCode, wagonNumber: wagon.wagonNumber, row: s.row, column: s.column }
    setPicked(prev => { const n = [...prev]; n[current] = seat; return n })
    if (current < paxCount - 1) setCurrent(current + 1)
  }

  const allPicked = picked.filter(Boolean).length >= paxCount
  const save = async () => {
    if (!allPicked) { setErr('Pilih kursi untuk semua penumpang.'); return }
    setSaving(true); setErr(null)
    try {
      await travelApi.changeSeat({
        bookingCode, transactionId,
        seats: picked.map(p => ({ wagonCode: p.wagonCode, wagonNumber: p.wagonNumber, row: p.row, column: p.column })),
      })
      onSaved(picked)
    } catch (e) { setErr(e?.response?.data?.message || 'Gagal menyimpan kursi.') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 sm:p-4" onClick={onClose}>
      {/* Mobile: full-page (isi seluruh layar). Desktop: modal kartu di tengah. */}
      <div className="relative bg-white shadow-2xl flex flex-col overflow-hidden w-full h-full rounded-none sm:h-auto sm:max-w-sm sm:max-h-[92vh] sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="bg-orange-500 text-white px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3 sm:pt-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={onClose}><ChevronLeft className="w-5 h-5" /></button>
            <span className="font-bold text-sm">Pilih Nomor Kursi</span>
          </div>
          <span className="text-sm font-bold">{current + 1}/{paxCount}</span>
        </div>

        <div className="px-4 py-2 bg-orange-50 text-[11px] text-orange-700 font-semibold">Kursi untuk: {paxNames[current] || `Penumpang ${current + 1}`}</div>

        <PayCountdownBanner deadlineMs={deadlineMs} />

        <div className="flex items-center justify-center gap-4 py-2.5 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-slate-100 border border-slate-200" /> Tersedia</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-red-400" /> Terisi</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-orange-400" /> Dipilih</span>
        </div>

        {wagons.length > 1 && (
          <div className="flex items-center justify-center gap-2 pb-2 flex-wrap px-4">
            {wagons.map((w, i) => (
              <button key={i} onClick={() => setWagonIdx(i)} className={`text-xs font-bold px-2.5 py-1 rounded-full ${i === wagonIdx ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>Gerbong {w.wagonNumber}</button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" /></div>
          : (err && rows.length === 0) ? <div className="py-10 text-center text-sm text-red-600">{err}</div>
          : rows.length === 0 ? <div className="py-10 text-center text-sm text-slate-400">Denah kursi tak tersedia.</div>
          : (
            <div className="space-y-1.5">
              {rows.map(([rowNum, seatsInRow]) => {
                const sorted = [...seatsInRow].sort((a, b) => String(a.column).localeCompare(String(b.column)))
                const half = Math.ceil(sorted.length / 2)
                const left = sorted.slice(0, half), right = sorted.slice(half)
                const SeatBtn = (s) => {
                  const filled = isFilled(s)
                  const byOther = isPickedByOther(s)
                  const byCur = isPickedByCurrent(s)
                  const cls = byCur ? 'bg-orange-400 text-white border-orange-400'
                    : filled ? 'bg-red-400 text-white border-red-400 cursor-not-allowed'
                    : byOther ? 'bg-orange-200 text-orange-700 border-orange-200 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:border-orange-300'
                  return (
                    <button key={s.column} onClick={() => pick(s)} disabled={filled || byOther}
                      className={`w-9 h-9 rounded-lg border text-xs font-bold transition-colors ${cls}`}>{s.column}</button>
                  )
                }
                return (
                  <div key={rowNum} className="flex items-center justify-center gap-2">
                    <div className="flex gap-1.5">{left.map(SeatBtn)}</div>
                    <span className="w-6 text-center text-xs font-bold text-slate-400">{rowNum}</span>
                    <div className="flex gap-1.5">{right.map(SeatBtn)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-4 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] sm:pb-4 border-t border-slate-100 shrink-0">
          {err && !loading && rows.length > 0 && <p className="text-xs text-red-600 mb-2 text-center">{err}</p>}
          <button onClick={save} disabled={saving || loading || !allPicked}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, icon: Icon, value, onChange, type = 'text', placeholder, inputMode, maxLength }) {
  return (
    <div className="min-w-0">
      <label className="block text-[11px] font-semibold text-slate-500 mb-1">{label}</label>
      <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-orange-300 min-w-0">
        {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode}
          className="flex-1 min-w-0 w-full text-sm text-slate-900 focus:outline-none bg-transparent" maxLength={maxLength} />
      </div>
    </div>
  )
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold text-slate-900 text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
