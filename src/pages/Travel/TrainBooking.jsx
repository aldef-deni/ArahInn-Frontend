import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrainFront, ArrowRight, Clock, User, Calendar, Phone, CreditCard,
  Loader2, AlertCircle, CheckCircle2, ChevronLeft, ShieldCheck,
} from 'lucide-react'
import { travelApi } from '@/services/index'
import { formatRupiah } from '@/utils'
import SEO from '@/components/SEO'
import DateField from '@/components/ui/DateField'
import PromoField from '@/components/travel/PromoField'

const gradeLabel = (g) => ({ E: 'Eksekutif', B: 'Bisnis', K: 'Ekonomi' }[g] || g || '-')
const formatDMY = (ymd) => { if (!ymd) return '-'; const [y,m,d] = ymd.split('-'); return `${d}/${m}/${y}` }

function emptyAdult()  { return { name: '', birthdate: '', phone: '', idNumber: '' } }
function emptyInfant() { return { name: '', birthdate: '', idNumber: '' } }

export default function TrainBooking() {
  const navigate = useNavigate()
  const sel = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('train_selection') || 'null') } catch { return null }
  }, [])

  const [adults, setAdults]   = useState([])
  const [infants, setInfants] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [booked, setBooked]   = useState(null)  // hasil book
  const [promoCode, setPromoCode] = useState('')

  useEffect(() => {
    if (!sel) { navigate('/tiket/kereta', { replace: true }); return }
    setAdults(Array.from({ length: sel.adult || 1 }, emptyAdult))
    setInfants(Array.from({ length: sel.infant || 0 }, emptyInfant))
  }, [sel, navigate])

  if (!sel) return null

  const { origin, destination, date, train, seat } = sel
  const priceAdult = Number(seat?.priceAdult) || 0
  const markup     = Number(sel.markup) || 0
  const pax        = sel.adult || 1            // bayi tidak kena kursi
  const ticketSub  = priceAdult * pax
  const markupSub  = markup * pax
  const total      = ticketSub + markupSub

  const setAdultField  = (i, k, v) => setAdults(a => a.map((p, idx) => idx === i ? { ...p, [k]: v } : p))
  const setInfantField = (i, k, v) => setInfants(a => a.map((p, idx) => idx === i ? { ...p, [k]: v } : p))

  const valid = adults.every(p => p.name && p.birthdate && p.phone && p.idNumber)
             && infants.every(p => p.name && p.birthdate)

  const submit = async () => {
    if (!valid) { setError('Lengkapi semua data penumpang.'); return }
    setLoading(true); setError(null)
    try {
      const res = await travelApi.checkout({
        moda: 'kereta',
        origin: origin.idStasiun,
        destination: destination.idStasiun,
        date,
        trainNumber: train.trainNumber,
        grade: seat.grade,
        class: seat.class,
        adult: sel.adult || 1,
        infant: sel.infant || 0,
        priceAdult: priceAdult,
        markup,
        promoCode: promoCode || undefined,
        trainName: train.trainName,
        departureStation: origin.namaStasiun,
        departureTime: train.departureTime,
        arrivalStation: destination.namaStasiun,
        arrivalTime: train.arrivalTime,
        passengers: {
          adults: adults.map(p => ({ name: p.name, birthdate: p.birthdate, phone: p.phone, idNumber: p.idNumber })),
          infants: infants.map(p => ({ name: p.name, birthdate: p.birthdate, idNumber: p.idNumber || '' })),
        },
      })
      const booking = res.data?.data
      if (booking?.id) navigate(`/tiket/bayar/${booking.id}`)
      else setError('Gagal membuat pesanan.')
    } catch (e) {
      setError(e?.response?.data?.message || 'Gagal membuat booking. Coba lagi.')
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
                <span className="font-display text-lg font-bold text-orange-600">{formatRupiah(total)}</span>
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

        {/* Trip summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center"><TrainFront className="w-4.5 h-4.5 text-orange-600" /></div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-900 truncate">{train.trainName}</p>
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{gradeLabel(seat.grade)} · {seat.class}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center"><p className="font-bold text-slate-900">{train.departureTime}</p><p className="text-[10px] text-slate-400">{origin.idStasiun}</p></div>
            <div className="flex-1 flex items-center gap-1.5">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Clock className="w-3 h-3" />{train.duration}</span>
              <div className="h-px flex-1 bg-slate-200" /><ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <div className="text-center"><p className="font-bold text-slate-900">{train.arrivalTime}</p><p className="text-[10px] text-slate-400">{destination.idStasiun}</p></div>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDMY(date)}</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Passenger forms */}
        {adults.map((p, i) => (
          <div key={`a${i}`} className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
            <p className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5"><User className="w-4 h-4 text-orange-500" /> Penumpang Dewasa {i + 1}</p>
            <div className="space-y-2.5">
              <Field label="Nama Lengkap (sesuai KTP)" icon={User} value={p.name} onChange={v => setAdultField(i, 'name', v)} placeholder="Nama sesuai identitas" />
              <div className="grid grid-cols-2 gap-2.5">
                <DateField label="Tanggal Lahir" value={p.birthdate} onChange={v => setAdultField(i, 'birthdate', v)} />
                <Field label="No. HP" icon={Phone} value={p.phone} onChange={v => setAdultField(i, 'phone', v.replace(/[^0-9]/g, ''))} placeholder="08xxx" inputMode="numeric" />
              </div>
              <Field label="No. KTP / NIK" icon={CreditCard} value={p.idNumber} onChange={v => setAdultField(i, 'idNumber', v.replace(/[^0-9]/g, ''))} placeholder="16 digit NIK" inputMode="numeric" />
            </div>
          </div>
        ))}

        {infants.map((p, i) => (
          <div key={`inf${i}`} className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
            <p className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5"><User className="w-4 h-4 text-sky-500" /> Bayi {i + 1}</p>
            <div className="space-y-2.5">
              <Field label="Nama Lengkap" icon={User} value={p.name} onChange={v => setInfantField(i, 'name', v)} placeholder="Nama bayi" />
              <div className="grid grid-cols-2 gap-2.5">
                <DateField label="Tanggal Lahir" value={p.birthdate} onChange={v => setInfantField(i, 'birthdate', v)} />
                <Field label="NIK (opsional)" icon={CreditCard} value={p.idNumber} onChange={v => setInfantField(i, 'idNumber', v.replace(/[^0-9]/g, ''))} placeholder="opsional" inputMode="numeric" />
              </div>
            </div>
          </div>
        ))}

        {/* Kode promo */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
          <PromoField value={promoCode} onChange={setPromoCode} />
        </div>

        {/* Rincian harga */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
          <p className="font-bold text-sm text-slate-900 mb-2.5">Rincian Harga</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Harga tiket ({pax} × {formatRupiah(priceAdult)})</span><span className="text-slate-900">{formatRupiah(ticketSub)}</span></div>
            {markup > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">Biaya layanan ({pax} × {formatRupiah(markup)})</span><span className="text-slate-900">{formatRupiah(markupSub)}</span></div>
            )}
            <div className="flex justify-between pt-1.5 border-t border-slate-100"><span className="font-bold text-slate-900">Total</span><span className="font-bold text-orange-600">{formatRupiah(total)}</span></div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Jika kode promo valid, potongan otomatis dihitung saat checkout.</p>
        </div>

        {/* Price + submit */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky bottom-2 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Total ({sel.adult} dewasa)</p>
              <p className="font-display text-xl font-bold text-orange-600">{formatRupiah(total)}</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600"><ShieldCheck className="w-3.5 h-3.5" /> Resmi KAI</div>
          </div>
          <button onClick={submit} disabled={!valid || loading}
            className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses booking...</> : <>Lanjutkan ke Pembayaran <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, icon: Icon, value, onChange, type = 'text', placeholder, inputMode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 mb-1">{label}</label>
      <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-orange-300">
        {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode}
          className="flex-1 text-sm text-slate-900 focus:outline-none bg-transparent" />
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
