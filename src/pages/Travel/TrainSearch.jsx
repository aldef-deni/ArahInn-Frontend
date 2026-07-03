import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  TrainFront, ArrowLeftRight, Calendar, Users, Search, X,
  MapPin, Clock, ArrowRight, Loader2, ChevronRight, AlertCircle,
} from 'lucide-react'
import i18n from '@/i18n'
import { travelApi } from '@/services/index'
import { formatRupiah } from '@/utils'
import SEO from '@/components/SEO'
import TravelPromoSection from '@/components/travel/TravelPromoSection'
import bannerKai from '@/assets/banners/banner-kai.webp'

// Tanggal LOKAL (YYYY-MM-DD) — JANGAN toISOString() (itu UTC, mundur sehari di WIB).
const pad2 = (n) => String(n).padStart(2, '0')
const ymdLocal = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const todayStr = () => ymdLocal(new Date())
const gradeLabel = (g, t) => ({ E: t('travel.gradeE'), B: t('travel.gradeB'), K: t('travel.gradeK') }[g] || g || '-')
const dateLocale = () => (i18n.language === 'en' ? 'en-US' : 'id-ID')
const formatDateSlash = (ymd) => { if (!ymd) return '-'; const dt = new Date(`${ymd}T00:00:00`); return dt.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' }) }
const formatDateFull = (ymd) => { if (!ymd) return '-'; const dt = new Date(`${ymd}T00:00:00`); return dt.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }
const titleCase = (s) => (s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())

function PassengerCounter({ label, value, min = 0, max = 9, onChange }) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))

  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3">
      <p className="text-[10px] font-semibold text-slate-400 mb-2">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-700 text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          -
        </button>
        <span className="min-w-[56px] text-center text-base font-bold text-slate-900 tabular-nums">{value}</span>
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-orange-200 bg-white text-orange-600 text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  )
}

