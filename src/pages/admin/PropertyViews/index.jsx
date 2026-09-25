import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Eye, Users, UserX, Building2, Activity, Search, CalendarRange, RotateCcw,
  RefreshCw, Pause, Play, ChevronLeft, ChevronRight, MapPin, Clock, ExternalLink, Loader2, Inbox,
} from 'lucide-react'
import { propertyViewApi } from '@/services/index'
import { getImageUrl } from '@/utils'

const TZ = 'Asia/Jakarta'
const LIVE_INTERVAL = 5000

const fmtDate = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
const fmtTime = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
const fmtYmd  = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })

const ymd = (d) => fmtYmd.format(d)

/**
 * Pembungkus aman untuk Intl.DateTimeFormat.
 *
 * `format()` MELEMPAR RangeError bila tanggalnya tidak valid, bukan
 * mengembalikan teks kosong. Karena halaman ini dirender tanpa error boundary,
 * satu baris dengan tanggal rusak cukup untuk memutihkan seluruh panel admin —
 * dan itulah yang terjadi ketika kolom `viewed_at` dibaca dengan nama snake_case
 * sehingga bernilai undefined.
 */
const amanFormat = (fmt, nilai) => {
  const d = new Date(nilai)
  return Number.isNaN(d.getTime()) ? '—' : fmt.format(d)
}
const daysAgo = (n) => ymd(new Date(Date.now() - n * 86400000))

