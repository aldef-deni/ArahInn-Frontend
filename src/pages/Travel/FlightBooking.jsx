import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Plane, ArrowRight, User, Calendar, Phone, CreditCard, Mail,
  Loader2, AlertCircle, CheckCircle2, ChevronLeft, ShieldCheck, FileText, Luggage,
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
const emptyAdult = () => ({ title: 'MR', firstName: '', lastName: '', noLastName: false, birthdate: '', ...emptyId, phone: '', email: '' })
const emptyKid   = () => ({ title: 'MSTR', firstName: '', lastName: '', noLastName: false, birthdate: '', ...emptyId })
const isWNI = (p) => (p.nationality || 'ID') === 'ID'
// Ketentuan bagasi per kode maskapai (sinkron dgn BE App\Support\AirlineNotes)
const FLIGHT_BAGGAGE = {
  TPGA: 'Kabin 7KG + bagasi 20KG', TPID: 'Kabin 7KG + bagasi 20KG',
  TPSJ: 'Kabin 7KG + bagasi 20KG', TPIN: 'Kabin 7KG + bagasi 20KG',
  TPQG: 'Kabin 7KG + bagasi 15KG', TPJT: 'Bagasi 15KG', TPIW: 'Bagasi 10KG',
  TPQZ: 'Kabin 7KG (bagasi berbayar)',
}
const baggageText = (code) => FLIGHT_BAGGAGE[String(code || '').toUpperCase()] || 'Kabin 7KG + bagasi 20KG'
// Bandara provider: group "Internasional" = luar negeri, "Domestik" = Indonesia.
const isIntlAirport = (a) => String(a?.group || '').toLowerCase().startsWith('internas')
const isIntlRoute = (dep, arr) => isIntlAirport(dep) || isIntlAirport(arr)
// Vendor wajib NIK untuk WNI (domestik & internasional). Paspor diwajibkan bila WNA
// ATAU rute internasional (WNI ke luar negeri = NIK + paspor).
const passportOk = (p) => !!p.passportNumber && !!p.passportIssueDate && !!p.passportIssuingCountry && !!p.passportExpiry
const idOk = (p, req, intl) => {
  const nikOk  = isWNI(p) ? (req ? !!p.idNumber : true) : true
  const passOk = (!isWNI(p) || intl) ? passportOk(p) : true
  return nikOk && passOk
}

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
    // Pulihkan draft penumpang agar isian tak hilang saat balik pilih maskapai/tanggal lain.
    let draft = null
    try { draft = JSON.parse(sessionStorage.getItem('flight_pax_draft') || 'null') } catch { draft = null }
    const build = (count, factory, saved) => Array.from({ length: count }, (_, i) => ({ ...factory(), ...(saved?.[i] || {}) }))
    setAdults(build(sel.adult || 1, emptyAdult, draft?.adults))
    setChildren(build(sel.child || 0, emptyKid, draft?.children))
    setInfants(build(sel.infant || 0, emptyKid, draft?.infants))
  }, [sel, navigate])

  // Simpan draft penumpang tiap kali berubah (bertahan lintas navigasi dalam sesi).
  useEffect(() => {
    if (!adults.length && !children.length && !infants.length) return
    try { sessionStorage.setItem('flight_pax_draft', JSON.stringify({ adults, children, infants })) } catch { /* abaikan */ }
  }, [adults, children, infants])

  if (!sel) return null
  // Normalisasi leg: one-way = 1 leg (pergi); pulang-pergi = [pergi, pulang]
  const isRT = sel.tripType === 'roundtrip'
  const out  = isRT ? sel.outbound : { departure: sel.departure, arrival: sel.arrival, date: sel.date, airline: sel.airline, airlineName: sel.flight?.airlineName ?? sel.airlineName, cls: sel.cls }
  const ret  = isRT ? sel.return : null
  // Alias kompat untuk blok lama (booked screen) — pakai leg pergi
  const { departure, arrival, date, cls } = out
  // Rute internasional bila bandara asal/tujuan (leg pergi ATAU pulang/PP) ada yang luar negeri.
  const intl = isIntlRoute(out.departure, out.arrival) || (!!ret && isIntlRoute(ret.departure, ret.arrival))

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
  // Pesan vendor (kursi/kelas habis) → ubah jadi bahasa awam yang membantu
  const friendlyFareMsg = (msg) => {
    const m = String(msg || '').toLowerCase()
    if (/kursi|kelas|habis|penuh|sold|seat|avail|class/.test(m)) return t('travel.flightFull')
    return msg || t('travel.fareErrorDefault')
  }
  const fareErrorMsg = fareFailed
    ? friendlyFareMsg((fareOut.error || fareRet.error)?.response?.data?.message)
    : null

  // Begitu vendor menolak fare (kursi habis dll), tampilkan popup otomatis — tak perlu scroll
  useEffect(() => {
    if (fareFailed && fareErrorMsg) setError({ msg: fareErrorMsg, searchAgain: true })
  }, [fareFailed, fareErrorMsg])

  const svcFee    = sel.svcFee || { amount: 0, percent: 0 }
  const payingPax = (sel.adult || 1) + (sel.child || 0)   // bayi umumnya tanpa kursi
  const numLegs   = isRT ? 2 : 1
  // ⚠️ Fare vendor mengembalikan TOTAL untuk semua pax (sudah termasuk pajak), sedangkan
  // harga search bersifat per-pax. Jadikan per-pax agar konsisten (display & BE mengalikan × pax).
  const perPaxFromFare = (fareTotal, searchPrice) => {
    const ft = Number(fareTotal) || 0
    return ft > 0 ? Math.round(ft / Math.max(1, payingPax)) : (Number(searchPrice) || 0)
  }
  const priceOut  = perPaxFromFare(fareOut.data?.price, out?.cls?.price)
  const priceRet  = isRT ? perPaxFromFare(fareRet.data?.price, ret?.cls?.price) : 0
  const ticketSub = (priceOut + priceRet) * payingPax
  // Biaya penanganan: persen → % dari subtotal tiket; selain itu nominal × pax × leg.
  const markupSub = Number(svcFee.percent) > 0
    ? Math.round(Number(svcFee.percent) / 100 * ticketSub)
    : (Number(svcFee.amount) || 0) * payingPax * numLegs
  const total     = ticketSub + markupSub
  const promoDiscount = appliedPromo?.discount || 0
  const finalTotal    = Math.max(0, total - promoDiscount)

  const upd = (setter) => (i, k, v) => setter(a => a.map((p, idx) => idx === i ? { ...p, [k]: v } : p))
  const setA = upd(setAdults), setC = upd(setChildren), setI = upd(setInfants)

  // Nama belakang: jika "tidak punya nama belakang" dicentang, samakan lastName = firstName
  // agar vendor tetap menerima nama belakang valid (sesuai perilaku mobile).
  const setFirst = (set, i, v, p) => { set(i, 'firstName', v); if (p.noLastName) set(i, 'lastName', v) }
  const toggleNoLast = (set, i, p) => { const on = !p.noLastName; set(i, 'noLastName', on); if (on) set(i, 'lastName', p.firstName) }

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
        if (!p.noLastName && !p.lastName) return t('travel.errNeedLastName', { who })
        if (!p.birthdate) return t('travel.errNeedBirth', { who })
        if (!inAge(p.birthdate, cat)) return t(`travel.errAge_${cat}`, { who })
        // Identitas — pesan spesifik per field (domestik & internasional)
        if (isWNI(p)) {
          if (cat === 'adult' && !p.idNumber) return t('travel.errNeedNik', { who })
          if (p.idNumber && p.idNumber.length !== 16) return t('travel.errNikDigits', { who })
        }
        if (!isWNI(p) || intl) {
          if (!p.passportNumber) return t('travel.errNeedPassportNo', { who })
          if (!p.passportIssueDate) return t('travel.errNeedPassportIssue', { who })
          if (!p.passportIssuingCountry) return t('travel.errNeedPassportCountry', { who })
          if (!p.passportExpiry) return t('travel.errNeedPassportExpiry', { who })
          if (p.passportExpiry <= TODAY_YMD) return t('travel.errPassportExpired', { who })
        }
        if (reqPhone && !p.phone) return t('travel.errNeedPhone', { who })
        if (reqPhone && !p.email) return t('travel.errNeedEmail', { who })
        if (reqPhone && p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) return t('travel.errEmailInvalid', { who })
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
    if (fareFailed) { setError({ msg: fareErrorMsg, searchAgain: true }); return }
    const vErr = validationError()
    if (vErr) { setError({ msg: vErr }); return }
    setLoading(true); setError(null)
    try {
      const res = isRT
        ? await travelApi.checkout({
            moda: 'pesawat', tripType: 'roundtrip',
            adult: sel.adult || 1, child: sel.child || 0, infant: sel.infant || 0, markup: markupSub,
            promoCode: appliedPromo?.code || undefined,
            outbound: legPayload(out, priceOut),
            return:   legPayload(ret, priceRet),
            passengers: { adults, children, infants },
          })
        : await travelApi.checkout({
            moda: 'pesawat', ...legPayload(out, priceOut),
            adult: sel.adult || 1, child: sel.child || 0, infant: sel.infant || 0, markup: markupSub,
            promoCode: appliedPromo?.code || undefined,
            passengers: { adults, children, infants },
          })
      const data = res.data?.data
      // URL pembayaran pakai KODE booking (TRV…), bukan id numerik
      const ref = isRT ? (data?.depart?.code ?? data?.depart?.id) : (data?.code ?? data?.id)
      if (ref) { try { sessionStorage.removeItem('flight_pax_draft') } catch { /* abaikan */ } navigate(`/tiket/bayar/${ref}`, { state: { moda: 'pesawat' } }) }
      else setError({ msg: t('travel.createOrderFailed') })
    } catch (e) {
      setError({ msg: travelCheckoutError(e) })
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
              <Field label={t('travel.firstName')} value={p.firstName} onChange={v => setFirst(setA, i, v, p)} />
              <Field label={t('travel.lastName')} value={p.noLastName ? p.firstName : p.lastName} onChange={v => setA(i, 'lastName', v)} disabled={p.noLastName} />
            </div>
            <label className="flex items-center gap-2 -mt-1 cursor-pointer select-none">
              <input type="checkbox" checked={!!p.noLastName} onChange={() => toggleNoLast(setA, i, p)} className="w-4 h-4 accent-sky-500" />
              <span className="text-[11px] text-slate-600">{t('travel.noLastName')}</span>
            </label>
            <div>
              <DateField label={t('travel.birthdate')} value={p.birthdate} min={AGE.adult.min} max={AGE.adult.max} onChange={v => setA(i, "birthdate", v)} />
              <p className="text-[11px] text-slate-400 mt-1">{t('travel.adultAgeHint')}</p>
            </div>
            <IdentitySection p={p} set={setA} i={i} t={t} lang={lang} intl={intl} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Field label={t('travel.phoneNo')} icon={Phone} value={p.phone} onChange={v => setA(i, 'phone', v.replace(/[^0-9]/g,''))} inputMode="numeric" />
              <Field label={t('travel.email')} icon={Mail} value={p.email} onChange={v => setA(i, 'email', v)} />
            </div>
          </PaxCard>
        ))}
        {children.map((p, i) => (
          <PaxCard key={`c${i}`} title={t('travel.childPax', { n: i + 1 })} color="text-amber-500">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label={t('travel.firstName')} value={p.firstName} onChange={v => setFirst(setC, i, v, p)} />
              <Field label={t('travel.lastName')} value={p.noLastName ? p.firstName : p.lastName} onChange={v => setC(i, 'lastName', v)} disabled={p.noLastName} />
            </div>
            <label className="flex items-center gap-2 -mt-1 cursor-pointer select-none">
              <input type="checkbox" checked={!!p.noLastName} onChange={() => toggleNoLast(setC, i, p)} className="w-4 h-4 accent-sky-500" />
              <span className="text-[11px] text-slate-600">{t('travel.noLastName')}</span>
            </label>
            <div>
              <DateField label={t('travel.birthdate')} value={p.birthdate} min={AGE.child.min} max={AGE.child.max} onChange={v => setC(i, "birthdate", v)} />
              <p className="text-[11px] text-slate-400 mt-1">{t('travel.childAgeHint')}</p>
            </div>
            <IdentitySection p={p} set={setC} i={i} t={t} lang={lang} intl={intl} />
          </PaxCard>
        ))}
        {infants.map((p, i) => (
          <PaxCard key={`inf${i}`} title={t('travel.infantPax', { n: i + 1 })} color="text-pink-500">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label={t('travel.firstName')} value={p.firstName} onChange={v => setFirst(setI, i, v, p)} />
              <Field label={t('travel.lastName')} value={p.noLastName ? p.firstName : p.lastName} onChange={v => setI(i, 'lastName', v)} disabled={p.noLastName} />
            </div>
            <label className="flex items-center gap-2 -mt-1 cursor-pointer select-none">
              <input type="checkbox" checked={!!p.noLastName} onChange={() => toggleNoLast(setI, i, p)} className="w-4 h-4 accent-sky-500" />
              <span className="text-[11px] text-slate-600">{t('travel.noLastName')}</span>
            </label>
            <div>
              <DateField label={t('travel.birthdate')} value={p.birthdate} min={AGE.infant.min} max={AGE.infant.max} onChange={v => setI(i, "birthdate", v)} />
              <p className="text-[11px] text-slate-400 mt-1">{t('travel.infantAgeHint')}</p>
            </div>
            <IdentitySection p={p} set={setI} i={i} t={t} lang={lang} intl={intl} />
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
            {markupSub > 0 && <div className="flex justify-between"><span className="text-slate-500">{t('travel.serviceFee')}</span><span className="text-slate-900">{formatRupiah(markupSub)}</span></div>}
            {promoDiscount > 0 && <div className="flex justify-between"><span className="text-slate-500">{t('travel.promoDiscountLabel')} {appliedPromo?.code ? `(${appliedPromo.code})` : ''}</span><span className="font-medium text-green-600">- {formatRupiah(promoDiscount)}</span></div>}
            <div className="flex justify-between pt-1.5 border-t border-slate-100"><span className="font-bold text-slate-900">{t('travel.total')}</span><span className="font-bold text-sky-600">{formatRupiah(finalTotal)}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky bottom-2 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div><p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{t('travel.total')}</p><p className="font-display text-xl font-bold text-sky-600">{formatRupiah(finalTotal)}</p></div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600"><ShieldCheck className="w-3.5 h-3.5" /> {t('travel.officialEticket')}</div>
          </div>
          <button onClick={submit} disabled={loading} className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('travel.processing')}</> : <>{t('travel.continueToPayment')} <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>

      {/* Popup error — muncul di tengah layar, customer tak perlu scroll */}
      {error && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setError(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
            </div>
            <p className="text-center text-sm text-slate-700 leading-relaxed mb-5 whitespace-pre-line">{error.msg}</p>
            <div className="flex flex-col gap-2">
              {error.searchAgain && (
                <button onClick={() => navigate('/tiket/pesawat')} className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-colors">
                  {t('travel.searchAgainFlight')} <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setError(null)} className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors">
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
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
function IdentitySection({ p, set, i, t, lang, required, intl }) {
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div className="space-y-2.5">
      <CountrySelect label={t('travel.nationality')} value={p.nationality || 'ID'} onChange={v => set(i, 'nationality', v)} lang={lang} />
      {isWNI(p) && (
        <Field label={required ? t('travel.idKtp') : t('travel.nikOptional')} icon={CreditCard} value={p.idNumber} onChange={v => set(i, 'idNumber', v.replace(/[^0-9]/g, '').slice(0, 16))} inputMode="numeric" maxLength={16} />
      )}
      {(!isWNI(p) || intl) && (
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
function Field({ label, icon: Icon, value, onChange, type = 'text', placeholder, inputMode, maxLength, disabled }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 mb-1">{label}</label>
      <div className={`flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 min-w-0 focus-within:ring-2 focus-within:ring-sky-300 ${disabled ? 'bg-slate-100' : ''}`}>
        {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode} maxLength={maxLength} disabled={disabled} className="flex-1 min-w-0 w-full text-sm text-slate-900 focus:outline-none bg-transparent disabled:text-slate-400" />
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
        <div className="min-w-0"><p className="font-bold text-sm text-slate-900 truncate">{leg.flight?.airlineName ?? leg.airlineName ?? leg.airline}</p><span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{c.flightCode} · {t('travel.classPrefix')} {c.class}</span></div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-center"><p className="font-bold text-slate-900">{c.departureTime}</p><p className="text-[10px] text-slate-400">{leg.departure.code}</p></div>
        <div className="flex-1 flex items-center gap-1.5"><div className="h-px flex-1 bg-slate-200" /><span className="text-[10px] text-slate-400">{c.duration}</span><div className="h-px flex-1 bg-slate-200" /><ArrowRight className="w-3.5 h-3.5 text-slate-300" /></div>
        <div className="text-center"><p className="font-bold text-slate-900">{c.arrivalTime}</p><p className="text-[10px] text-slate-400">{leg.arrival.code}</p></div>
      </div>
      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDMY(leg.date)}</p>
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
          <Luggage className="w-3 h-3 text-slate-400" /> {t('travel.baggageLabel')}: {baggageText(leg.airline)}
        </span>
        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-2 py-1">{t('travel.nonRefund')}</span>
        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-2 py-1">{t('travel.nonReschedule')}</span>
      </div>
    </div>
  )
}
