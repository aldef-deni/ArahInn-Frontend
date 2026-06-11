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

const todayStr = () => new Date().toISOString().slice(0, 10)
const dateLocale = () => (i18n.language === 'en' ? 'en-US' : 'id-ID')
const formatDateSlash = (ymd) => { if (!ymd) return '-'; const dt = new Date(`${ymd}T00:00:00`); return dt.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' }) }
const formatDateFull = (ymd) => { if (!ymd) return '-'; const dt = new Date(`${ymd}T00:00:00`); return dt.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }
const titleCase = (s) => (s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
const airlineLogo = (code) => `https://api.fastravel.co.id/assets/maskapai/${code}.png`

/* ── Airport picker ───────────────────────────────────────────────────── */
function AirportPicker({ open, airports, title, onPick, onClose }) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  useEffect(() => { if (open) setQ('') }, [open])
  if (!open) return null
  const filtered = (airports || []).filter(a =>
    `${a.name} ${a.bandara} ${a.code}`.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 60)
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-md max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="shrink-0 px-4 pt-3 pb-3 border-b border-slate-100">
          <div className="sm:hidden mx-auto w-10 h-1 rounded-full bg-slate-300 mb-3" />
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-bold text-slate-900">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-600" /></button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={t('travel.searchCityAirport')}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && <p className="text-center text-sm text-slate-400 py-8">{t('travel.airportNotFound')}</p>}
          {filtered.map(a => (
            <button key={a.code} onClick={() => { onPick(a); onClose() }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 text-left border-b border-slate-50">
              <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center shrink-0"><Plane className="w-4 h-4 text-sky-600" /></div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-slate-900 truncate">{a.name} <span className="text-slate-400 font-mono text-xs">({a.code})</span></p>
                <p className="text-xs text-slate-500 truncate">{a.bandara} · {a.group}</p>
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
  const resultsRef = useRef(null)
  const dateRef = useRef(null)

  const { data: airports = [] } = useQuery({
    queryKey: ['flight-airports'], queryFn: () => travelApi.airports().then(r => r.data?.data || []), staleTime: 86400_000,
  })
  const { data: markup = 0 } = useQuery({
    queryKey: ['travel-markup'], queryFn: () => travelApi.settings().then(r => r.data?.data?.markupPerPax ?? 0), staleTime: 3600_000,
  })

  const openDatePicker = () => { const el = dateRef.current; if (!el) return; try { el.showPicker ? el.showPicker() : el.focus() } catch { el.focus() } }
  const swap = () => { setDeparture(arrival); setArrival(departure) }
  const canSearch = departure && arrival && departure.code !== arrival.code && date

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

  const doSearch = async () => {
    if (!canSearch) return
    setSearching(true); setError(null); setResults(null); setAirlineFilter('')
    try {
      const res = await travelApi.searchAllFlights({
        departure: departure.code, arrival: arrival.code,
        departureDate: date, adult, child, infant,
      })
      const data = res.data?.data || []
      setResults(data)
      // Kalau ADA penerbangan → tutup form & scroll ke hasil.
      // Kalau KOSONG → biarkan form tetap tampil supaya user bisa ubah tanggal/rute.
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
    sessionStorage.setItem('flight_selection', JSON.stringify({
      departure, arrival, date, airline: flight.airline, adult, child, infant, flight, cls, markup,
    }))
    navigate('/tiket/pesawat/pesan')
  }

  return (
    <div className="min-h-[70vh] bg-slate-50">
      <SEO title={t('travel.flightSeoTitle')} description={t('travel.flightSeoDesc')} url="/tiket/pesawat" />

      {showForm && (
      <section className="bg-gradient-to-br from-sky-500 to-blue-600 text-white">
        <div className="container py-5 sm:py-7">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center"><Plane className="w-5 h-5" /></div>
            <div>
              <h1 className="font-display text-lg sm:text-xl font-bold leading-tight">{t('travel.flightTitle')}</h1>
              <p className="text-[11px] sm:text-xs text-white/80">{t('travel.flightTagline')}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-3.5 sm:p-4 text-slate-900">
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

            <div className="grid grid-cols-2 gap-2.5 mt-2.5">
              <div className="relative p-3 rounded-xl border border-slate-200 cursor-pointer" onClick={openDatePicker}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Calendar className="w-3 h-3" /> {t('travel.date')}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{formatDateSlash(date)}</p>
                <input ref={dateRef} type="date" value={date} min={todayStr()} onChange={e => setDate(e.target.value)} className="absolute bottom-1 left-3 w-px h-px opacity-0 pointer-events-none" tabIndex={-1} />
              </div>
              <div className="p-3 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Users className="w-3 h-3" /> {t('travel.passengers')}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <select value={adult} onChange={e => setAdult(+e.target.value)} className="text-sm font-semibold bg-transparent focus:outline-none">{[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} {t('travel.adultShort')}</option>)}</select>
                  <select value={child} onChange={e => setChild(+e.target.value)} className="text-xs text-slate-500 bg-transparent focus:outline-none">{[0,1,2,3,4].map(n => <option key={n} value={n}>{n} {t('travel.childShort')}</option>)}</select>
                  <select value={infant} onChange={e => setInfant(+e.target.value)} className="text-xs text-slate-500 bg-transparent focus:outline-none">{[0,1,2,3,4].map(n => <option key={n} value={n}>{n} {t('travel.infantShort')}</option>)}</select>
                </div>
              </div>
            </div>

            <button onClick={doSearch} disabled={!canSearch || searching} className="w-full mt-3 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50">
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
            {/* Summary header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2 flex-wrap leading-tight">{titleCase(departure?.name)} <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" /> {titleCase(arrival?.name)}</p>
                <p className="text-xs text-slate-500 mt-1">{formatDateFull(date)} · {adult} {t('travel.adultLabel')}{child>0?`, ${child} ${t('travel.childLabel')}`:''}{infant>0?`, ${infant} ${t('travel.infantLabel')}`:''}</p>
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
              <button onClick={() => setAirlineFilter('')} className={`px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 ${!airlineFilter?'bg-sky-50 border-sky-500 text-sky-700':'bg-white border-slate-200 text-slate-500'}`}>Semua Maskapai</button>
              {airlinesInResults.map(a => (
                <button key={a.code} onClick={() => setAirlineFilter(a.code)} className={`px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 flex items-center gap-1.5 ${airlineFilter===a.code?'bg-sky-50 border-sky-500 text-sky-700':'bg-white border-slate-200 text-slate-500'}`}>
                  <AirlineLogo code={a.code} name={a.name} /> {a.name}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-400 mb-2">{view.length} penerbangan</p>

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
                          <span className="text-[9px] text-emerald-600 font-bold">{flight.isTransit ? 'Transit' : 'Langsung'}</span>
                        </div>
                        <div className="text-center"><p className="font-bold text-slate-900 text-sm sm:text-base">{cls.arrivalTime}</p><p className="text-[10px] text-slate-400 font-semibold">{cls.arrival}</p></div>
                      </div>
                      <div className="text-right shrink-0">
                        {price > 0
                          ? <p className="font-display text-sm sm:text-lg font-bold text-sky-600 leading-tight">{formatRupiah(price + markup)}<span className="text-[10px] font-normal text-slate-400">/pax</span></p>
                          : <p className="text-[11px] font-bold text-sky-600">Cek harga</p>}
                        <button onClick={() => selectFlight(flight)} className="mt-2 px-5 py-2 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-bold active:scale-95 transition-all">Pilih</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {results && results.length === 0 && !searching && (
          <div className="text-center py-12"><Plane className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="font-semibold text-slate-700">Tidak ada penerbangan</p><p className="text-sm text-slate-400 mt-1">Coba ubah tanggal atau rute.</p></div>
        )}
        {!results && !searching && (
          <div className="text-center py-12"><Plane className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-sm text-slate-400">Isi rute & tanggal, lalu cari penerbangan semua maskapai.</p></div>
        )}
      </section>

      <AirportPicker open={picker === 'departure'} airports={airports} title="Bandara Asal" onPick={setDeparture} onClose={() => setPicker(null)} />
      <AirportPicker open={picker === 'arrival'} airports={airports} title="Bandara Tujuan" onPick={setArrival} onClose={() => setPicker(null)} />
    </div>
  )
}
