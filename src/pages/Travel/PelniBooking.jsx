import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Ship, ArrowRight, User, Phone, CreditCard, Mail,
  Loader2, AlertCircle, ChevronLeft, ShieldCheck,
} from 'lucide-react'
import { travelApi } from '@/services/index'
import { formatRupiah } from '@/utils'
import SEO from '@/components/SEO'
import DateField from '@/components/ui/DateField'
import PromoField from '@/components/travel/PromoField'
import { travelCheckoutError } from '@/utils/travelCheckoutError'

const ymd8 = (s) => s && s.length === 8 ? `${s.slice(6,8)}/${s.slice(4,6)}/${s.slice(0,4)}` : s
const hhmm = (s) => s && s.length === 4 ? `${s.slice(0,2)}:${s.slice(2,4)}` : s
const titleCase = (s) => (s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
const classLabel = (c) => ({ EK1: 'Ekonomi 1', EK2: 'Ekonomi 2', EKO: 'Ekonomi', K1: 'Kelas 1', K2: 'Kelas 2' }[c] || c)
const emptyPax = () => ({ name: '', birthDate: '', identityNumber: '', gender: 'M' })

export default function PelniBooking() {
  const navigate = useNavigate()
  const sel = useMemo(() => { try { return JSON.parse(sessionStorage.getItem('pelni_selection') || 'null') } catch { return null } }, [])

  const [adults, setAdults]     = useState([])
  const [children, setChildren] = useState([])
  const [infants, setInfants]   = useState([])
  const [contact, setContact]   = useState({ email: '', phone: '' })
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [appliedPromo, setAppliedPromo] = useState(null)   // { code, discount }

  useEffect(() => {
    if (!sel) { navigate('/tiket/pelni', { replace: true }); return }
    setAdults(Array.from({ length: sel.adult || 1 }, emptyPax))
    setChildren(Array.from({ length: sel.child || 0 }, emptyPax))
    setInfants(Array.from({ length: sel.infant || 0 }, emptyPax))
  }, [sel, navigate])

  if (!sel) return null

  const hargaDewasa = Number(sel.hargaDewasa) || 0
  const hargaAnak   = Number(sel.hargaAnak) || 0
  const hargaInfant = Number(sel.hargaInfant) || 0
  const svcFee      = sel.svcFee || { amount: 0, percent: 0 }
  const adult = sel.adult || 1, child = sel.child || 0, infant = sel.infant || 0
  const payingPax = adult + child
  const fareSub   = hargaDewasa * adult + hargaAnak * child + hargaInfant * infant
  // Biaya penanganan: persen → % dari subtotal tiket; selain itu nominal × pax.
  const markupSub = Number(svcFee.percent) > 0
    ? Math.round(Number(svcFee.percent) / 100 * fareSub)
    : (Number(svcFee.amount) || 0) * payingPax
  const adminFee  = Number(svcFee.adminAmount) || 0   // biaya admin flat (khusus PELNI)
  const total     = fareSub + markupSub + adminFee
  const promoDiscount = appliedPromo?.discount || 0
  const finalTotal    = Math.max(0, total - promoDiscount)
  const departYmd = sel.departureDate
    ? `${String(sel.departureDate).slice(0,4)}-${String(sel.departureDate).slice(4,6)}-${String(sel.departureDate).slice(6,8)}`
    : null

  const upd = (setter) => (i, k, v) => setter(a => a.map((p, idx) => idx === i ? { ...p, [k]: v } : p))
  const setA = upd(setAdults), setC = upd(setChildren), setI = upd(setInfants)

  const valid = adults.every(p => p.name && p.birthDate && p.identityNumber && p.gender)
             && children.every(p => p.name && p.birthDate && p.gender)
             && infants.every(p => p.name && p.birthDate && p.gender)
             && /\S+@\S+\.\S+/.test(contact.email) && contact.phone.length >= 8

  const submit = async () => {
    if (!valid) { setError('Lengkapi data semua penumpang & kontak.'); return }
    setLoading(true); setError(null)
    try {
      const payingPaxList = [...adults, ...children]
      const male   = payingPaxList.filter(p => p.gender === 'M').length
      const female = payingPaxList.filter(p => p.gender === 'F').length
      const res = await travelApi.checkout({
        moda: 'pelni',
        origin: +sel.origin, originCall: sel.originCall,
        destination: +sel.destination, destinationCall: sel.destinationCall,
        departureDate: sel.departureDate,
        shipNumber: sel.shipNumber, shipName: sel.shipName, subClass: sel.subClass,
        pelabuhanAsal: sel.originName, pelabuhanTujuan: sel.destinationName,
        hargaDewasa, hargaAnak, hargaInfant, markup: markupSub,
        promoCode: appliedPromo?.code || undefined,
        male, female, adult, child, infant,
        contact: { email: contact.email, phone: contact.phone },
        passengers: { adults, children, infants },
      })
      const booking = res.data?.data
      const ref = booking?.code ?? booking?.id
      if (ref) navigate(`/tiket/bayar/${ref}`, { state: { moda: 'pelni' } })
      else setError('Gagal membuat pesanan.')
    } catch (e) {
      setError(travelCheckoutError(e))
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-[70vh] bg-slate-50">
      <SEO title="Data Penumpang — Tiket Kapal PELNI" url="/tiket/pelni/pesan" />
      <div className="container max-w-lg py-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 mb-4 hover:text-slate-700"><ChevronLeft className="w-4 h-4" /> Kembali</button>

        {/* Ringkasan kapal */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center"><Ship className="w-4.5 h-4.5 text-cyan-600" /></div>
            <div className="min-w-0"><p className="font-bold text-sm text-slate-900">{titleCase(sel.shipName)}</p><span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{classLabel(sel.className)} ({sel.subClass})</span></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center"><p className="font-bold text-slate-900">{hhmm(sel.depTime)}</p><p className="text-[10px] text-slate-400">{titleCase(sel.originName)}</p></div>
            <div className="flex-1 flex items-center gap-1.5"><div className="h-px flex-1 bg-slate-200" /><Ship className="w-3 h-3 text-slate-300" /><div className="h-px flex-1 bg-slate-200" /><ArrowRight className="w-3.5 h-3.5 text-slate-300" /></div>
            <div className="text-center"><p className="font-bold text-slate-900">{hhmm(sel.arrTime)}</p><p className="text-[10px] text-slate-400">{titleCase(sel.destinationName)}</p></div>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Ship className="w-3 h-3" /> Berangkat {ymd8(sel.depDate)} → Tiba {ymd8(sel.arrDate)}</p>
        </div>

        {error && <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4"><AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><p className="text-sm text-red-700">{error}</p></div>}

        {adults.map((p, i) => (
          <PaxCard key={`a${i}`} title={`Penumpang Dewasa ${i + 1}`} color="text-cyan-500">
            <Field label="Nama Lengkap (sesuai identitas)" value={p.name} onChange={v => setA(i, 'name', v)} />
            <GenderSelect value={p.gender} onChange={v => setA(i, 'gender', v)} />
            <DateField label="Tanggal Lahir" value={p.birthDate} onChange={v => setA(i, 'birthDate', v)} />
            <Field label="No. KTP / NIK" icon={CreditCard} value={p.identityNumber} onChange={v => setA(i, 'identityNumber', v.replace(/[^0-9]/g,''))} inputMode="numeric" />
          </PaxCard>
        ))}
        {children.map((p, i) => (
          <PaxCard key={`c${i}`} title={`Anak ${i + 1}`} color="text-amber-500">
            <Field label="Nama Lengkap" value={p.name} onChange={v => setC(i, 'name', v)} />
            <GenderSelect value={p.gender} onChange={v => setC(i, 'gender', v)} />
            <DateField label="Tanggal Lahir" value={p.birthDate} onChange={v => setC(i, 'birthDate', v)} />
            <Field label="NIK (opsional)" icon={CreditCard} value={p.identityNumber} onChange={v => setC(i, 'identityNumber', v.replace(/[^0-9]/g,''))} inputMode="numeric" />
          </PaxCard>
        ))}
        {infants.map((p, i) => (
          <PaxCard key={`inf${i}`} title={`Bayi ${i + 1}`} color="text-pink-500">
            <Field label="Nama Lengkap" value={p.name} onChange={v => setI(i, 'name', v)} />
            <GenderSelect value={p.gender} onChange={v => setI(i, 'gender', v)} />
            <DateField label="Tanggal Lahir" value={p.birthDate} onChange={v => setI(i, 'birthDate', v)} />
          </PaxCard>
        ))}

        {/* Kontak */}
        <PaxCard title="Kontak Pemesan" color="text-blue-500">
          <Field label="Email" icon={Mail} value={contact.email} onChange={v => setContact(c => ({ ...c, email: v }))} />
          <Field label="No. HP" icon={Phone} value={contact.phone} onChange={v => setContact(c => ({ ...c, phone: v.replace(/[^0-9]/g,'') }))} inputMode="numeric" />
        </PaxCard>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
          <PromoField moda="pelni" total={total} departDate={departYmd} onApplied={setAppliedPromo} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
          <p className="font-bold text-sm text-slate-900 mb-2.5">Rincian Harga</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Dewasa ({adult} × {formatRupiah(hargaDewasa)})</span><span className="text-slate-900">{formatRupiah(hargaDewasa * adult)}</span></div>
            {child > 0 && <div className="flex justify-between"><span className="text-slate-500">Anak ({child} × {formatRupiah(hargaAnak)})</span><span className="text-slate-900">{formatRupiah(hargaAnak * child)}</span></div>}
            {infant > 0 && <div className="flex justify-between"><span className="text-slate-500">Bayi ({infant} × {formatRupiah(hargaInfant)})</span><span className="text-slate-900">{formatRupiah(hargaInfant * infant)}</span></div>}
            {markupSub > 0 && <div className="flex justify-between"><span className="text-slate-500">Biaya Penanganan</span><span className="text-slate-900">{formatRupiah(markupSub)}</span></div>}
            {adminFee > 0 && <div className="flex justify-between"><span className="text-slate-500">Biaya Admin</span><span className="text-slate-900">{formatRupiah(adminFee)}</span></div>}
            {promoDiscount > 0 && <div className="flex justify-between"><span className="text-slate-500">Diskon Promo {appliedPromo?.code ? `(${appliedPromo.code})` : ''}</span><span className="font-medium text-green-600">- {formatRupiah(promoDiscount)}</span></div>}
            <div className="flex justify-between pt-1.5 border-t border-slate-100"><span className="font-bold text-slate-900">Total</span><span className="font-bold text-cyan-600">{formatRupiah(finalTotal)}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky bottom-2 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div><p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Total</p><p className="font-display text-xl font-bold text-cyan-600">{formatRupiah(finalTotal)}</p></div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600"><ShieldCheck className="w-3.5 h-3.5" /> Tiket resmi PELNI</div>
          </div>
          <button onClick={submit} disabled={!valid || loading} className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50">
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
function GenderSelect({ value, onChange }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Jenis Kelamin</label>
      <div className="grid grid-cols-2 gap-2">
        {[['M','Pria'],['F','Wanita']].map(([v, l]) => (
          <button key={v} type="button" onClick={() => onChange(v)} className={`py-2.5 rounded-xl border text-sm font-semibold ${value === v ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-500'}`}>{l}</button>
        ))}
      </div>
    </div>
  )
}
function Field({ label, icon: Icon, value, onChange, type = 'text', placeholder, inputMode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 mb-1">{label}</label>
      <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-cyan-300">
        {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode} className="flex-1 text-sm text-slate-900 focus:outline-none bg-transparent" />
      </div>
    </div>
  )
}
