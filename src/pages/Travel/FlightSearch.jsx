import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Plane, ArrowLeftRight, Calendar, Users, Search, X,
  MapPin, ArrowRight, Loader2, AlertCircle,
} from 'lucide-react'
import i18n from '@/i18n'
import { travelApi } from '@/services/index'
import { formatRupiah } from '@/utils'
import SEO from '@/components/SEO'
import LoaderArahInn from '@/components/LoaderArahInn'
import TravelPromoSection from '@/components/travel/TravelPromoSection'
import FlightRangeCalendar from '@/components/travel/FlightRangeCalendar'
import bannerFlight from '@/assets/banners/cari-pesawat.webp'

const FLIGHT_LOADER_MESSAGES = [
  'Mencari penerbangan terbaik...',
  'Membandingkan harga maskapai...',
  'Memeriksa ketersediaan kursi...',
  'Menyiapkan perjalanan Anda...',
]

// Tanggal LOKAL (YYYY-MM-DD) — JANGAN toISOString() (itu UTC, mundur sehari di WIB).
const pad2 = (n) => String(n).padStart(2, '0')
const ymdLocal = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const todayStr = () => ymdLocal(new Date())
const dateLocale = () => (i18n.language === 'en' ? 'en-US' : 'id-ID')
const formatDateSlash = (ymd) => { if (!ymd) return '-'; const dt = new Date(`${ymd}T00:00:00`); return dt.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' }) }
const formatDateFull = (ymd) => { if (!ymd) return '-'; const dt = new Date(`${ymd}T00:00:00`); return dt.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }
const titleCase = (s) => (s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
const airlineLogo = (code) => `https://api.fastravel.co.id/assets/maskapai/${code}.png`

/* ── Highlight teks yang cocok dengan query ───────────────────────────── */
function Highlight({ text, q }) {
  const s = text ?? ''
  if (!q) return s
  const idx = s.toLowerCase().indexOf(q)
  if (idx === -1) return s
  return (
    <>{s.slice(0, idx)}<span className="text-sky-600 font-semibold">{s.slice(idx, idx + q.length)}</span>{s.slice(idx + q.length)}</>
  )
}

/* ── Airport picker (full-screen di mobile, search pinned di atas) ─────── */
function AirportPicker({ open, airports, title, onPick, onClose }) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  useEffect(() => {
    if (open) { setQ(''); const id = setTimeout(() => inputRef.current?.focus(), 60); return () => clearTimeout(id) }
  }, [open])
  if (!open) return null
  const term = q.trim().toLowerCase()
  const filtered = (airports || []).filter(a =>
    `${a.name} ${a.bandara} ${a.group} ${a.code}`.toLowerCase().includes(term)
  ).slice(0, 80)
  const subOf = (a) => [a.bandara, a.group].filter((v, i, arr) => v && arr.indexOf(v) === i).join(', ')

  return (
    <div className="fixed inset-0 z-50 bg-white sm:bg-slate-900/60 sm:backdrop-blur-sm sm:flex sm:items-center sm:justify-center sm:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="flex flex-col h-full w-full bg-white overflow-hidden sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-3xl sm:shadow-2xl">
        {/* Search bar pinned di atas (anti ketutup keyboard) */}
        <div className="shrink-0 flex items-center gap-2 px-3 pb-3 border-b border-slate-100"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)' }}>
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder={title || t('travel.searchCityAirport')}
              className="w-full pl-9 pr-9 py-2.5 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            {q && (
              <button onClick={() => { setQ(''); inputRef.current?.focus() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 px-2 py-1 text-sm font-semibold text-sky-600">{t('common.cancel')}</button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {filtered.length === 0 && <p className="text-center text-sm text-slate-400 py-10">{t('travel.airportNotFound')}</p>}
          {filtered.map(a => (
            <button key={a.code} onClick={() => { onPick(a); onClose() }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 text-left border-b border-slate-50">
              <Plane className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-slate-900 truncate">
                  <Highlight text={a.name} q={term} />{' '}
                  <span className="font-mono text-xs text-slate-500"><Highlight text={a.code} q={term} /></span>
                </p>
                <p className="text-xs text-slate-500 truncate"><Highlight text={subOf(a)} q={term} /></p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Airline logo with fallback ───────────────────────────────────────── */
function AirlineLogo({ code, name }) {
  const [err, setErr] = useState(false)
  if (err || !code) return <div className="w-7 h-7 rounded-md bg-sky-100 flex items-center justify-center shrink-0"><Plane className="w-3.5 h-3.5 text-sky-600" /></div>
  return <img src={airlineLogo(code)} alt={name} onError={() => setErr(true)} className="w-7 h-7 rounded-md object-contain shrink-0" />
}

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function FlightSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [departure, setDeparture] = useState(null)
  const [arrival, setArrival]     = useState(null)
  const [date, setDate]   = useState(todayStr())
  const [adult, setAdult] = useState(1)
  const [child, setChild] = useState(0)
  const [infant, setInfant] = useState(0)
  const [picker, setPicker] = useState(null)
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(true)
  const [sortBy, setSortBy] = useState('price')      // 'price' | 'departure'
  const [airlineFilter, setAirlineFilter] = useState('')  // '' = semua
  // Pulang-pergi
  const [tripType, setTripType]   = useState('oneway')  // 'oneway' | 'roundtrip'
  const [returnDate, setReturnDate] = useState('')
  const [leg, setLeg]   = useState('depart')            // leg yang sedang dipilih (PP): depart | return
  const [outboundSel, setOutboundSel] = useState(null)  // simpan pilihan leg pergi
  const resultsRef = useRef(null)
  const dateRef = useRef(null)
  const returnDateRef = useRef(null)

  const { data: airports = [] } = useQuery({
    queryKey: ['flight-airports'], queryFn: () => travelApi.airports().then(r => r.data?.data || []), staleTime: 86400_000,
  })
  const { data: markup = 0 } = useQuery({
    queryKey: ['travel-markup'], queryFn: () => travelApi.settings().then(r => r.data?.data?.markupPerPax ?? 0), staleTime: 3600_000,
  })

  // Kalender rentang (PP) + harga termurah HANYA untuk 2 tanggal terpilih.
  const [calOpen, setCalOpen] = useState(false)
  const cheapest = async (dep, arr, dt) => {
    if (!dep || !arr || !dt) return null
    const r = await travelApi.searchAllFlights({ departure: dep, arrival: arr, departureDate: dt, adult, child, infant })
    const min = Math.min(...(r.data?.data ?? []).map(f => Number(f.classes?.[0]?.[0]?.price) || Infinity))
    return Number.isFinite(min) ? min + Number(markup || 0) : null
  }
  const departPriceQ = useQuery({
    queryKey: ['flight-cheapest', departure?.code, arrival?.code, date, adult, child, infant],
    queryFn: () => cheapest(departure.code, arrival.code, date),
    enabled: calOpen && tripType === 'roundtrip' && !!departure && !!arrival && !!date,
    staleTime: 300_000,
  })
  const returnPriceQ = useQuery({
    queryKey: ['flight-cheapest-ret', arrival?.code, departure?.code, returnDate, adult, child, infant],
    queryFn: () => cheapest(arrival.code, departure.code, returnDate),
    enabled: calOpen && tripType === 'roundtrip' && !!departure && !!arrival && !!returnDate,
    staleTime: 300_000,
  })

  const openDatePicker = () => { const el = dateRef.current; if (!el) return; try { el.showPicker ? el.showPicker() : el.focus() } catch { el.focus() } }
  const swap = () => { setDeparture(arrival); setArrival(departure) }
  const canSearch = departure && arrival && departure.code !== arrival.code && date
    && (tripType === 'oneway' || (returnDate && returnDate >= date))
  const openReturnPicker = () => { const el = returnDateRef.current; if (!el) return; try { el.showPicker ? el.showPicker() : el.focus() } catch { el.focus() } }
  const isReturnLeg = tripType === 'roundtrip' && leg === 'return'
  const dispFrom = isReturnLeg ? arrival : departure
  const dispTo   = isReturnLeg ? departure : arrival
  const dispDate = isReturnLeg ? returnDate : date

  const paxField = (
    <div className="p-3 rounded-xl border border-slate-200">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Users className="w-3 h-3" /> {t('travel.passengers')}</p>
      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
        <select value={adult} onChange={e => setAdult(+e.target.value)} className="text-sm font-semibold bg-transparent focus:outline-none">{[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} {t('travel.adultShort')}</option>)}</select>
        <select value={child} onChange={e => setChild(+e.target.value)} className="text-xs text-slate-500 bg-transparent focus:outline-none">{[0,1,2,3,4].map(n => <option key={n} value={n}>{n} {t('travel.childShort')}</option>)}</select>
        <select value={infant} onChange={e => setInfant(+e.target.value)} className="text-xs text-slate-500 bg-transparent focus:outline-none">{[0,1,2,3,4].map(n => <option key={n} value={n}>{n} {t('travel.infantShort')}</option>)}</select>
      </div>
    </div>
  )

  const cls0 = (f) => (f.classes?.[0]?.[0]) || {}
  const priceOf = (f) => Number(cls0(f).price) || 0

  // Filter maskapai + sort
  const view = useMemo(() => {
    if (!results) return null
    let arr = results.filter(f => !airlineFilter || f.airline === airlineFilter)
    arr = [...arr].sort((a, b) => {
      if (sortBy === 'price') {
        const pa = priceOf(a) || Infinity, pb = priceOf(b) || Infinity
        return pa - pb
      }
      return (cls0(a).departureTime || '').localeCompare(cls0(b).departureTime || '')
    })
    return arr
  }, [results, airlineFilter, sortBy])

  // Daftar maskapai yang ada di hasil (untuk chip filter)
  const airlinesInResults = useMemo(() => {
    if (!results) return []
    const m = new Map()
    results.forEach(f => { if (!m.has(f.airline)) m.set(f.airline, f.airlineName || f.airline) })
    return [...m.entries()].map(([code, name]) => ({ code, name }))
  }, [results])

  const doSearch = async (which = 'depart') => {
    if (which === 'depart' && !canSearch) return
    const isReturn = which === 'return'
    const dep = isReturn ? arrival.code : departure.code
    const arr = isReturn ? departure.code : arrival.code
    const d   = isReturn ? returnDate : date
    setSearching(true); setError(null); setResults(null); setAirlineFilter(''); setSortBy('price'); setLeg(which)
    if (which === 'depart') setOutboundSel(null)
    try {
      const res = await travelApi.searchAllFlights({
        departure: dep, arrival: arr, departureDate: d, adult, child, infant,
      })
      const data = res.data?.data || []
      setResults(data)
      if (data.length > 0) {
        setShowForm(false)
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      } else {
        setShowForm(true)
      }
    } catch (e) {
      setError(e?.response?.data?.message || t('travel.flightSearchError'))
    } finally { setSearching(false) }
  }

  const selectFlight = (flight) => {
    const cls = cls0(flight)
    // Sekali jalan → langsung ke form pemesanan
    if (tripType === 'oneway') {
      sessionStorage.setItem('flight_selection', JSON.stringify({
        departure, arrival, date, airline: flight.airline, adult, child, infant, flight, cls, markup,
      }))
      navigate('/tiket/pesawat/pesan'); return
    }
    // PP — leg PERGI dipilih → simpan, lalu cari leg PULANG
    if (leg === 'depart') {
      setOutboundSel({ departure, arrival, date, airline: flight.airline, flight, cls })
      doSearch('return')
      return
    }
    // PP — leg PULANG dipilih (flight ini arrival→departure pada returnDate)
    const ret = { departure: arrival, arrival: departure, date: returnDate, airline: flight.airline, flight, cls }
    sessionStorage.setItem('flight_selection', JSON.stringify({
      tripType: 'roundtrip', adult, child, infant, markup,
      outbound: outboundSel, return: ret,
    }))
    navigate('/tiket/pesawat/pesan')
  }

  return (
    <div className="min-h-[70vh] bg-slate-50">
      {searching && <LoaderArahInn messages={FLIGHT_LOADER_MESSAGES} />}
      <SEO title={t('travel.flightSeoTitle')} description={t('travel.flightSeoDesc')} url="/tiket/pesawat" />

      {showForm && (
        <img src={bannerFlight} alt="Cari Tiket Pesawat ArahInn" width="1731" height="909"
          className="block w-full h-auto" loading="eager" fetchpriority="high" />
      )}

      {showForm && (
      <section className="relative z-10">
        <div className="container -mt-[24vw] sm:-mt-[21vw] lg:-mt-[18vw] pb-6 sm:pb-8 relative z-10">
          <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl p-3.5 sm:p-4 text-slate-900">
            {/* Tipe perjalanan */}
            <div className="flex gap-2 mb-3">
              {[['oneway', t('travel.oneWay')], ['roundtrip', t('travel.roundTrip')]].map(([k, l]) => (
                <button key={k} type="button"
                  onClick={() => { setTripType(k); setLeg('depart'); setOutboundSel(null); if (k === 'oneway') setReturnDate('') }}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${tripType === k ? 'bg-sky-50 border-sky-500 text-sky-700' : 'bg-white/50 border-white/60 text-slate-600'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="relative grid grid-cols-1 gap-2.5">
              <button onClick={() => setPicker('departure')} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-sky-400 text-left transition-colors">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t('travel.from')}</p>
                  <p className={`text-sm font-semibold truncate ${departure ? 'text-slate-900' : 'text-slate-400'}`}>{departure ? `${departure.name} (${departure.code})` : t('travel.pickDeparture')}</p>
                </div>
              </button>
              <button onClick={() => setPicker('arrival')} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-sky-400 text-left transition-colors">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t('travel.to')}</p>
                  <p className={`text-sm font-semibold truncate ${arrival ? 'text-slate-900' : 'text-slate-400'}`}>{arrival ? `${arrival.name} (${arrival.code})` : t('travel.pickArrival')}</p>
                </div>
              </button>
              <button onClick={swap} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-sky-500 text-white shadow-md flex items-center justify-center active:scale-90 transition-transform z-10"><ArrowLeftRight className="w-4 h-4 rotate-90" /></button>
            </div>

            <div className="relative">
            <div className="grid grid-cols-2 gap-2.5 mt-2.5">
              <div className="relative p-3 rounded-xl border border-slate-200 cursor-pointer" onClick={tripType === 'roundtrip' ? () => setCalOpen(true) : openDatePicker}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Calendar className="w-3 h-3" /> {tripType === 'roundtrip' ? t('travel.departDate') : t('travel.date')}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{formatDateSlash(date)}</p>
                <input ref={dateRef} type="date" value={date} min={todayStr()} onChange={e => { setDate(e.target.value); if (returnDate && returnDate < e.target.value) setReturnDate('') }} className="absolute bottom-1 left-3 w-px h-px opacity-0 pointer-events-none" tabIndex={-1} />
              </div>
              {tripType === 'roundtrip' ? (
                <div className="relative p-3 rounded-xl border border-slate-200 cursor-pointer" onClick={() => setCalOpen(true)}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Calendar className="w-3 h-3" /> {t('travel.returnDate')}</p>
                  <p className={`text-sm font-semibold mt-0.5 ${returnDate ? 'text-slate-900' : 'text-slate-400'}`}>{returnDate ? formatDateSlash(returnDate) : t('travel.pickReturnDate')}</p>
                </div>
              ) : paxField}
            </div>
            {calOpen && tripType === 'roundtrip' && (
              <FlightRangeCalendar
                value={{ depart: date, return: returnDate }}
                onChange={({ depart, return: r }) => { setDate(depart); setReturnDate(r) }}
                onClose={() => setCalOpen(false)}
                onConfirm={() => setCalOpen(false)}
                prices={{ depart: departPriceQ.data ?? null, return: returnPriceQ.data ?? null }}
                pricesLoading={departPriceQ.isFetching || returnPriceQ.isFetching}
              />
            )}
            </div>
            {tripType === 'roundtrip' && <div className="mt-2.5">{paxField}</div>}

            <button onClick={() => doSearch('depart')} disabled={!canSearch || searching} className="w-full mt-3 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50">
              {searching ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('travel.searchingAirlines')}</> : <><Search className="w-4 h-4" /> {t('travel.searchFlights')}</>}
            </button>
          </div>
        </div>
      </section>
      )}

      <section ref={resultsRef} className="container py-5">
        {error && (
          <div className="flex items-start gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl mb-4"><AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><p className="text-sm text-red-700">{error}</p></div>
        )}

        {results && results.length > 0 && (
          <>
            {/* Banner langkah PP */}
            {tripType === 'roundtrip' && (
              <div className="mb-3 rounded-xl bg-sky-50 border border-sky-200 p-3">
                <p className="text-xs font-bold text-sky-700 flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5" /> {leg === 'depart' ? t('travel.stepPickDepart') : t('travel.stepPickReturn')}
                </p>
                {leg === 'return' && outboundSel && (
                  <p className="text-[11px] text-slate-600 mt-1">
                    {t('travel.departChosen')}: <span className="font-semibold">{outboundSel.departure?.code}→{outboundSel.arrival?.code}</span> {cls0(outboundSel.flight).departureTime} · {outboundSel.flight.airlineName}
                  </p>
                )}
              </div>
            )}

            {/* Summary header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2 flex-wrap leading-tight">{titleCase(dispFrom?.name)} <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" /> {titleCase(dispTo?.name)}</p>
                <p className="text-xs text-slate-500 mt-1">{formatDateFull(dispDate)} · {adult} {t('travel.adultLabel')}{child>0?`, ${child} ${t('travel.childLabel')}`:''}{infant>0?`, ${infant} ${t('travel.infantLabel')}`:''}</p>
              </div>
              <button onClick={() => { setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="shrink-0 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold active:scale-95 transition-all">{t('travel.changeSearch')}</button>
            </div>

            {/* Sort + airline filter */}
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-slate-500 shrink-0">{t('travel.sortLabel')}</span>
              {[['price',t('travel.sortCheapest')],['departure',t('travel.sortEarliest')]].map(([k,l]) => (
                <button key={k} onClick={() => setSortBy(k)} className={`px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 ${sortBy===k?'bg-sky-50 border-sky-500 text-sky-700':'bg-white border-slate-200 text-slate-500'}`}>{l}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
              <button onClick={() => setAirlineFilter('')} className={`px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 ${!airlineFilter?'bg-sky-50 border-sky-500 text-sky-700':'bg-white border-slate-200 text-slate-500'}`}>{t('travel.allAirlines')}</button>
              {airlinesInResults.map(a => (
                <button key={a.code} onClick={() => setAirlineFilter(a.code)} className={`px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 flex items-center gap-1.5 ${airlineFilter===a.code?'bg-sky-50 border-sky-500 text-sky-700':'bg-white border-slate-200 text-slate-500'}`}>
                  <AirlineLogo code={a.code} name={a.name} /> {a.name}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-400 mb-2">{t('travel.flightsCount', { count: view.length })}</p>

            {/* Flight cards */}
            <div className="space-y-3">
              {view.map((flight, i) => {
                const cls = cls0(flight)
                const price = Number(cls.price) || 0
                return (
                  <div key={`${cls.flightCode}-${i}`} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <AirlineLogo code={flight.airline} name={flight.airlineName} />
                      <span className="font-bold text-sm text-slate-900">{flight.airlineName}</span>
                      <span className="text-[10px] text-slate-400">· {cls.flightCode}</span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-5">
                      <div className="flex-1 flex items-center gap-2 sm:gap-3">
                        <div className="text-center"><p className="font-bold text-slate-900 text-sm sm:text-base">{cls.departureTime}</p><p className="text-[10px] text-slate-400 font-semibold">{cls.departure}</p></div>
                        <div className="flex-1 flex flex-col items-center">
                          <span className="text-[10px] text-slate-400">{cls.duration}</span>
                          <div className="w-full flex items-center gap-1 my-0.5"><div className="h-px flex-1 bg-slate-200" /><Plane className="w-3 h-3 text-slate-300" /><div className="h-px flex-1 bg-slate-200" /></div>
                          <span className="text-[9px] text-emerald-600 font-bold">{flight.isTransit ? t('travel.transit') : t('travel.direct')}</span>
                        </div>
                        <div className="text-center"><p className="font-bold text-slate-900 text-sm sm:text-base">{cls.arrivalTime}</p><p className="text-[10px] text-slate-400 font-semibold">{cls.arrival}</p></div>
                      </div>
                      <div className="text-right shrink-0">
                        {price > 0
                          ? <p className="font-display text-sm sm:text-lg font-bold text-sky-600 leading-tight">{formatRupiah(price + markup)}<span className="text-[10px] font-normal text-slate-400">{t('travel.perPax')}</span></p>
                          : <p className="text-[11px] font-bold text-sky-600">{t('travel.checkPrice')}</p>}
                        <button onClick={() => selectFlight(flight)} className="mt-2 px-5 py-2 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-bold active:scale-95 transition-all">{t('travel.select')}</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {results && results.length === 0 && !searching && (
          <div className="text-center py-12"><Plane className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="font-semibold text-slate-700">{t('travel.noFlights')}</p><p className="text-sm text-slate-400 mt-1">{t('travel.noFlightsDesc')}</p></div>
        )}
        {!results && !searching && (
          <TravelPromoSection product="pesawat" />
        )}
      </section>

      <AirportPicker open={picker === 'departure'} airports={airports} title={t('travel.originAirport')} onPick={setDeparture} onClose={() => setPicker(null)} />
      <AirportPicker open={picker === 'arrival'} airports={airports} title={t('travel.destAirport')} onPick={setArrival} onClose={() => setPicker(null)} />
    </div>
  )
}
