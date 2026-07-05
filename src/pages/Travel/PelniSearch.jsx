import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Ship, ArrowLeftRight, Calendar, Users, Search, X,
  MapPin, ArrowRight, Loader2, AlertCircle, Anchor, ChevronLeft,
} from 'lucide-react'
import i18n from '@/i18n'
import { travelApi } from '@/services/index'
import { formatRupiah } from '@/utils'
import SEO from '@/components/SEO'
import LoaderArahInn from '@/components/LoaderArahInn'
import TravelPromoSection from '@/components/travel/TravelPromoSection'
import TravelErrorModal from '@/components/travel/TravelErrorModal'
import bannerPelni from '@/assets/banners/banner-pelni.webp'

const PELNI_LOADER_MESSAGES = [
  'Mencari kapal terbaik...',
  'Membandingkan jadwal & kelas...',
  'Memeriksa ketersediaan tiket...',
  'Menyiapkan perjalanan Anda...',
]

// Tanggal LOKAL (YYYY-MM-DD) — JANGAN toISOString() (itu UTC, mundur sehari di WIB).
const pad2 = (n) => String(n).padStart(2, '0')
const ymdLocal = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const todayStr = () => ymdLocal(new Date())
const dateLocale = () => (i18n.language === 'en' ? 'en-US' : 'id-ID')
const formatDateSlash = (ymd) => { if (!ymd) return '-'; const dt = new Date(`${ymd}T00:00:00`); return dt.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' }) }
const ymd8 = (s) => s && s.length === 8 ? `${s.slice(6,8)}/${s.slice(4,6)}/${s.slice(0,4)}` : s   // YYYYMMDD → DD/MM/YYYY
const hhmm = (s) => s && s.length === 4 ? `${s.slice(0,2)}:${s.slice(2,4)}` : s                   // 2100 → 21:00
const titleCase = (s) => (s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
const classLabel = (c, t) => ({ EK1: t('travel.classEK1'), EK2: t('travel.classEK2'), EKO: t('travel.classEKO'), K1: t('travel.classK1'), K2: t('travel.classK2') }[c] || c)

function PortPicker({ open, ports, title, onPick, onClose }) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  useEffect(() => { if (open) setQ('') }, [open])
  if (!open) return null
  const term = q.trim().toLowerCase()
  const filtered = (ports || []).filter(p => `${p.NAME} ${p.CODE}`.toLowerCase().includes(term)).slice(0, 80)
  return (
    // Full-screen di mobile (search pinned di atas → hasil tak ketutup keyboard); modal di desktop. Gaya halaman tiket pesawat.
    <div className="fixed inset-0 z-50 bg-white sm:bg-slate-900/60 sm:backdrop-blur-sm sm:flex sm:items-center sm:justify-center sm:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="flex flex-col h-full w-full bg-white overflow-hidden sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-3xl sm:shadow-2xl">
        {/* Search bar pinned di atas (anti ketutup keyboard) */}
        <div className="shrink-0 flex items-center gap-2 px-3 pb-3 border-b border-slate-100" style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)' }}>
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={title || t('travel.searchPort')}
              className="w-full pl-9 pr-9 py-2.5 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
            {q && (
              <button onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 px-2 py-1 text-sm font-semibold text-cyan-600">{t('common.cancel')}</button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {filtered.length === 0 && <p className="text-center text-sm text-slate-400 py-10">{t('travel.portNotFound')}</p>}
          {filtered.map(p => (
            <button key={p.CODE} onClick={() => { onPick(p); onClose() }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 text-left border-b border-slate-50">
              <div className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0"><Anchor className="w-4 h-4 text-cyan-600" /></div>
              <p className="font-semibold text-sm text-slate-900">{titleCase(p.NAME)} <span className="text-slate-400 font-mono text-xs">({p.CODE})</span></p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PelniSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [date, setDate] = useState(todayStr())
  const [adult, setAdult] = useState(1)
  const [infant, setInfant] = useState(0)
  const [picker, setPicker] = useState(null)
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const [checking, setChecking] = useState(null)   // `${shipNo}-${subclass}` yang sedang dicek ketersediaannya
  const [showForm, setShowForm] = useState(true)
  const resultsRef = useRef(null)
  const dateRef = useRef(null)

  const { data: origins = [] } = useQuery({ queryKey: ['pelni-origins'], queryFn: () => travelApi.pelniOrigins().then(r => r.data?.data || []), staleTime: 86400_000 })
  const { data: destinations = [] } = useQuery({ queryKey: ['pelni-destinations'], queryFn: () => travelApi.pelniDestinations().then(r => r.data?.data || []), staleTime: 86400_000 })
  const { data: svcFee = { amount: 0, percent: 0 } } = useQuery({ queryKey: ['travel-svcfee', 'pelni'], queryFn: () => travelApi.settings().then(r => r.data?.data?.serviceFees?.pelni ?? { amount: 0, percent: 0 }), staleTime: 3600_000 })
  const feePerPax = (p) => (Number(svcFee.percent) > 0 ? Math.round(Number(svcFee.percent) / 100 * (Number(p) || 0)) : (Number(svcFee.amount) || 0))

  const openDatePicker = () => { const el = dateRef.current; if (!el) return; try { el.showPicker ? el.showPicker() : el.focus() } catch { el.focus() } }
  const swap = () => { setOrigin(destination); setDestination(origin) }
  const canSearch = origin && destination && origin.CODE !== destination.CODE && date

  const doSearch = async () => {
    if (!canSearch) return
    setSearching(true); setError(null); setResults(null)
    try {
      const end = new Date(`${date}T00:00:00`); end.setDate(end.getDate() + 14)
      const res = await travelApi.searchPelni({
        origin: +origin.CODE, destination: +destination.CODE,
        startDate: date, endDate: ymdLocal(end),
      })
      setResults(res.data?.data || [])
      setShowForm(false)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e) { setError(friendlyPelniError(e?.response?.data?.message)) }
    finally { setSearching(false) }
  }

  // Error vendor → pesan ramah untuk penumpang kapal laut.
  function friendlyPelniError(raw) {
    const s = String(raw || '').toLowerCase()
    if (/no current schedule|schedule.*(not|un).*avail|no\s*schedule|tidak ada jadwal|not\s*found|kosong|\b33\b/.test(s)) {
      return { title: t('travel.errNoScheduleTitle'), msg: t('travel.errNoSchedulePelniMsg') }
    }
    return { title: t('travel.errSearchTitle'), msg: t('travel.shipSearchError') }
  }

  const selectClass = async (ship, fare) => {
    // Cek ketersediaan REAL-TIME ke vendor sebelum lanjut isi data — hindari gagal di langkah akhir
    // (mis. "Sudah tidak bisa booking dengan Subkelas X" saat subkelas/jadwal sudah ditutup vendor).
    setError(null)
    setChecking(`${ship.SHIP_NO}-${fare.SUBCLASS}`)
    try {
      const r = await travelApi.pelniCheckAvail({
        origin: +origin.CODE, originCall: ship.ORG_CALL,
        destination: +destination.CODE, destinationCall: ship.DES_CALL,
        departureDate: ship.DEP_DATE, shipNumber: ship.SHIP_NO,
        subClass: fare.SUBCLASS, male: adult, female: 0,
      })
      if (!r.data?.success) {
        setError({ title: t('travel.errSubclassTitle'), msg: t('travel.errSubclassMsg') })
        return
      }
    } catch (e) {
      setError({ title: t('travel.errSubclassTitle'), msg: t('travel.errSubclassMsg') })
      return
    } finally { setChecking(null) }

    sessionStorage.setItem('pelni_selection', JSON.stringify({
      origin: origin.CODE, destination: destination.CODE,
      originName: origin.NAME, destinationName: destination.NAME,
      shipNumber: ship.SHIP_NO, shipName: ship.SHIP_NAME,
      departureDate: ship.DEP_DATE, originCall: ship.ORG_CALL, destinationCall: ship.DES_CALL,
      depTime: ship.DEP_TIME, arrTime: ship.ARV_TIME, depDate: ship.DEP_DATE, arrDate: ship.ARV_DATE,
      subClass: fare.SUBCLASS, className: fare.CLASS,
      hargaDewasa: fare.FARE_DETAIL?.A?.TOTAL ?? 0,
      hargaAnak: fare.FARE_DETAIL?.C?.TOTAL ?? 0,
      hargaInfant: fare.FARE_DETAIL?.I?.TOTAL ?? 0,
      adult, infant, svcFee,
    }))
    navigate('/tiket/pelni/pesan')
  }

  // Sembunyikan subkelas yang PENUH; kapal yang semua subkelasnya penuh tidak ditampilkan.
  const seatsOf = (f) => (+f?.AVAILABILITY?.F || 0) + (+f?.AVAILABILITY?.M || 0)
  const bookableShips = (results || [])
    .map(s => ({ ...s, fares: (s.fares || []).filter(f => seatsOf(f) > 0) }))
    .filter(s => s.fares.length > 0)

  return (
    <div className="min-h-[70vh] bg-slate-50">
      {searching && <LoaderArahInn messages={PELNI_LOADER_MESSAGES} />}
      <SEO title={t('travel.pelniSeoTitle')} description={t('travel.pelniSeoDesc')} url="/tiket/pelni" />

      {showForm && (
      <section className="relative">
        {/* Header banner PELNI — gaya halaman tiket pesawat (gambar full-width + kartu pencarian mengambang) */}
        <img src={bannerPelni} alt="Cari Tiket Kapal Laut PELNI ArahInn" width="1774" height="887"
          className="block w-full h-auto" loading="eager" fetchpriority="high" />
        <div className="container relative z-10 mt-[calc(100px-24vw)] sm:mt-[calc(100px-21vw)] lg:mt-[calc(100px-18vw)] pb-6 sm:pb-8">
          <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl p-3.5 sm:p-4 text-slate-900">
            <div className="relative grid grid-cols-1 gap-2.5">
              <button onClick={() => setPicker('origin')} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-cyan-400 text-left"><MapPin className="w-4 h-4 text-slate-400 shrink-0" /><div className="min-w-0 flex-1"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t('travel.from')}</p><p className={`text-sm font-semibold truncate ${origin ? 'text-slate-900' : 'text-slate-400'}`}>{origin ? `${titleCase(origin.NAME)} (${origin.CODE})` : t('travel.pickOriginPort')}</p></div></button>
              <button onClick={() => setPicker('destination')} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-cyan-400 text-left"><MapPin className="w-4 h-4 text-slate-400 shrink-0" /><div className="min-w-0 flex-1"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t('travel.to')}</p><p className={`text-sm font-semibold truncate ${destination ? 'text-slate-900' : 'text-slate-400'}`}>{destination ? `${titleCase(destination.NAME)} (${destination.CODE})` : t('travel.pickDestPort')}</p></div></button>
              <button onClick={swap} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-cyan-500 text-white shadow-md flex items-center justify-center active:scale-90 z-10"><ArrowLeftRight className="w-4 h-4 rotate-90" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mt-2.5">
              <div className="relative p-3 rounded-xl border border-slate-200 cursor-pointer" onClick={openDatePicker}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Calendar className="w-3 h-3" /> {t('travel.depDateRange')}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{formatDateSlash(date)}</p>
                <input ref={dateRef} type="date" value={date} min={todayStr()} onChange={e => setDate(e.target.value)} className="absolute bottom-1 left-3 w-px h-px opacity-0 pointer-events-none" tabIndex={-1} />
              </div>
              <div className="p-3 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Users className="w-3 h-3" /> {t('travel.passengers')}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <select value={adult} onChange={e => setAdult(+e.target.value)} className="text-sm font-semibold bg-transparent focus:outline-none">{[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} {t('travel.adultShort')}</option>)}</select>
                  <select value={infant} onChange={e => setInfant(+e.target.value)} className="text-xs text-slate-500 bg-transparent focus:outline-none">{[0,1,2,3,4].map(n => <option key={n} value={n}>{n} {t('travel.infantShort')}</option>)}</select>
                </div>
              </div>
            </div>
            <button onClick={doSearch} disabled={!canSearch || searching} className="w-full mt-3 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50">{searching ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('travel.searchingShips')}</> : <><Search className="w-4 h-4" /> {t('travel.searchShip')}</>}</button>
          </div>
        </div>
      </section>
      )}

      <section ref={resultsRef} className="container py-5">
        <TravelErrorModal error={error} onClose={() => setError(null)} accent="cyan" />

        {bookableShips.length > 0 && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0"><p className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2 flex-wrap leading-tight">{titleCase(origin?.NAME)} <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" /> {titleCase(destination?.NAME)}</p><p className="text-xs text-slate-500 mt-1">{t('travel.schedulesCount', { count: bookableShips.length })} · {adult} {t('travel.adultLabel')}{infant>0?`, ${infant} ${t('travel.infantLabel')}`:''}</p></div>
              <button onClick={() => { setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="shrink-0 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">{t('travel.changeShort')}</button>
            </div>

            <div className="space-y-3">
              {bookableShips.map((ship, i) => (
                <div key={`${ship.SHIP_NO}-${i}`} className="bg-white border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center"><Ship className="w-4 h-4 text-cyan-600" /></div>
                    <div className="min-w-0"><p className="font-bold text-sm text-slate-900">{titleCase(ship.SHIP_NAME)}</p><p className="text-[10px] text-slate-400">{ymd8(ship.DEP_DATE)}</p></div>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-center"><p className="font-bold text-slate-900 text-sm">{hhmm(ship.DEP_TIME)}</p><p className="text-[10px] text-slate-400">{origin?.CODE}</p></div>
                    <div className="flex-1 flex items-center gap-1.5"><div className="h-px flex-1 bg-slate-200" /><Ship className="w-3 h-3 text-slate-300" /><div className="h-px flex-1 bg-slate-200" /></div>
                    <div className="text-center"><p className="font-bold text-slate-900 text-sm">{hhmm(ship.ARV_TIME)}</p><p className="text-[10px] text-slate-400">{destination?.CODE} · {ymd8(ship.ARV_DATE)?.slice(0,5)}</p></div>
                  </div>
                  {/* Kelas */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {(ship.fares || []).map((fare, j) => {
                      const avail = (+fare.AVAILABILITY?.F || 0) + (+fare.AVAILABILITY?.M || 0)
                      const harga = Number(fare.FARE_DETAIL?.A?.TOTAL) || 0
                      const soldOut = avail <= 0
                      return (
                        <div key={j} className="flex items-center justify-between gap-2">
                          <div><p className="text-sm font-semibold text-slate-900">{classLabel(fare.CLASS, t)} <span className="text-[10px] text-slate-400">({fare.SUBCLASS})</span></p><p className={`text-[10px] font-semibold ${soldOut ? 'text-red-500' : 'text-emerald-600'}`}>{soldOut ? t('travel.soldOut') : `${t('travel.seatsLeft', { n: avail })} (P${fare.AVAILABILITY?.M}/W${fare.AVAILABILITY?.F})`}</p></div>
                          <div className="text-right">
                            <p className="font-display text-sm font-bold text-cyan-600">{formatRupiah(harga + feePerPax(harga))}<span className="text-[9px] text-slate-400">{t('travel.perPax')}</span></p>
                            <button onClick={() => selectClass(ship, fare)} disabled={soldOut || checking === `${ship.SHIP_NO}-${fare.SUBCLASS}`} className="mt-1 px-4 py-1.5 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold disabled:opacity-40 disabled:bg-slate-300 inline-flex items-center gap-1">{checking === `${ship.SHIP_NO}-${fare.SUBCLASS}` ? <><Loader2 className="w-3 h-3 animate-spin" /> Cek...</> : t('travel.select')}</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {results && bookableShips.length === 0 && !searching && (
          <div className="text-center py-12">
            <Ship className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">{results.length > 0 ? 'Semua kursi penuh' : t('travel.noSchedule')}</p>
            <p className="text-sm text-slate-400 mt-1">{results.length > 0 ? 'Semua subkelas pada jadwal ini sudah penuh. Coba tanggal atau rute lain.' : t('travel.noScheduleDesc')}</p>
            <button onClick={() => { setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-bold active:scale-[0.98] transition-all">
              <ChevronLeft className="w-4 h-4" /> {t('travel.changeShort')}
            </button>
          </div>
        )}
      </section>

      {/* Section promo KHUSUS kapal laut / PELNI — selalu tampil di body (sebelum & sesudah cari) */}
      {!searching && (
        <section className="container pb-8">
          <TravelPromoSection product="pelni" />
        </section>
      )}

      <PortPicker open={picker === 'origin'} ports={origins} title={t('travel.originPort')} onPick={setOrigin} onClose={() => setPicker(null)} />
      <PortPicker open={picker === 'destination'} ports={destinations} title={t('travel.destPort')} onPick={setDestination} onClose={() => setPicker(null)} />
    </div>
  )
}
