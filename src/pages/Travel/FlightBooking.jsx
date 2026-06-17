import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Plane, ArrowRight, User, Calendar, Phone, CreditCard, Mail,
  Loader2, AlertCircle, CheckCircle2, ChevronLeft, ShieldCheck, FileText,
} from 'lucide-react'
import { travelApi } from '@/services/index'
import { formatRupiah } from '@/utils'
import SEO from '@/components/SEO'
import DateField from '@/components/ui/DateField'
import LoaderArahInn from '@/components/LoaderArahInn'
import PromoField from '@/components/travel/PromoField'
import { travelCheckoutError } from '@/utils/travelCheckoutError'
import { sortedCountries, countryName } from '@/data/countries'

const formatDMY = (ymd) => { if (!ymd) return '-'; const [y,m,d] = ymd.split('-'); return `${d}/${m}/${y}` }

// Klasifikasi usia maskapai (dihitung dari hari ini, tanggal LOKAL):
//   Dewasa  : ≥ 12 tahun
//   Anak    : 2 – 11 tahun
//   Bayi    : 0 – 23 bulan (di bawah 2 tahun)
const fmtYmd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const yearsAgo = (n) => { const d = new Date(); d.setFullYear(d.getFullYear() - n); return fmtYmd(d) }
const TODAY_YMD = fmtYmd(new Date())
const AGE = {
  adult:  { min: yearsAgo(100), max: yearsAgo(12) },
  child:  { min: yearsAgo(12),  max: yearsAgo(2)  },
  infant: { min: yearsAgo(2),   max: TODAY_YMD    },
}
// Tanggal lahir valid utk kategori (di dalam rentang min–max kategori)
const inAge = (bd, cat) => !!bd && bd >= AGE[cat].min && bd <= AGE[cat].max

const emptyId = { nationality: 'ID', idNumber: '', passportNumber: '', passportIssueDate: '', passportIssuingCountry: '', passportExpiry: '' }
const emptyAdult = () => ({ title: 'MR', firstName: '', lastName: '', birthdate: '', ...emptyId, phone: '', email: '' })
const emptyKid   = () => ({ title: 'MSTR', firstName: '', lastName: '', birthdate: '', ...emptyId })
const isWNI = (p) => (p.nationality || 'ID') === 'ID'
// Identitas lengkap: WNI → NIK (wajib utk dewasa); WNA → paspor lengkap
const idOk = (p, req) => isWNI(p)
  ? (req ? !!p.idNumber : true)
  : (!!p.passportNumber && !!p.passportIssueDate && !!p.passportIssuingCountry && !!p.passportExpiry)