function relative(iso, now) {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const s = Math.max(0, Math.floor((now - t) / 1000))
  if (s < 10) return 'baru saja'
  if (s < 60) return `${s} dtk lalu`
  if (s < 3600) return `${Math.floor(s / 60)} mnt lalu`
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`
  return `${Math.floor(s / 86400)} hari lalu`
}

function useDebounced(value, ms = 400) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}

const PRESETS = [
  { key: 'today', label: 'Hari ini', range: () => [daysAgo(0), daysAgo(0)] },
  { key: '7d',    label: '7 hari',   range: () => [daysAgo(6), daysAgo(0)] },
  { key: '30d',   label: '30 hari',  range: () => [daysAgo(29), daysAgo(0)] },
]

const VISITORS = [
  { key: 'all',    label: 'Semua' },
  { key: 'member', label: 'Member' },
  { key: 'guest',  label: 'Tamu' },
]

export default function AdminPropertyViews() {
  const [propertyId, setPropertyId] = useState('')
  const [userTerm, setUserTerm]     = useState('')
  const [visitor, setVisitor]       = useState('all')
  const [dateFrom, setDateFrom]     = useState('')
  const [dateTo, setDateTo]         = useState('')
  const [page, setPage]             = useState(1)
  const [live, setLive]             = useState(true)
  const [now, setNow]               = useState(Date.now())

  const user = useDebounced(userTerm.trim())

  // Setiap filter berubah → kembali ke halaman 1
  useEffect(() => { setPage(1) }, [propertyId, user, visitor, dateFrom, dateTo])

  // Detak 1 detik untuk label "x dtk lalu"
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  const params = {
    page, limit: 25, visitor,
    ...(propertyId && { property_id: propertyId }),
    ...(user && { user }),
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
  }

  const { data: propertyOptions = [] } = useQuery({
    queryKey: ['admin-property-views-options'],
    queryFn : () => propertyViewApi.properties().then(r => r.data?.data ?? []),
    staleTime: 5 * 60_000,
  })

  // Live hanya di halaman 1 — di halaman lain baris akan bergeser terus saat data baru masuk.
  const isLive = live && page === 1
  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['admin-property-views', params],
    queryFn : () => propertyViewApi.list(params).then(r => r.data),
    placeholderData: (prev) => prev,
    refetchInterval: isLive ? LIVE_INTERVAL : false,
    refetchIntervalInBackground: false,
  })

  const rows       = data?.data ?? []
  const stats      = data?.stats ?? {}
  const pagination = data?.pagination ?? { page: 1, total_pages: 1, total: 0 }

  // Sorot baris yang baru masuk sejak refetch sebelumnya
  const seenRef = useRef(null)
  const [freshIds, setFreshIds] = useState(() => new Set())
  const filterKey = JSON.stringify({ ...params, page: undefined })
  useEffect(() => { seenRef.current = null }, [filterKey])
  useEffect(() => {
    if (!data) return
    const ids = rows.map(r => r.id)
    if (seenRef.current && page === 1) {
      const fresh = ids.filter(id => !seenRef.current.has(id))
      if (fresh.length) {
        setFreshIds(new Set(fresh))
        const t = setTimeout(() => setFreshIds(new Set()), 4000)
        seenRef.current = new Set(ids)
        return () => clearTimeout(t)
      }
    }
    seenRef.current = new Set(ids)
  }, [dataUpdatedAt]) // eslint-disable-line react-hooks/exhaustive-deps

  const activePreset = useMemo(
    () => PRESETS.find(p => { const [f, t] = p.range(); return f === dateFrom && t === dateTo })?.key,
    [dateFrom, dateTo],
  )
  const hasFilter = propertyId || userTerm || visitor !== 'all' || dateFrom || dateTo
  const resetFilters = () => { setPropertyId(''); setUserTerm(''); setVisitor('all'); setDateFrom(''); setDateTo('') }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6 sm:p-7 text-white shadow-xl shadow-slate-900/10">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-24 -bottom-20 w-56 h-56 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">Aktivitas View Properti</h1>
              <p className="text-sm text-slate-300 mt-0.5">Siapa yang melihat listing jual-beli, dan kapan — diperbarui otomatis.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold ring-1 ${isLive ? 'bg-emerald-400/10 ring-emerald-300/30 text-emerald-200' : 'bg-white/5 ring-white/15 text-slate-300'}`}>
              <span className="relative flex w-2 h-2">
                {isLive && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />}
                <span className={`relative inline-flex w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
              </span>
              {isLive ? 'LIVE' : page !== 1 && live ? 'Live di halaman 1' : 'Dijeda'}
              {dataUpdatedAt > 0 && <span className="font-normal opacity-70">· {relative(dataUpdatedAt, now)}</span>}
            </div>
            <button onClick={() => setLive(v => !v)} title={live ? 'Jeda pembaruan otomatis' : 'Lanjutkan pembaruan otomatis'}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 ring-1 ring-white/15 flex items-center justify-center transition-colors">
              {live ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button onClick={() => refetch()} title="Muat ulang"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 ring-1 ring-white/15 flex items-center justify-center transition-colors">
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
          <Stat icon={Eye}       label="Total view"        value={stats.total} />
          <Stat icon={Users}     label="Member unik"       value={stats.members} />
          <Stat icon={UserX}     label="Tamu unik (IP)"    value={stats.guests} />
          <Stat icon={Building2} label="Properti dilihat"  value={stats.properties} />
          <Stat icon={Activity}  label="1 jam terakhir"    value={stats.lastHour} accent />
        </div>
      </div>

      {/* ── Filter ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3.5">
          <Field label="Properti" className="xl:col-span-4">
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className={`${inputCls} pl-9 appearance-none pr-8`}>
                <option value="">Semua properti</option>
                {propertyOptions.map(p => (
                  <option key={p.id} value={p.id}>{p.title}{p.city ? ` — ${p.city}` : ''}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </Field>

          <Field label="User" className="xl:col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input value={userTerm} onChange={e => setUserTerm(e.target.value)} placeholder="Nama, email, atau no. HP"
                className={`${inputCls} pl-9`} />
            </div>
          </Field>

          <Field label="Rentang tanggal" className="md:col-span-2 xl:col-span-5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type="date" value={dateFrom} max={dateTo || undefined} onChange={e => setDateFrom(e.target.value)} className={`${inputCls} pl-9`} />
              </div>
              <span className="text-slate-300 text-sm">—</span>
              <div className="flex-1 min-w-0">
                <input type="date" value={dateTo} min={dateFrom || undefined} onChange={e => setDateTo(e.target.value)} className={inputCls} />
              </div>
            </div>
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              {VISITORS.map(v => (
                <button key={v.key} onClick={() => setVisitor(v.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${visitor === v.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                  {v.label}
                </button>
              ))}
            </div>
            <span className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />
            {PRESETS.map(p => (
              <button key={p.key} onClick={() => { const [f, t] = p.range(); setDateFrom(f); setDateTo(t) }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${activePreset === p.key ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={resetFilters} disabled={!hasFilter}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Reset filter
          </button>
        </div>
      </div>

      {/* ── List ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">
            Riwayat view
            <span className="ml-2 text-xs font-medium text-slate-400">{(pagination.total ?? 0).toLocaleString('id-ID')} catatan</span>
          </p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Waktu dalam WIB</p>
        </div>

        {isLoading ? (
          <div className="py-24 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>
        ) : rows.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3"><Inbox className="w-6 h-6 text-slate-400" /></div>
            <p className="font-semibold text-slate-700">Belum ada data view</p>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              {hasFilter ? 'Tidak ada kunjungan yang cocok dengan filter ini.' : 'Kunjungan ke halaman detail properti akan muncul di sini secara otomatis.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full text-sm hidden md:table">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50/70">
                  <th className="px-5 py-3 font-semibold">Properti</th>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Tanggal</th>
                  <th className="px-5 py-3 font-semibold">Jam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(r => (
                  <tr key={r.id} className={`transition-colors duration-1000 ${freshIds.has(r.id) ? 'bg-emerald-50' : 'hover:bg-slate-50/70'}`}>
                    <td className="px-5 py-3.5"><PropertyCell p={r.property} /></td>
                    <td className="px-5 py-3.5"><UserCell u={r.user} ip={r.ipAddress} /></td>
                    <td className="px-5 py-3.5 text-slate-700 whitespace-nowrap">{amanFormat(fmtDate, r.viewedAt)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] font-semibold text-slate-900 tabular-nums">{amanFormat(fmtTime, r.viewedAt)}</span>
                        {freshIds.has(r.id) && <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-bold tracking-wide">BARU</span>}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{relative(r.viewedAt, now)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <ul className="md:hidden divide-y divide-slate-100">
              {rows.map(r => (
                <li key={r.id} className={`p-4 space-y-3 transition-colors duration-1000 ${freshIds.has(r.id) ? 'bg-emerald-50' : ''}`}>
                  <PropertyCell p={r.property} />
                  <div className="flex items-end justify-between gap-3">
                    <UserCell u={r.user} ip={r.ipAddress} />
                    <div className="text-right shrink-0">
                      <p className="font-mono text-xs font-semibold text-slate-900 tabular-nums">{amanFormat(fmtTime, r.viewedAt)}</p>
                      <p className="text-[11px] text-slate-400">{amanFormat(fmtDate, r.viewedAt)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-500">Halaman <b className="text-slate-800">{pagination.page}</b> dari {pagination.totalPages}</p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const inputCls = 'w-full h-10 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition'

function Field({ label, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className={`rounded-2xl px-4 py-3.5 ring-1 backdrop-blur ${accent ? 'bg-emerald-400/10 ring-emerald-300/20' : 'bg-white/[0.06] ring-white/10'}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
        <Icon className={`w-3.5 h-3.5 ${accent ? 'text-emerald-300' : ''}`} /> {label}
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">{value == null ? '—' : Number(value).toLocaleString('id-ID')}</p>
    </div>
  )
}

