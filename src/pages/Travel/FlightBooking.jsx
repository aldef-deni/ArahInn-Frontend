import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Plane, ArrowRight, User, Calendar, Phone, CreditCard, Mail,
  Loader2, AlertCircle, CheckCircle2, ChevronLeft, ShieldCheck,
} from 'lucide-react'
import { travelApi } from '@/services/index'
import { formatRupiah } from '@/utils'
import SEO from '@/components/SEO'
import DateField from '@/components/ui/DateField'
import PromoField from '@/components/travel/PromoField'
import { travelCheckoutError } from '@/utils/travelCheckoutError'

const formatDMY = (ymd) => { if (!ymd) return '-'; const [y,m,d] = ymd.split('-'); return `${d}/${m}/${y}` }
const emptyAdult = () => ({ title: 'MR', firstName: '', lastName: '', birthdate: '', idNumber: '', phone: '', email: '' })
const emptyKid   = () => ({ title: 'MSTR', firstName: '', lastName: '', birthdate: '', idNumber: '' })

export default function FlightBooking() {
  const navigate = useNavigate()
  const sel = useMemo(() => { try { return JSON.parse(sessionStorage.getItem('flight_selection') || 'null') } catch { return null } }, [])

  const [adults, setAdults]   = useState([])
  const [children, setChildren] = useState([])
  const [infants, setInfants] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [booked, setBooked]   = useState(null)
  const [promoCode, setPromoCode] = useState('')

  useEffect(() => {
    if (!sel) { navigate('/tiket/pesawat', { replace: true }); return }
    setAdults(Array.from({ length: sel.adult || 1 }, emptyAdult))
    setChildren(Array.from({ length: sel.child || 0 }, emptyKid))
    setInfants(Array.from({ length: sel.infant || 0 }, emptyKid))
  }, [sel, navigate])

  if (!sel) return null
  const { departure, arrival, date, airline, cls } = sel

  // Ambil harga real via fare (banyak maskapai kasih harga di fare, bukan search)
  const { data: fare, isLoading: fareLoading, isError: fareFailed, error: fareErr } = useQuery({
    queryKey: ['flight-fare', cls?.seat],
    queryFn: () => travelApi.flightFare({
      airline, departure: departure.code, arrival: arrival.code,
      departureDate: date, returnDate: '',
      adult: sel.adult || 1, child: sel.child || 0, infant: sel.infant || 0,
      seats: [cls.seat],
    }).then(r => r.data?.data),
    enabled: !!cls?.seat,
    retry: 1,
  })
  // Pesan vendor kalau fare gagal (mis. penerbangan tdk tersedia / harga kadaluarsa)
  const fareErrorMsg = fareFailed
    ? (fareErr?.response?.data?.message || 'Harga penerbangan ini tidak bisa dimuat. Mungkin sudah tidak tersedia atau harga berubah.')
    : null

  const price     = Number(fare?.price ?? cls?.price) || 0
  const baggage   = fare?.baggage
  const markup    = Number(sel.markup) || 0
  const payingPax = (sel.adult || 1) + (sel.child || 0)   // bayi umumnya tanpa kursi
  const ticketSub = price * payingPax
  const markupSub = markup * payingPax
  const total     = ticketSub + markupSub

  const upd = (setter) => (i, k, v) => setter(a => a.map((p, idx) => idx === i ? { ...p, [k]: v } : p))
  const setA = upd(setAdults), setC = upd(setChildren), setI = upd(setInfants)

  const valid = adults.every(p => p.firstName && p.birthdate && p.idNumber && p.phone)
             && children.every(p => p.firstName && p.birthdate)
             && infants.every(p => p.firstName && p.birthdate)

  const submit = async () => {
    if (fareFailed) { setError(`${fareErrorMsg} Silakan cari ulang penerbangan.`); return }
    if (!valid) { setError('Lengkapi data semua penumpang.'); return }
    setLoading(true); setError(null)
    try {
      const res = await travelApi.checkout({
        moda: 'pesawat',
        airline, departure: departure.code, arrival: arrival.code,
        departureDate: date,
        adult: sel.adult || 1, child: sel.child || 0, infant: sel.infant || 0,
        price, markup,
        promoCode: promoCode || undefined,
        flightCode: cls.flightCode, departureTime: cls.departureTime, arrivalTime: cls.arrivalTime, class: cls.class,
        flights: [cls.seat],
        passengers: { adults, children, infants },
      })
      const booking = res.data?.data
      if (booking?.id) navigate(`/tiket/bayar/${booking.id}`)
      else setError('Gagal membuat pesanan.')
    } catch (e) {
      setError(travelCheckoutError(e))
    } finally { setLoading(false) }
  }

  if (booked) {
    return (
      <div className="min-h-[70vh] bg-slate-50">
        <SEO title="Booking Pesawat Berhasil" url="/tiket/pesawat/pesan" />
        <div className="container max-w-lg py-8">
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-7 h-7 text-emerald-600" /></div>
            <h1 className="font-display text-xl font-bold text-slate-900">Booking Berhasil Dibuat</h1>
            <p className="text-sm text-slate-500 mt-1">Selesaikan pembayaran sebelum batas waktu.</p>
            <div className="mt-5 space-y-2.5 text-left bg-slate-50 rounded-xl p-4">
              <Row label="Kode Booking" value={booked.bookingCode} mono />
              <Row label="ID Transaksi" value={booked.transactionId} mono />
              <Row label="Penerbangan" value={`${cls.flightCode} · ${departure.code}→${arrival.code}`} />
              <Row label="Batas Bayar" value={booked.timeLimit} />
              <div className="border-t border-dashed border-slate-200 my-1" />
              <div className="flex justify-between items-center"><span className="text-sm font-semibold text-slate-500">Total</span><span className="font-display text-lg font-bold text-sky-600">{formatRupiah(Number(booked.nominal) || total)}</span></div>
            </div>
            <div className="mt-5 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left"><AlertCircle className="w-4 h-4 text-amber-600 shrink-0" /><p className="text-xs text-amber-800">Pembayaran (issue e-tiket) sedang difinalisasi.</p></div>
            <button onClick={() => navigate('/tiket/pesawat')} className="w-full mt-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50">Cari Tiket Lain</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] bg-slate-50">
      <SEO title="Data Penumpang — Tiket Pesawat" url="/tiket/pesawat/pesan" />
      <div className="container max-w-lg py-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 mb-4 hover:text-slate-700"><ChevronLeft className="w-4 h-4" /> Kembali</button>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center"><Plane className="w-4.5 h-4.5 text-sky-600" /></div>
            <div className="min-w-0"><p className="font-bold text-sm text-slate-900">{cls.flightCode}</p><span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Kelas {cls.class}</span></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center"><p className="font-bold text-slate-900">{cls.departureTime}</p><p className="text-[10px] text-slate-400">{departure.code}</p></div>
            <div className="flex-1 flex items-center gap-1.5"><div className="h-px flex-1 bg-slate-200" /><span className="text-[10px] text-slate-400">{cls.duration}</span><div className="h-px flex-1 bg-slate-200" /><ArrowRight className="w-3.5 h-3.5 text-slate-300" /></div>
            <div className="text-center"><p className="font-bold text-slate-900">{cls.arrivalTime}</p><p className="text-[10px] text-slate-400">{arrival.code}</p></div>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDMY(date)}</p>
        </div>

        {error && <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4"><AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><p className="text-sm text-red-700">{error}</p></div>}

        {/* Banner kalau fare/harga gagal dari vendor → wajib cari ulang */}
        {fareFailed && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-800">Penerbangan tidak bisa dipesan</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">{fareErrorMsg} Harga & ketersediaan tiket pesawat berubah cepat — mohon cari ulang untuk dapat harga terbaru.</p>
              <button onClick={() => navigate('/tiket/pesawat')} className="mt-2.5 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors">
                Cari Ulang Penerbangan <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {adults.map((p, i) => (
          <PaxCard key={`a${i}`} title={`Penumpang Dewasa ${i + 1}`} color="text-sky-500">
            <TitleSelect value={p.title} onChange={v => setA(i, 'title', v)} opts={['MR','MRS','MS']} />
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Nama Depan" value={p.firstName} onChange={v => setA(i, 'firstName', v)} />
              <Field label="Nama Belakang" value={p.lastName} onChange={v => setA(i, 'lastName', v)} />
            </div>
            <DateField label="Tanggal Lahir" value={p.birthdate} onChange={v => setA(i, "birthdate", v)} />
            <Field label="No. KTP / NIK" icon={CreditCard} value={p.idNumber} onChange={v => setA(i, 'idNumber', v.replace(/[^0-9]/g,''))} inputMode="numeric" />
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="No. HP" icon={Phone} value={p.phone} onChange={v => setA(i, 'phone', v.replace(/[^0-9]/g,''))} inputMode="numeric" />
              <Field label="Email" icon={Mail} value={p.email} onChange={v => setA(i, 'email', v)} />
            </div>
          </PaxCard>
        ))}
        {children.map((p, i) => (
          <PaxCard key={`c${i}`} title={`Anak ${i + 1}`} color="text-amber-500">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Nama Depan" value={p.firstName} onChange={v => setC(i, 'firstName', v)} />
              <Field label="Nama Belakang" value={p.lastName} onChange={v => setC(i, 'lastName', v)} />
            </div>
            <DateField label="Tanggal Lahir" value={p.birthdate} onChange={v => setC(i, "birthdate", v)} />
            <Field label="NIK (opsional)" icon={CreditCard} value={p.idNumber} onChange={v => setC(i, 'idNumber', v.replace(/[^0-9]/g,''))} inputMode="numeric" />
          </PaxCard>
        ))}
        {infants.map((p, i) => (
          <PaxCard key={`inf${i}`} title={`Bayi ${i + 1}`} color="text-pink-500">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Nama Depan" value={p.firstName} onChange={v => setI(i, 'firstName', v)} />
              <Field label="Nama Belakang" value={p.lastName} onChange={v => setI(i, 'lastName', v)} />
            </div>
            <DateField label="Tanggal Lahir" value={p.birthdate} onChange={v => setI(i, "birthdate", v)} />
          </PaxCard>
        ))}

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
          <PromoField value={promoCode} onChange={setPromoCode} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
          <p className="font-bold text-sm text-slate-900 mb-2.5">Rincian Harga</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Harga tiket ({payingPax} × {formatRupiah(price)})</span><span className="text-slate-900">{formatRupiah(ticketSub)}</span></div>
            {markup > 0 && <div className="flex justify-between"><span className="text-slate-500">Biaya layanan ({payingPax} × {formatRupiah(markup)})</span><span className="text-slate-900">{formatRupiah(markupSub)}</span></div>}
            <div className="flex justify-between pt-1.5 border-t border-slate-100"><span className="font-bold text-slate-900">Total</span><span className="font-bold text-sky-600">{formatRupiah(total)}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky bottom-2 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div><p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Total</p><p className="font-display text-xl font-bold text-sky-600">{formatRupiah(total)}</p></div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600"><ShieldCheck className="w-3.5 h-3.5" /> E-tiket resmi</div>
          </div>
          <button onClick={submit} disabled={!valid || loading || fareFailed} className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : <>Lanjutkan ke Pembayaran <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  )
}

function PaxCard({ title, color, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
      <p className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5"><User className={`w-4 h-4 ${color}`} /> {title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}
function TitleSelect({ value, onChange, opts }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Title</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300">
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
function Field({ label, icon: Icon, value, onChange, type = 'text', placeholder, inputMode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 mb-1">{label}</label>
      <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-sky-300">
        {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode} className="flex-1 text-sm text-slate-900 focus:outline-none bg-transparent" />
      </div>
    </div>
  )
}
function Row({ label, value, mono }) {
  return <div className="flex justify-between gap-3"><span className="text-sm text-slate-500">{label}</span><span className={`text-sm font-semibold text-slate-900 text-right ${mono ? 'font-mono' : ''}`}>{value}</span></div>
}