export default function FlightBooking() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const sel = useMemo(() => { try { return JSON.parse(sessionStorage.getItem('flight_selection') || 'null') } catch { return null } }, [])

  const [adults, setAdults]   = useState([])
  const [children, setChildren] = useState([])
  const [infants, setInfants] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [booked, setBooked]   = useState(null)
  const [appliedPromo, setAppliedPromo] = useState(null)   // { code, discount }

  useEffect(() => {
    if (!sel) { navigate('/tiket/pesawat', { replace: true }); return }
    setAdults(Array.from({ length: sel.adult || 1 }, emptyAdult))
    setChildren(Array.from({ length: sel.child || 0 }, emptyKid))
    setInfants(Array.from({ length: sel.infant || 0 }, emptyKid))
  }, [sel, navigate])

  if (!sel) return null
  // Normalisasi leg: one-way = 1 leg (pergi); pulang-pergi = [pergi, pulang]
  const isRT = sel.tripType === 'roundtrip'
  const out  = isRT ? sel.outbound : { departure: sel.departure, arrival: sel.arrival, date: sel.date, airline: sel.airline, cls: sel.cls }
  const ret  = isRT ? sel.return : null
  // Alias kompat untuk blok lama (booked screen) — pakai leg pergi
  const { departure, arrival, date, cls } = out

  // Fare per leg (banyak maskapai kasih harga di fare, bukan search)
  const fareOut = useQuery({
    queryKey: ['flight-fare', 'out', out?.cls?.seat],
    queryFn: () => travelApi.flightFare({
      airline: out.airline, departure: out.departure.code, arrival: out.arrival.code,
      departureDate: out.date, returnDate: '',
      adult: sel.adult || 1, child: sel.child || 0, infant: sel.infant || 0, seats: [out.cls.seat],
    }).then(r => r.data?.data),
    enabled: !!out?.cls?.seat, retry: 1,
  })
  const fareRet = useQuery({
    queryKey: ['flight-fare', 'ret', ret?.cls?.seat],
    queryFn: () => travelApi.flightFare({
      airline: ret.airline, departure: ret.departure.code, arrival: ret.arrival.code,
      departureDate: ret.date, returnDate: '',
      adult: sel.adult || 1, child: sel.child || 0, infant: sel.infant || 0, seats: [ret.cls.seat],
    }).then(r => r.data?.data),
    enabled: isRT && !!ret?.cls?.seat, retry: 1,
  })

  const fareFailed  = fareOut.isError || (isRT && fareRet.isError)
  const fareErrorMsg = fareFailed
    ? ((fareOut.error || fareRet.error)?.response?.data?.message || t('travel.fareErrorDefault'))
    : null

  const priceOut  = Number(fareOut.data?.price ?? out?.cls?.price) || 0
  const priceRet  = isRT ? (Number(fareRet.data?.price ?? ret?.cls?.price) || 0) : 0
  const markup    = Number(sel.markup) || 0
  const payingPax = (sel.adult || 1) + (sel.child || 0)   // bayi umumnya tanpa kursi
  const numLegs   = isRT ? 2 : 1
  const ticketSub = (priceOut + priceRet) * payingPax
  const markupSub = markup * payingPax * numLegs
  const total     = ticketSub + markupSub
  const promoDiscount = appliedPromo?.discount || 0
  const finalTotal    = Math.max(0, total - promoDiscount)

  const upd = (setter) => (i, k, v) => setter(a => a.map((p, idx) => idx === i ? { ...p, [k]: v } : p))
  const setA = upd(setAdults), setC = upd(setChildren), setI = upd(setInfants)

  const valid = adults.every(p => p.firstName && inAge(p.birthdate, 'adult') && idOk(p, true) && p.phone)
             && children.every(p => p.firstName && inAge(p.birthdate, 'child') && idOk(p, false))
             && infants.every(p => p.firstName && inAge(p.birthdate, 'infant') && idOk(p, false))

  // Pesan validasi spesifik (nama pax + alasan) — utamakan kesalahan usia agar jelas
  const validationError = () => {
    const groups = [
      { arr: adults,   cat: 'adult',  paxKey: 'adultPax',  reqPhone: true },
      { arr: children, cat: 'child',  paxKey: 'childPax',  reqPhone: false },
      { arr: infants,  cat: 'infant', paxKey: 'infantPax', reqPhone: false },
    ]
    for (const { arr, cat, paxKey, reqPhone } of groups) {
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i]
        const who = t(`travel.${paxKey}`, { n: i + 1 })
        if (!p.firstName) return t('travel.errNeedName', { who })
        if (!p.birthdate) return t('travel.errNeedBirth', { who })
        if (!inAge(p.birthdate, cat)) return t(`travel.errAge_${cat}`, { who })
        if (!idOk(p, cat === 'adult')) return t('travel.errNeedId', { who })
        if (reqPhone && !p.phone) return t('travel.errNeedPhone', { who })
      }
    }
    return null
  }

  const legPayload = (leg, price) => ({
    airline: leg.airline, departure: leg.departure.code, arrival: leg.arrival.code,
    departureDate: leg.date, price,
    flightCode: leg.cls.flightCode, departureTime: leg.cls.departureTime, arrivalTime: leg.cls.arrivalTime, class: leg.cls.class,
    flights: [leg.cls.seat],
  })

  const submit = async () => {
    if (fareFailed) { setError(`${fareErrorMsg} ${t('travel.searchAgainHint')}`); return }
    const vErr = validationError()
    if (vErr) { setError(vErr); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    setLoading(true); setError(null)
    try {
      const res = isRT
        ? await travelApi.checkout({
            moda: 'pesawat', tripType: 'roundtrip',
            adult: sel.adult || 1, child: sel.child || 0, infant: sel.infant || 0, markup,
            promoCode: appliedPromo?.code || undefined,
            outbound: legPayload(out, priceOut),
            return:   legPayload(ret, priceRet),
            passengers: { adults, children, infants },
          })
        : await travelApi.checkout({
            moda: 'pesawat', ...legPayload(out, priceOut),
            adult: sel.adult || 1, child: sel.child || 0, infant: sel.infant || 0, markup,
            promoCode: appliedPromo?.code || undefined,
            passengers: { adults, children, infants },
          })
      const data = res.data?.data
      // URL pembayaran pakai KODE booking (TRV…), bukan id numerik
      const ref = isRT ? (data?.depart?.code ?? data?.depart?.id) : (data?.code ?? data?.id)
      if (ref) navigate(`/tiket/bayar/${ref}`)
      else setError(t('travel.createOrderFailed'))
    } catch (e) {
      setError(travelCheckoutError(e))
    } finally { setLoading(false) }
  }

  if (booked) {
    return (
      <div className="min-h-[70vh] bg-slate-50">
        <SEO title={t('travel.bookingSuccessSeo')} url="/tiket/pesawat/pesan" />
        <div className="container max-w-lg py-8">
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-7 h-7 text-emerald-600" /></div>
            <h1 className="font-display text-xl font-bold text-slate-900">{t('travel.bookingSuccessTitle')}</h1>
            <p className="text-sm text-slate-500 mt-1">{t('travel.completePaymentBefore')}</p>
            <div className="mt-5 space-y-2.5 text-left bg-slate-50 rounded-xl p-4">
              <Row label={t('travel.bookingCode')} value={booked.bookingCode} mono />
              <Row label={t('travel.transactionId')} value={booked.transactionId} mono />
              <Row label={t('travel.flightLabel')} value={`${cls.flightCode} · ${departure.code}→${arrival.code}`} />
              <Row label={t('travel.payDeadline')} value={booked.timeLimit} />
              <div className="border-t border-dashed border-slate-200 my-1" />
              <div className="flex justify-between items-center"><span className="text-sm font-semibold text-slate-500">{t('travel.total')}</span><span className="font-display text-lg font-bold text-sky-600">{formatRupiah(Number(booked.nominal) || total)}</span></div>
            </div>
            <div className="mt-5 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left"><AlertCircle className="w-4 h-4 text-amber-600 shrink-0" /><p className="text-xs text-amber-800">{t('travel.paymentFinalizing')}</p></div>
            <button onClick={() => navigate('/tiket/pesawat')} className="w-full mt-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50">{t('travel.findOtherTickets')}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] bg-slate-50">
      {loading && <LoaderArahInn />}
      <SEO title={t('travel.paxDataSeo')} url="/tiket/pesawat/pesan" />
      <div className="container max-w-lg py-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 mb-4 hover:text-slate-700"><ChevronLeft className="w-4 h-4" /> {t('travel.back')}</button>

        <LegCard leg={out} label={isRT ? t('travel.tripDepart') : null} t={t} />
        {isRT && <LegCard leg={ret} label={t('travel.tripReturn')} t={t} />}

        {error && <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4"><AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><p className="text-sm text-red-700">{error}</p></div>}

        {/* Banner kalau fare/harga gagal dari vendor → wajib cari ulang */}
        {fareFailed && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-800">{t('travel.flightCannotBook')}</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">{fareErrorMsg} {t('travel.fareChangeHint')}</p>
              <button onClick={() => navigate('/tiket/pesawat')} className="mt-2.5 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors">
                {t('travel.searchAgainFlight')} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {adults.map((p, i) => (
          <PaxCard key={`a${i}`} title={t('travel.adultPax', { n: i + 1 })} color="text-sky-500">
            <TitleSelect value={p.title} onChange={v => setA(i, 'title', v)} opts={['MR','MRS','MS']} />
            <div className="grid grid-cols-2 gap-2.5">
              <Field label={t('travel.firstName')} value={p.firstName} onChange={v => setA(i, 'firstName', v)} />
              <Field label={t('travel.lastName')} value={p.lastName} onChange={v => setA(i, 'lastName', v)} />
            </div>
            <div>
              <DateField label={t('travel.birthdate')} value={p.birthdate} min={AGE.adult.min} max={AGE.adult.max} onChange={v => setA(i, "birthdate", v)} />
              <p className="text-[11px] text-slate-400 mt-1">{t('travel.adultAgeHint')}</p>
            </div>
            <IdentitySection p={p} set={setA} i={i} t={t} lang={lang} required />
            <div className="grid grid-cols-2 gap-2.5">
              <Field label={t('travel.phoneNo')} icon={Phone} value={p.phone} onChange={v => setA(i, 'phone', v.replace(/[^0-9]/g,''))} inputMode="numeric" />
              <Field label={t('travel.email')} icon={Mail} value={p.email} onChange={v => setA(i, 'email', v)} />
            </div>
          </PaxCard>
        ))}
        {children.map((p, i) => (
          <PaxCard key={`c${i}`} title={t('travel.childPax', { n: i + 1 })} color="text-amber-500">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label={t('travel.firstName')} value={p.firstName} onChange={v => setC(i, 'firstName', v)} />
              <Field label={t('travel.lastName')} value={p.lastName} onChange={v => setC(i, 'lastName', v)} />
            </div>
            <div>
              <DateField label={t('travel.birthdate')} value={p.birthdate} min={AGE.child.min} max={AGE.child.max} onChange={v => setC(i, "birthdate", v)} />
              <p className="text-[11px] text-slate-400 mt-1">{t('travel.childAgeHint')}</p>
            </div>
            <IdentitySection p={p} set={setC} i={i} t={t} lang={lang} />
          </PaxCard>
        ))}
        {infants.map((p, i) => (
          <PaxCard key={`inf${i}`} title={t('travel.infantPax', { n: i + 1 })} color="text-pink-500">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label={t('travel.firstName')} value={p.firstName} onChange={v => setI(i, 'firstName', v)} />
              <Field label={t('travel.lastName')} value={p.lastName} onChange={v => setI(i, 'lastName', v)} />
            </div>
            <div>
              <DateField label={t('travel.birthdate')} value={p.birthdate} min={AGE.infant.min} max={AGE.infant.max} onChange={v => setI(i, "birthdate", v)} />
              <p className="text-[11px] text-slate-400 mt-1">{t('travel.infantAgeHint')}</p>
            </div>
            <IdentitySection p={p} set={setI} i={i} t={t} lang={lang} />
          </PaxCard>
        ))}

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
          <PromoField moda="pesawat" total={total} departDate={date} onApplied={setAppliedPromo} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
          <p className="font-bold text-sm text-slate-900 mb-2.5">{t('travel.priceBreakdown')}</p>
          <div className="space-y-1.5 text-sm">
            {isRT ? (
              <>
                <div className="flex justify-between"><span className="text-slate-500">{t('travel.tripDepart')} ({payingPax} × {formatRupiah(priceOut)})</span><span className="text-slate-900">{formatRupiah(priceOut * payingPax)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{t('travel.tripReturn')} ({payingPax} × {formatRupiah(priceRet)})</span><span className="text-slate-900">{formatRupiah(priceRet * payingPax)}</span></div>
              </>
            ) : (
              <div className="flex justify-between"><span className="text-slate-500">{t('travel.ticketPriceLabel')} ({payingPax} × {formatRupiah(priceOut)})</span><span className="text-slate-900">{formatRupiah(ticketSub)}</span></div>
            )}
            {markup > 0 && <div className="flex justify-between"><span className="text-slate-500">{t('travel.serviceFee')} ({payingPax * numLegs} × {formatRupiah(markup)})</span><span className="text-slate-900">{formatRupiah(markupSub)}</span></div>}
            {promoDiscount > 0 && <div className="flex justify-between"><span className="text-slate-500">{t('travel.promoDiscountLabel')} {appliedPromo?.code ? `(${appliedPromo.code})` : ''}</span><span className="font-medium text-green-600">- {formatRupiah(promoDiscount)}</span></div>}
            <div className="flex justify-between pt-1.5 border-t border-slate-100"><span className="font-bold text-slate-900">{t('travel.total')}</span><span className="font-bold text-sky-600">{formatRupiah(finalTotal)}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky bottom-2 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div><p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{t('travel.total')}</p><p className="font-display text-xl font-bold text-sky-600">{formatRupiah(finalTotal)}</p></div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600"><ShieldCheck className="w-3.5 h-3.5" /> {t('travel.officialEticket')}</div>
          </div>
          <button onClick={submit} disabled={!valid || loading || fareFailed} className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('travel.processing')}</> : <>{t('travel.continueToPayment')} <ArrowRight className="w-4 h-4" /></>}
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
// Kewarganegaraan + identitas: WNI → NIK; WNA → paspor (sesuai standar internasional)
function IdentitySection({ p, set, i, t, lang, required }) {
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div className="space-y-2.5">
      <CountrySelect label={t('travel.nationality')} value={p.nationality || 'ID'} onChange={v => set(i, 'nationality', v)} lang={lang} />
      {isWNI(p) ? (
        <Field label={required ? t('travel.idKtp') : t('travel.nikOptional')} icon={CreditCard} value={p.idNumber} onChange={v => set(i, 'idNumber', v.replace(/[^0-9]/g, '').slice(0, 16))} inputMode="numeric" maxLength={16} />
      ) : (
        <>
          <div className="flex items-start gap-2 p-3 bg-sky-50 border border-sky-100 rounded-xl">
            <FileText className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <p className="text-xs text-sky-800 leading-relaxed">{t('travel.passportHint')}</p>
          </div>
          <Field label={t('travel.passportNumber')} icon={CreditCard} value={p.passportNumber} onChange={v => set(i, 'passportNumber', v.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())} />
          <DateField label={t('travel.passportIssueDate')} value={p.passportIssueDate} max={today} onChange={v => set(i, 'passportIssueDate', v)} />
          <CountrySelect label={t('travel.passportIssuingCountry')} value={p.passportIssuingCountry || ''} onChange={v => set(i, 'passportIssuingCountry', v)} lang={lang} placeholder={t('travel.selectCountry')} />
          <DateField label={t('travel.passportExpiry')} value={p.passportExpiry} min={today} onChange={v => set(i, 'passportExpiry', v)} />
        </>
      )}
    </div>
  )
}
function CountrySelect({ label, value, onChange, lang, placeholder }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
        {placeholder && <option value="">{placeholder}</option>}
        {sortedCountries(lang).map(c => <option key={c.code} value={c.code}>{countryName(c, lang)}</option>)}
      </select>
    </div>
  )
}
function TitleSelect({ value, onChange, opts }) {
  const { t } = useTranslation()
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 mb-1">{t('travel.salutation')}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300">
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
function Field({ label, icon: Icon, value, onChange, type = 'text', placeholder, inputMode, maxLength }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 mb-1">{label}</label>
      <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-sky-300">
        {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode} maxLength={maxLength} className="flex-1 text-sm text-slate-900 focus:outline-none bg-transparent" />
      </div>
    </div>
  )
}
function Row({ label, value, mono }) {
  return <div className="flex justify-between gap-3"><span className="text-sm text-slate-500">{label}</span><span className={`text-sm font-semibold text-slate-900 text-right ${mono ? 'font-mono' : ''}`}>{value}</span></div>
}
function LegCard({ leg, label, t }) {
  const c = leg.cls || {}
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
      {label && <span className="inline-block mb-2 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-bold uppercase tracking-wide">{label}</span>}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center"><Plane className="w-4.5 h-4.5 text-sky-600" /></div>
        <div className="min-w-0"><p className="font-bold text-sm text-slate-900">{c.flightCode}</p><span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{t('travel.classPrefix')} {c.class}</span></div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-center"><p className="font-bold text-slate-900">{c.departureTime}</p><p className="text-[10px] text-slate-400">{leg.departure.code}</p></div>
        <div className="flex-1 flex items-center gap-1.5"><div className="h-px flex-1 bg-slate-200" /><span className="text-[10px] text-slate-400">{c.duration}</span><div className="h-px flex-1 bg-slate-200" /><ArrowRight className="w-3.5 h-3.5 text-slate-300" /></div>
        <div className="text-center"><p className="font-bold text-slate-900">{c.arrivalTime}</p><p className="text-[10px] text-slate-400">{leg.arrival.code}</p></div>
      </div>
      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDMY(leg.date)}</p>
    </div>
  )
}