function PropertyCell({ p }) {
  if (!p) return <span className="text-slate-400 italic">Properti dihapus</span>
  const img = getImageUrl(p.images?.[0])
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 ring-1 ring-slate-200/70">
        {img ? <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
             : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-5 h-5 text-slate-300" /></div>}
      </div>
      <div className="min-w-0">
        <a href={`/properti/${p.slug || p.id}`} target="_blank" rel="noreferrer"
          className="group inline-flex items-center gap-1 font-semibold text-slate-900 hover:text-blue-700 max-w-[280px]">
          <span className="truncate">{p.title}</span>
          <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
          {p.city && <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" />{p.city}</span>}
          {p.category && <span className="px-1.5 py-px rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">{p.category}</span>}
          {p.listingType && (
            <span className={`px-1.5 py-px rounded-md text-[10px] font-semibold ${p.listingType === 'rent' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
              {p.listingType === 'rent' ? 'Sewa' : 'Jual'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

const AVATAR_TONES = ['from-blue-500 to-indigo-600', 'from-rose-500 to-pink-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600', 'from-violet-500 to-purple-600']

function UserCell({ u, ip }) {
  if (!u) {
    return (
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center shrink-0"><UserX className="w-4 h-4 text-slate-400" /></div>
        <div className="min-w-0">
          <p className="font-medium text-slate-500">Tamu</p>
          <p className="text-xs text-slate-400 font-mono truncate">{ip || '—'}</p>
        </div>
      </div>
    )
  }
  const avatar = getImageUrl(u.avatar)
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_TONES[u.id % AVATAR_TONES.length]} text-white text-sm font-bold flex items-center justify-center shrink-0 overflow-hidden`}>
        {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : u.name?.[0]?.toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-slate-900 truncate max-w-[220px]">{u.name}</p>
        <p className="text-xs text-slate-500 truncate max-w-[220px]">{u.email || u.phone}</p>
      </div>
    </div>
  )
}