/* ── Station picker modal ─────────────────────────────────────────────── */
function StationPicker({ open, stations, title, onPick, onClose }) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  useEffect(() => {
    if (open) {
      setQ('')
      const id = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(id)
    }
  }, [open])
  if (!open) return null

  const term = q.trim().toLowerCase()
  const filtered = (stations || []).filter(s => {
    const haystack = `${s.namaStasiun} ${s.namaKota} ${s.idStasiun}`.toLowerCase()
    return haystack.includes(term)
  }).slice(0, 80)

  return (
    <div className="fixed inset-0 z-50 bg-white sm:bg-slate-900/60 sm:backdrop-blur-sm sm:flex sm:items-center sm:justify-center sm:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="flex flex-col h-full w-full bg-white overflow-hidden sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-3xl sm:shadow-2xl">
        <div
          className="shrink-0 flex items-center gap-2 px-3 pb-3 border-b border-slate-100"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)' }}
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={title || t('travel.searchStation')}
              className="w-full pl-9 pr-9 py-2.5 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            {q && (
              <button
                onClick={() => { setQ(''); inputRef.current?.focus() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 px-2 py-1 text-sm font-semibold text-orange-600">{t('common.cancel')}</button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain bg-white">
          {filtered.length === 0 && <p className="text-center text-sm text-slate-400 py-8">{t('travel.stationNotFound')}</p>}
          {filtered.map(s => (
            <button
              key={s.idStasiun}
              onClick={() => { onPick(s); onClose() }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 text-left border-b border-slate-50"
            >
              <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-slate-900 truncate">{s.namaStasiun} <span className="text-slate-400 font-mono text-xs">({s.idStasiun})</span></p>
                <p className="text-xs text-slate-500 truncate">{s.namaKota}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Elegant train result card ───────────────────────────────────────── */
function TrainCard({ train, seat, origin, destination, feePerPax, onSelect, t }) {
  const soldOut = (seat.availability ?? 0) <= 0
  const lowSeats = !soldOut && (seat.availability ?? 0) <= 50
  const total = (Number(seat.priceAdult) || 0) + feePerPax(Number(seat.priceAdult) || 0)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 transition-all hover:shadow-lg hover:border-orange-200">
      {/* Header: nama kereta + kelas */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
        <p className="font-bold text-slate-900 text-sm sm:text-base truncate min-w-0">{train.trainName}</p>
        <span className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] font-semibold whitespace-nowrap">
          {gradeLabel(seat.grade, t)} · {seat.class}
        </span>
      </div>

      {/* Jam berangkat — durasi — jam tiba */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="text-left shrink-0">
          <p className="font-display font-bold text-slate-900 text-lg sm:text-xl leading-none tabular-nums">{train.departureTime}</p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold mt-1 truncate max-w-[72px]">{origin?.idStasiun}</p>
        </div>

        <div className="flex-1 flex flex-col items-center min-w-0 px-1">
          <span className="text-[10px] text-slate-400 mb-1 whitespace-nowrap">{train.duration}</span>
          <div className="w-full flex items-center gap-1.5">
            <div className="h-px flex-1 bg-slate-200" />
            <TrainFront className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <span className="text-[9px] text-emerald-600 font-bold mt-1 whitespace-nowrap">{t('travel.direct')}</span>
        </div>

        <div className="text-right shrink-0">
          <p className="font-display font-bold text-slate-900 text-lg sm:text-xl leading-none tabular-nums">{train.arrivalTime}</p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold mt-1 truncate max-w-[72px] ml-auto">{destination?.idStasiun}</p>
        </div>
      </div>

      {/* Harga + tombol pilih */}
      <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-100">
        <div className="min-w-0">
          <p className="font-display text-base sm:text-lg font-bold text-orange-600 leading-tight truncate">
            {formatRupiah(total)}
            <span className="text-[10px] font-normal text-slate-400 ml-1">{t('travel.perPax')}</span>
          </p>
          {lowSeats && (
            <p className="text-[10px] text-red-500 font-semibold mt-0.5">{t('travel.seatsLeftKursi', { n: seat.availability })}</p>
          )}
        </div>
        <button
          onClick={onSelect}
          disabled={soldOut}
          className="shrink-0 px-5 sm:px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold active:scale-95 transition-all disabled:opacity-40 disabled:bg-slate-300"
        >
          {soldOut ? t('travel.soldOutShort') : t('travel.select')}
        </button>
      </div>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────────────────── */
export default function TrainSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [origin, setOrigin]           = useState(null)  // station object
  const [destination, setDestination] = useState(null)
  const [date, setDate]   = useState(todayStr())
  const [adult, setAdult] = useState(1)
  const [child, setChild] = useState(0)
  const [infant, setInfant] = useState(0)
  const [picker, setPicker] = useState(null)            // 'origin' | 'destination' | null

  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(true)
  const [sortBy, setSortBy] = useState('price')   // 'price' | 'departure'
  const resultsRef = useRef(null)
  const dateRef = useRef(null)
  const payingPax = adult + child

  const openDatePicker = () => {
    const el = dateRef.current
    if (!el) return
    try { el.showPicker ? el.showPicker() : el.focus() } catch { el.focus() }
  }

  useEffect(() => {
    if (infant > payingPax) setInfant(payingPax)
  }, [payingPax, infant])

  const priceOf = (t) => Number((t.seats?.[0] || {}).priceAdult) || 0
  const sortedResults = useMemo(() => {
    if (!results) return results
    const arr = [...results]
    if (sortBy === 'price') arr.sort((a, b) => priceOf(a) - priceOf(b))
    else arr.sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''))
    return arr
  }, [results, sortBy])

  // Daftar stasiun
  const { data: stations = [] } = useQuery({
    queryKey: ['train-stations'],
    queryFn : () => travelApi.stations().then(r => r.data?.data || []),
    staleTime: 86400_000,
  })
  // Biaya penanganan tiket kereta (persen ATAU nominal per pax)
  const { data: svcFee = { amount: 0, percent: 0 } } = useQuery({
    queryKey: ['travel-svcfee', 'kereta'],
    queryFn : () => travelApi.settings().then(r => r.data?.data?.serviceFees?.kereta ?? { amount: 0, percent: 0 }),
    staleTime: 3600_000,
  })
  const feePerPax = (p) => (Number(svcFee.percent) > 0 ? Math.round(Number(svcFee.percent) / 100 * (Number(p) || 0)) : (Number(svcFee.amount) || 0))

  const swap = () => { setOrigin(destination); setDestination(origin) }

  const canSearch = origin && destination && origin.idStasiun !== destination.idStasiun && date && adult >= 1 && payingPax >= 1

  const doSearch = async () => {
    if (!canSearch) return
    setSearching(true); setError(null); setResults(null)
    try {
      const res = await travelApi.searchTrain({
        origin: origin.idStasiun,
        destination: destination.idStasiun,
        date,
        adult: payingPax,
        child,
        infant,
      })
      const data = res.data?.data || []
      setResults(data)
      setShowForm(false)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e) {
      setError(e?.response?.data?.message || t('travel.scheduleSearchError'))
    } finally {
      setSearching(false)
    }
  }

  const selectTrain = (train, seat) => {
    // Simpan pilihan untuk langkah booking (penumpang) — dibangun di langkah berikut
    const payload = {
      origin, destination, date, adult, child, infant, train, seat, svcFee,
    }
    sessionStorage.setItem('train_selection', JSON.stringify(payload))
    navigate('/tiket/kereta/pesan')
  }

  return (
    <div className="min-h-[70vh] bg-slate-50">
      <SEO title={t('travel.trainSeoTitle')} description={t('travel.trainSeoDesc')} url="/tiket/kereta" />

      {/* Hero + form */}
      {showForm && (
      <section className="relative">
        {/* Banner KAI — full-width, kartu pencarian mengambang (gaya pesawat/pelni) */}
        <img src={bannerKai} alt="Cari Tiket Kereta Api KAI ArahInn" width="1774" height="887"
          className="block w-full h-auto" loading="eager" fetchpriority="high" />
        <div className="container relative z-10 mt-[calc(80px-15vw)] sm:mt-[calc(100px-14vw)] lg:mt-[calc(120px-13vw)] pb-6 sm:pb-8">
          {/* Search card */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl p-3.5 sm:p-4 text-slate-900">
            {/* Origin / Destination */}
            <div className="relative grid grid-cols-1 gap-2.5">
              <button onClick={() => setPicker('origin')} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-orange-400 text-left transition-colors">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t('travel.from')}</p>
                  <p className={`text-sm font-semibold truncate ${origin ? 'text-slate-900' : 'text-slate-400'}`}>
                    {origin ? `${origin.namaStasiun} (${origin.idStasiun})` : t('travel.pickOriginStation')}
                  </p>
                </div>
              </button>

              <button onClick={() => setPicker('destination')} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-orange-400 text-left transition-colors">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t('travel.to')}</p>
                  <p className={`text-sm font-semibold truncate ${destination ? 'text-slate-900' : 'text-slate-400'}`}>
                    {destination ? `${destination.namaStasiun} (${destination.idStasiun})` : t('travel.pickDestStation')}
                  </p>
                </div>
              </button>

              {/* Swap button */}
              <button onClick={swap} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-orange-500 text-white shadow-md flex items-center justify-center active:scale-90 transition-transform z-10">
                <ArrowLeftRight className="w-4 h-4 rotate-90" />
              </button>
            </div>

            {/* Date + passengers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
              <div className="relative p-3 rounded-xl border border-slate-200 cursor-pointer" onClick={openDatePicker}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Calendar className="w-3 h-3" /> {t('travel.date')}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{formatDateSlash(date)}</p>
                <input ref={dateRef} type="date" value={date} min={todayStr()} onChange={e => setDate(e.target.value)}
                  className="absolute bottom-1 left-3 w-px h-px opacity-0 pointer-events-none" tabIndex={-1} aria-label={t('travel.date')} />
              </div>
              <div className="p-3 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Users className="w-3 h-3" /> {t('travel.passengers')}</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <PassengerCounter
                    label={t('travel.adultLabel')}
                    value={adult}
                    min={1}
                    max={7}
                    onChange={setAdult}
                  />
                  <PassengerCounter
                    label={t('travel.infantLabel')}
                    value={infant}
                    min={0}
                    max={Math.min(4, payingPax)}
                    onChange={setInfant}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={doSearch}
              disabled={!canSearch || searching}
              className="w-full mt-3 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {searching ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('travel.searchingSchedule')}</> : <><Search className="w-4 h-4" /> {t('travel.searchTicket')}</>}
            </button>
          </div>
        </div>
      </section>
      )}

      {/* Section promo KHUSUS kereta api (KAI) — selalu tampil di body */}
      {!searching && (
        <section className="container pb-2">
          <TravelPromoSection product="kereta" />
        </section>
      )}

      {/* Results */}
      <section ref={resultsRef} className="container py-5">
        {error && (
          <div className="flex items-start gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {results && results.length === 0 && !searching && (
          <div className="text-center py-12">
            <TrainFront className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">{t('travel.noScheduleShort')}</p>
            <p className="text-sm text-slate-400 mt-1">{t('travel.noScheduleShortDesc')}</p>
          </div>
        )}

        {results && results.length > 0 && (
          <>
            {/* Summary header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2 flex-wrap leading-tight">
                  {titleCase(origin?.namaStasiun)} <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" /> {titleCase(destination?.namaStasiun)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDateFull(date)} · {adult} {t('travel.adultLabel')}{infant > 0 ? `, ${infant} ${t('travel.infantLabel')}` : ''}
                </p>
              </div>
              <button
                onClick={() => { setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className="shrink-0 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold active:scale-95 transition-all"
              >
                {t('travel.changeSearch')}
              </button>
            </div>

            {/* Sort bar */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs font-bold text-slate-500">{t('travel.sortLabel')}</span>
              {[
                { id: 'price', label: t('travel.sortCheapestPrice') },
                { id: 'departure', label: t('travel.sortEarliest') },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    sortBy === opt.id
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <span className="ml-auto text-xs text-slate-400 whitespace-nowrap">{t('travel.trainsCount', { count: results.length })}</span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {sortedResults.map((train, i) => {
                const seat = (train.seats || [])[0] || {}
                return (
                  <TrainCard
                    key={`${train.trainNumber}-${i}`}
                    train={train}
                    seat={seat}
                    origin={origin}
                    destination={destination}
                    feePerPax={feePerPax}
                    onSelect={() => selectTrain(train, seat)}
                    t={t}
                  />
                )
              })}
            </div>
          </>
        )}

        {!results && !searching && (
          <div className="text-center py-12">
            <TrainFront className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">{t('travel.trainEmptyPrompt')}</p>
          </div>
        )}
      </section>

      <StationPicker open={picker === 'origin'} stations={stations} title={t('travel.originStation')} onPick={setOrigin} onClose={() => setPicker(null)} />
      <StationPicker open={picker === 'destination'} stations={stations} title={t('travel.destStation')} onPick={setDestination} onClose={() => setPicker(null)} />
    </div>
  )
}