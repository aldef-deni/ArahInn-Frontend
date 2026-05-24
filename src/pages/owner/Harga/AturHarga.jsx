import { useState, useMemo, useEffect, Fragment } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import {
  ChevronLeft, ChevronRight, BedDouble, X, Save, Calendar as CalendarIcon,
  List as ListIcon, Download, Clock, Info, ChevronDown, RefreshCw,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn, formatRupiah } from '@/utils'
import PriceInput from '@/components/ui/PriceInput'

const DAYS_LONG  = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni',
                'Juli','Agustus','September','Oktober','November','Desember']

/* ─────────────────── Utility ─────────────────── */
function getCalendarDays(year, month) {
  const firstDay    = new Date(year, month, 1)
  const lastDay     = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const days = []
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), isCurrentMonth: false })
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true })
  }
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false })
  }
  return days
}

function fmtKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fmtIdShort(date) {
  return date.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })
}

function compact(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'jt'
  if (n >= 1000)    return Math.round(n / 1000) + 'rb'
  return String(n)
}

function addDays(d, n) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

/* ─────────────────── Activity Log Drawer ─────────────────── */
function LogDrawer({ open, onClose, hotelId }) {
  // Minimal: tampilkan placeholder — bisa diisi dari endpoint activity_logs nanti
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl overflow-y-auto">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" /> Log Perubahan Harga
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 mb-1">Log aktivitas akan tampil di sini</p>
            <p className="text-xs text-slate-500">
              Perubahan harga dan jumlah kamar tersedia yang Anda lakukan akan tercatat otomatis.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  TAB 1 — Regular Allotment (Kalender + List)                              */
/* ═════════════════════════════════════════════════════════════════════════ */
function RegularAllotment({ hotel, rooms }) {
  const { toast } = useToast()
  const qc        = useQueryClient()
  const today     = new Date()

  const [view, setView]                 = useState('calendar') // 'calendar' | 'list'
  const [year, setYear]                 = useState(today.getFullYear())
  const [month, setMonth]               = useState(today.getMonth())
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [editing, setEditing]           = useState(null)

  // Auto-select kamar pertama
  useEffect(() => {
    if (!selectedRoom && rooms?.length) setSelectedRoom(rooms[0])
  }, [rooms]) // eslint-disable-line

  const { data: priceData, isFetching: priceFetching, dataUpdatedAt } = useQuery({
    queryKey: ['room-prices', selectedRoom?.id, year, month + 1],
    queryFn: () =>
      hotelApi.getRoomPrices(hotel.id, selectedRoom.id, { year, month: month + 1 })
        .then(r => ({
          // Axios interceptor sudah camelize keys di response
          prices:     r.data?.data || {},
          basePrice:  r.data?.basePrice ?? r.data?.base_price ?? 0,
          totalUnits: r.data?.totalUnits ?? r.data?.total_units ?? 1,
        })),
    enabled: !!hotel?.id && !!selectedRoom?.id,
    // Auto-refresh: cek booking baru tiap 30 detik supaya owner langsung lihat
    // perubahan allotment (mis. customer baru booking) tanpa refresh manual.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,  // langsung refresh saat balik ke tab
    refetchOnReconnect: true,    // refresh saat koneksi internet balik
    staleTime: 10_000,           // anggap data fresh 10 detik supaya tidak over-fetch saat editing
  })

  const upsertMutation = useMutation({
    mutationFn: (prices) => hotelApi.upsertRoomPrices(hotel.id, selectedRoom.id, { prices }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['room-prices', selectedRoom?.id] })
      qc.invalidateQueries({ queryKey: ['room-prices-range'] })
      setEditing(null)
      toast({ title: 'Harga & ketersediaan berhasil disimpan.' })
    },
    onError: () => toast({ title: 'Gagal menyimpan.', variant: 'destructive' }),
  })

  const days = useMemo(() => getCalendarDays(year, month), [year, month])
  const monthDays = useMemo(() => days.filter(d => d.isCurrentMonth), [days])

  const prevMonth = () => { month === 0 ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1) }
  const nextMonth = () => { month === 11 ? (setYear(y => y + 1), setMonth(0)) : setMonth(m => m + 1) }
  const goToday   = () => { setYear(today.getFullYear()); setMonth(today.getMonth()) }

  const getCell = (date) => {
    const key   = fmtKey(date)
    const saved = priceData?.prices?.[key]
    const totalUnits = priceData?.totalUnits ?? selectedRoom?.totalUnits ?? 1

    // Response sudah di-camelize oleh axios interceptor:
    //   available_units → availableUnits
    //   is_available    → isAvailable
    // Tetap fallback ke snake_case untuk safety.
    const rawUnits = saved?.availableUnits ?? saved?.available_units
    const rawAvail = saved?.isAvailable    ?? saved?.is_available

    const allotment = (rawUnits !== undefined && rawUnits !== null)
      ? Number(rawUnits)
      : totalUnits

    // BE pisah: booked (sudah bayar/issued) vs pending (menunggu pembayaran)
    const remaining = saved?.remainingUnits ?? saved?.remaining_units
    const booked    = (saved?.bookedCount   ?? saved?.booked_count)   ?? 0
    const pending   = (saved?.pendingCount  ?? saved?.pending_count)  ?? 0

    // Status tutup: kalau allotment 0 ATAU is_available eksplisit false
    const available = allotment > 0 && rawAvail !== false

    return {
      price: saved?.price ?? priceData?.basePrice ?? selectedRoom?.basePrice ?? 0,
      allotment,
      remaining: (remaining !== undefined && remaining !== null) ? Number(remaining) : allotment,
      booked: Number(booked),
      pending: Number(pending),
      available,
    }
  }

  const isPast = (date) =>
    date < new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const openEdit = (day) => {
    if (!day.isCurrentMonth || isPast(day.date)) return
    if (!selectedRoom) {
      toast({ title: 'Pilih tipe kamar terlebih dahulu.', variant: 'destructive' })
      return
    }
    const cell = getCell(day.date)
    setEditing({
      date: day.date,
      price: cell.price,
      remaining: cell.remaining,
      allotment: cell.allotment,
      booked: cell.booked,   // sudah bayar (paid/issued)
      pending: cell.pending, // menunggu pembayaran
    })
  }

  const saveEdit = () => {
    if (!editing) return
    const remaining = Math.max(0, Number(editing.remaining) || 0)
    const booked    = Number(editing.booked) || 0
    // Total = sudah bayar + sisa yang masih bisa dipesan.
    // Pending TIDAK dihitung — kalau customer akhirnya bayar, jadi booked.
    // Kalau VA expired, pending hilang. Allotment owner stabil.
    const units     = booked + remaining

    upsertMutation.mutate([{
      date:            fmtKey(editing.date),
      price:           Number(editing.price) || 0,
      available_units: units,
      // is_available diturunkan BE dari available_units, tapi kirim juga supaya konsisten
      is_available:    units > 0,
    }])
  }

  const exportExcel = () => {
    if (!selectedRoom) {
      toast({ title: 'Pilih tipe kamar terlebih dahulu.', variant: 'destructive' })
      return
    }
    const rows = [['Tanggal', 'Hari', 'Kamar', 'Harga', 'Allotment', 'Status']]
    monthDays.forEach(d => {
      const c = getCell(d.date)
      rows.push([
        fmtKey(d.date),
        DAYS_LONG[d.date.getDay()],
        selectedRoom.name,
        c.price,
        c.allotment,
        c.available ? 'Tersedia' : 'Tutup',
      ])
    })
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `harga-${selectedRoom.name}-${MONTHS[month]}-${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Top toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-slate-500 leading-relaxed flex-1 min-w-[280px]">
          Anda bisa melihat dan mengunduh detail harga dan pesanan dari 90 hari ke belakang hingga 11 bulan ke depan.{' '}
          Selain Kebijakan Pembatalan per rate plan, kini Anda juga bisa mengatur kebijakan khusus untuk tanggal tertentu.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Mode Tampilan</span>
            <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden">
              <button onClick={() => setView('calendar')}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold',
                  view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}>
                <CalendarIcon className="w-3.5 h-3.5" /> Kalender
              </button>
              <button onClick={() => setView('list')}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold',
                  view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}>
                <ListIcon className="w-3.5 h-3.5" /> List
              </button>
            </div>
          </div>
          <button onClick={exportExcel}
            className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
            <Download className="w-4 h-4" /> Ekspor ke excel
          </button>

          {/* Auto-refresh indicator + manual refresh button */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              priceFetching ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'
            )} />
            <span className="text-[11px] text-slate-500 font-medium">
              {priceFetching
                ? 'Memperbarui...'
                : dataUpdatedAt
                  ? `Diperbarui ${new Date(dataUpdatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  : 'Auto-refresh aktif'}
            </span>
            <button
              type="button"
              onClick={() => qc.invalidateQueries({ queryKey: ['room-prices', selectedRoom?.id] })}
              disabled={priceFetching}
              title="Refresh sekarang"
              className="p-1 rounded-md hover:bg-slate-200 text-slate-500 disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3 h-3', priceFetching && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      {/* Help link */}
      <p className="text-sm">
        <button className="text-blue-600 hover:underline">Cari tahu tentang pengaturan harga dan ketersediaan kamar.</button>
      </p>

      {/* Filter strip */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="relative">
          <select value={month} onChange={e => setMonth(+e.target.value)}
            className="appearance-none px-3 py-2 pr-8 border border-slate-200 rounded-xl text-sm font-medium bg-white cursor-pointer">
            {MONTHS.map((m, i) => <option key={i} value={i}>{m} {year}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
        <button onClick={goToday}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Hari Ini
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-medium text-slate-500">Nama Kamar</span>
          <div className="relative">
            <select
              value={selectedRoom?.id || ''}
              onChange={e => setSelectedRoom(rooms?.find(r => String(r.id) === e.target.value) || null)}
              className="appearance-none min-w-[180px] px-3 py-2 pr-8 border border-slate-200 rounded-xl text-sm bg-white cursor-pointer"
            >
              <option value="">Pilih kamar</option>
              {rooms?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* View body */}
      {view === 'calendar' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Day header */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
            {DAYS_LONG.map(d => (
              <div key={d} className="py-3 text-center text-xs font-bold text-slate-600">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const cell      = getCell(day.date)
              const past      = isPast(day.date)
              const isToday   = fmtKey(day.date) === fmtKey(today)
              const clickable = day.isCurrentMonth && !past && !!selectedRoom

              return (
                <div key={i} onClick={() => openEdit(day)}
                  className={cn(
                    'min-h-[96px] p-2 border-r border-b border-slate-100 relative',
                    !day.isCurrentMonth && 'bg-[repeating-linear-gradient(135deg,_#f8fafc_0,_#f8fafc_8px,_#f1f5f9_8px,_#f1f5f9_9px)] cursor-default',
                    day.isCurrentMonth && (past ? 'bg-white cursor-default' : (clickable ? 'bg-white cursor-pointer hover:bg-blue-50/60' : 'bg-white cursor-default'))
                  )}
                >
                  <div className={cn(
                    'text-xs font-bold mb-1 inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full',
                    isToday ? 'bg-blue-600 text-white' :
                    !day.isCurrentMonth || past ? 'text-slate-400' : 'text-slate-700'
                  )}>
                    {day.date.getDate()}
                    {isToday && <span className="ml-1 text-[10px] font-medium">Hari Ini</span>}
                  </div>
                  {day.isCurrentMonth && !past && selectedRoom && (
                    <>
                      <p className={cn(
                        'text-[11px] font-semibold leading-tight',
                        cell.available ? 'text-slate-800' : 'text-red-500'
                      )}>
                        {cell.available ? formatRupiah(cell.price) : 'Tutup'}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1 flex-wrap">
                        <span className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded',
                          !cell.available
                            ? 'bg-red-100 text-red-700'
                            : cell.remaining === 0
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                        )}>
                          {cell.remaining}/{cell.allotment} kmr
                        </span>
                        {cell.booked > 0 && (
                          <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-emerald-50 text-emerald-600" title="Sudah dibayar">
                            ✓{cell.booked}
                          </span>
                        )}
                        {cell.pending > 0 && (
                          <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-amber-50 text-amber-600" title="Menunggu pembayaran">
                            ⏳{cell.pending}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* ─── LIST view ─── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-slate-700">Tanggal</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-700">Hari</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-700">Harga</th>
                  <th className="text-center px-5 py-3 font-semibold text-slate-700">Kamar Tersedia</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-700">Status</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {monthDays.map(d => {
                  const c = getCell(d.date)
                  const past = isPast(d.date)
                  return (
                    <tr key={fmtKey(d.date)} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {d.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{DAYS_LONG[d.date.getDay()]}</td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-800">
                        {formatRupiah(c.price)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <span className={cn('inline-flex items-center justify-center min-w-[50px] px-2 py-0.5 rounded-md text-xs font-bold',
                            c.allotment === 0 ? 'bg-red-50 text-red-700' :
                            c.remaining === 0 ? 'bg-amber-50 text-amber-700' :
                            'bg-emerald-50 text-emerald-700'
                          )}>
                            {c.remaining}/{c.allotment} kamar
                          </span>
                          {c.booked > 0 && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600" title="Sudah dibayar customer">
                              ✓ {c.booked} bayar
                            </span>
                          )}
                          {c.pending > 0 && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600" title="Menunggu pembayaran customer">
                              ⏳ {c.pending} menunggu
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                          c.available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        )}>
                          {c.available ? 'Tersedia' : 'Tutup'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {!past ? (
                          <button onClick={() => openEdit(d)}
                            className="text-xs font-semibold text-blue-600 hover:underline">
                            Ubah
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 px-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tersedia</div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Tutup</div>
        {!selectedRoom && <p className="text-xs text-amber-600 font-medium">Pilih tipe kamar untuk melihat & mengedit harga</p>}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-slate-900">
                {editing.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {selectedRoom?.name}
            </p>

            <div className="space-y-4">
              {/* Harga */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Harga per Malam</label>
                <PriceInput
                  value={editing.price}
                  onChange={v => setEditing(prev => ({ ...prev, price: v || 0 }))}
                />
              </div>

              {/* Allotment Breakdown — Total | Dipesan (paid) | Menunggu (pending, info saja) | Sisa */}
              {(editing.booked > 0 || editing.pending > 0 || (Number(editing.remaining) || 0) > 0 || (Number(editing.allotment) || 0) > 0) && (() => {
                const booked    = Number(editing.booked) || 0
                const pending   = Number(editing.pending) || 0
                const remaining = Number(editing.remaining) || 0
                // Total = booked + remaining (pending tidak mengurangi total/sisa)
                const total     = booked + remaining
                return (
                  <div className="grid grid-cols-4 gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-center px-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Total</p>
                      <p className="text-base font-black text-slate-900 leading-none">{total}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">kamar</p>
                    </div>
                    <div className="text-center px-1 border-l border-slate-200">
                      <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide mb-0.5">Dipesan</p>
                      <p className={cn('text-base font-black leading-none', booked > 0 ? 'text-emerald-600' : 'text-slate-300')}>{booked}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">bayar</p>
                    </div>
                    <div className="text-center px-1 border-l border-slate-200">
                      <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">Menunggu</p>
                      <p className={cn('text-base font-black leading-none', pending > 0 ? 'text-amber-600' : 'text-slate-300')}>{pending}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">bayar</p>
                    </div>
                    <div className="text-center px-1 border-l border-slate-200">
                      <p className="text-[9px] font-bold uppercase tracking-wide mb-0.5 text-blue-600">Sisa</p>
                      <p className={cn('text-base font-black leading-none',
                        remaining === 0 ? 'text-slate-400' : 'text-blue-600'
                      )}>{remaining}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{remaining === 0 ? 'penuh' : 'free'}</p>
                    </div>
                  </div>
                )
              })()}

              {/* Edit Sisa Kamar yang Bisa Dipesan */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Sisa Kamar yang Bisa Dipesan
                </label>
                {(editing.booked > 0 || editing.pending > 0) && (
                  <div className="mb-2 space-y-1.5">
                    {editing.booked > 0 && (
                      <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-1.5">
                        <span className="text-[10px] mt-0.5">✅</span>
                        <p className="text-[11px] text-emerald-800 leading-snug">
                          <span className="font-bold">{editing.booked} kamar</span> sudah dipesan & dibayar customer (terkonfirmasi).
                        </p>
                      </div>
                    )}
                    {editing.pending > 0 && (
                      <div className="px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-1.5">
                        <span className="text-[10px] mt-0.5">⏳</span>
                        <p className="text-[11px] text-amber-800 leading-snug">
                          <span className="font-bold">{editing.pending} kamar</span> menunggu pembayaran (slot terkunci sementara, otomatis lepas kalau VA expired).
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button type="button"
                    onClick={() => setEditing(v => ({ ...v, remaining: Math.max(0, (Number(v.remaining) || 0) - 1) }))}
                    className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50">
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={editing.remaining ?? 0}
                    onChange={e => setEditing(v => ({
                      ...v,
                      remaining: e.target.value === '' ? 0 : Math.max(0, +e.target.value),
                    }))}
                    className="flex-1 text-center text-base font-bold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <button type="button"
                    onClick={() => setEditing(v => ({ ...v, remaining: Math.min(999, (Number(v.remaining) || 0) + 1) }))}
                    className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50">
                    +
                  </button>
                </div>
                <p className={cn(
                  'mt-1.5 text-[11px] leading-snug',
                  (Number(editing.remaining) || 0) === 0 && (Number(editing.booked) || 0) === 0 ? 'text-red-600' :
                  (Number(editing.remaining) || 0) === 0 ? 'text-amber-600' :
                  'text-slate-500'
                )}>
                  {(() => {
                    const remaining = Number(editing.remaining) || 0
                    const booked    = Number(editing.booked) || 0
                    if (remaining === 0 && booked === 0) return '⚠️ Isi 0 berarti kamar TUTUP — tidak bisa dipesan tanggal ini.'
                    if (remaining === 0) return `Customer tidak bisa booking lagi (penuh). Tambah angka di atas supaya bisa terima booking baru.`
                    return `${remaining} kamar masih bisa dipesan customer di tanggal ini.`
                  })()}
                </p>
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-1.5">
                {[0, 1, 2, 5, 10].map(n => (
                  <button key={n} type="button"
                    onClick={() => setEditing(v => ({ ...v, remaining: n }))}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors',
                      Number(editing.remaining) === n
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                    title={n === 0
                      ? (editing.booked > 0 ? 'Tutup booking baru (booking yang sudah ada tetap)' : 'Tutup kamar')
                      : `${n} kamar bisa dipesan customer (total: ${(editing.booked || 0) + n})`}>
                    {n === 0
                      ? (editing.booked > 0 ? 'Tutup baru' : 'Tutup')
                      : `+${n} kamar`}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Batal
              </button>
              <button onClick={saveEdit} disabled={upsertMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                <Save className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  TAB 2 — Softblock Allotment                                              */
/* ═════════════════════════════════════════════════════════════════════════ */
function SoftblockAllotment({ hotel, rooms }) {
  const { toast } = useToast()
  const qc        = useQueryClient()
  const today     = new Date()

  // Default rentang: hari ini → +7 hari
  const initFrom = fmtKey(today)
  const initTo   = fmtKey(addDays(today, 6))

  const [pendingFrom, setPendingFrom] = useState(initFrom)
  const [pendingTo,   setPendingTo]   = useState(initTo)
  const [from, setFrom] = useState(initFrom)
  const [to,   setTo]   = useState(initTo)

  const [roomFilter, setRoomFilter] = useState('')   // '' = semua
  const [toggles, setToggles] = useState({
    harga:      true,
    booked:     true,
    closeOut:   true,
    restriction:true,
  })

  // Local edit state: { [roomId]: { [date]: { softblock_count, ... } } }
  const [dirty, setDirty] = useState({})

  const { data: range, isLoading } = useQuery({
    queryKey: ['room-prices-range', hotel?.id, from, to, roomFilter],
    queryFn: () => hotelApi.getRoomPricesRange(hotel.id, {
      date_from: from,
      date_to:   to,
      room_id:   roomFilter || undefined,
    }).then(r => r.data),
    enabled: !!hotel?.id,
    // Auto-refresh untuk tab Softblock Allotment supaya booked_count selalu fresh
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 10_000,
  })

  const upsertMutation = useMutation({
    mutationFn: ({ roomId, prices }) => hotelApi.upsertRoomPrices(hotel.id, roomId, { prices }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['room-prices-range'] })
      qc.invalidateQueries({ queryKey: ['room-prices'] })
      setDirty({})
      toast({ title: 'Softblock berhasil disimpan.' })
    },
    onError: () => toast({ title: 'Gagal menyimpan.', variant: 'destructive' }),
  })

  const applyDates = () => {
    setFrom(pendingFrom)
    setTo(pendingTo)
  }

  const setCell = (roomId, date, patch) => {
    setDirty(prev => {
      const room = prev[roomId] || {}
      const cell = room[date] || {}
      return { ...prev, [roomId]: { ...room, [date]: { ...cell, ...patch } } }
    })
  }

  const getCellValue = (roomData, date, field) => {
    const dirtyCell = dirty[roomData.room_id]?.[date]
    if (dirtyCell && field in dirtyCell) return dirtyCell[field]
    return roomData.cells?.[date]?.[field]
  }

  const hasDirty = Object.keys(dirty).length > 0

  const saveAll = () => {
    Object.entries(dirty).forEach(([roomId, byDate]) => {
      const prices = Object.entries(byDate).map(([date, fields]) => ({ date, ...fields }))
      upsertMutation.mutate({ roomId: +roomId, prices })
    })
  }

  const ROWS = [
    toggles.harga       && { key: 'price',           label: 'Harga' },
    toggles.booked      && { key: 'booked_count',    label: 'Kamar Dipesan' },
    toggles.closeOut    && { key: 'is_available',    label: 'Close Out' },
    toggles.restriction && { key: 'softblock_count', label: 'Softblock Allotment', editable: true },
    toggles.restriction && { key: 'min_stay',        label: 'Min Stay',  editable: true, placeholder: '—' },
    toggles.restriction && { key: 'max_stay',        label: 'Max Stay',  editable: true, placeholder: '—' },
  ].filter(Boolean)

  return (
    <div className="space-y-4">
      {/* Intro */}
      <ul className="text-sm text-slate-600 space-y-1 list-disc pl-5">
        <li>Anda bisa melihat dan mengunduh allotment untuk 30 hari</li>
        <li>Batas Maksimum tampilan allotment yang telah berlalu adalah 90 hari</li>
      </ul>
      <p className="text-sm">
        <button className="text-blue-600 hover:underline">Cari tahu tentang pengaturan harga dan ketersediaan kamar.</button>
      </p>

      {/* Date range + GO */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Dari</label>
          <input
            type="date"
            value={pendingFrom}
            onChange={e => setPendingFrom(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Sampai</label>
          <input
            type="date"
            value={pendingTo}
            min={pendingFrom}
            onChange={e => setPendingTo(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <button onClick={applyDates}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
          GO
        </button>
      </div>

      {/* Toggles + room filter */}
      <div className="flex items-center gap-5 flex-wrap">
        {[
          { k: 'harga',      label: 'Harga' },
          { k: 'booked',     label: 'Kamar Dipesan' },
          { k: 'closeOut',   label: 'Close Out' },
          { k: 'restriction',label: 'Restriction' },
        ].map(t => (
          <label key={t.k} className="flex items-center gap-2 cursor-pointer">
            <button
              type="button"
              onClick={() => setToggles(s => ({ ...s, [t.k]: !s[t.k] }))}
              className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                toggles[t.k] ? 'bg-blue-600' : 'bg-slate-300')}
            >
              <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                toggles[t.k] ? 'translate-x-6' : 'translate-x-1')} />
            </button>
            <span className="text-sm text-slate-700">{t.label}</span>
          </label>
        ))}

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-medium text-slate-500">Room Name</span>
          <div className="relative">
            <select value={roomFilter} onChange={e => setRoomFilter(e.target.value)}
              className="appearance-none min-w-[180px] px-3 py-2 pr-8 border border-slate-200 rounded-xl text-sm bg-white cursor-pointer">
              <option value="">Semua</option>
              {rooms?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">{from}</span> &mdash; <span className="font-semibold">{to}</span>
          </p>
          <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline">
            Legends <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 min-w-[200px] sticky left-0 bg-slate-50 z-10">
                  Room &amp; Rate Plan
                </th>
                {range?.dates?.map(d => {
                  const dt = new Date(d)
                  return (
                    <th key={d} className="text-center px-3 py-3 font-semibold text-slate-700 min-w-[90px] text-xs">
                      <p>{DAYS_SHORT[dt.getDay()]}</p>
                      <p className="text-base font-bold">{dt.getDate()}</p>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={(range?.dates?.length || 1) + 1} className="px-5 py-10 text-center text-sm text-slate-400">Memuat...</td></tr>
              )}
              {!isLoading && range?.data?.map(roomData => (
                <Fragment key={`room-${roomData.room_id}`}>
                  {/* Header row per kamar */}
                  <tr className="bg-blue-50/40 border-t border-blue-100">
                    <td colSpan={(range.dates?.length || 0) + 1} className="px-4 py-2.5 font-bold text-sm text-slate-800">
                      <span className="flex items-center gap-2">
                        <BedDouble className="w-4 h-4 text-blue-600" />
                        {roomData.room_name}
                      </span>
                    </td>
                  </tr>
                  {/* Row per metric */}
                  {ROWS.map((row, ri) => (
                    <tr key={`${row.key}-${ri}`} className="border-b border-slate-50 hover:bg-slate-50/30">
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-600 sticky left-0 bg-white z-10 border-r border-slate-50">
                        {row.label}
                      </td>
                      {range.dates.map(d => {
                        const cell = roomData.cells?.[d] || {}
                        const dirtyVal = dirty[roomData.room_id]?.[d]?.[row.key]
                        const val = dirtyVal !== undefined ? dirtyVal : cell[row.key]

                        // Render per row.key
                        if (row.key === 'price') {
                          return (
                            <td key={d} className="px-2 py-2 text-center text-xs text-slate-700">
                              {compact(cell.price)}
                            </td>
                          )
                        }
                        if (row.key === 'booked_count') {
                          return (
                            <td key={d} className="px-2 py-2 text-center text-xs">
                              <span className={cn('inline-flex items-center justify-center min-w-[22px] h-6 px-1.5 rounded-md font-semibold',
                                cell.booked_count > 0 ? 'bg-blue-100 text-blue-700' : 'text-slate-400')}>
                                {cell.booked_count || 0}
                              </span>
                            </td>
                          )
                        }
                        if (row.key === 'is_available') {
                          const open = dirtyVal !== undefined ? dirtyVal : cell.is_available
                          return (
                            <td key={d} className="px-2 py-2 text-center">
                              <button
                                onClick={() => setCell(roomData.room_id, d, { is_available: !open })}
                                className={cn('text-[10px] font-bold px-2 py-1 rounded-md',
                                  !open ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}>
                                {!open ? 'Tutup' : 'Buka'}
                              </button>
                            </td>
                          )
                        }
                        if (row.editable) {
                          return (
                            <td key={d} className="px-1 py-1.5 text-center">
                              <input
                                type="number"
                                min={0}
                                value={val ?? ''}
                                placeholder={row.placeholder ?? '0'}
                                onChange={e => setCell(roomData.room_id, d, { [row.key]: e.target.value === '' ? null : +e.target.value })}
                                className="w-16 text-center text-xs border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300"
                              />
                            </td>
                          )
                        }
                        return <td key={d} className="px-2 py-2 text-center text-xs text-slate-500">{val ?? '—'}</td>
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
              {!isLoading && !range?.data?.length && (
                <tr><td colSpan={(range?.dates?.length || 1) + 1} className="px-5 py-10 text-center text-sm text-slate-400">
                  Belum ada data. Pilih rentang tanggal lalu tekan GO.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Save bar */}
        {hasDirty && (
          <div className="px-5 py-3 border-t border-slate-100 bg-amber-50 flex items-center justify-between">
            <p className="text-sm text-amber-800">
              Ada perubahan belum disimpan.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDirty({})}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-white">
                Reset
              </button>
              <button onClick={saveAll} disabled={upsertMutation.isPending}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-1.5 disabled:opacity-60">
                <Save className="w-3.5 h-3.5" />
                {upsertMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Main page                                                                */
/* ═════════════════════════════════════════════════════════════════════════ */
export default function AturHarga() {
  const { hotel } = useOutletContext()
  const [logOpen, setLogOpen] = useState(false)

  const { data: rooms } = useQuery({
    queryKey: ['owner-rooms', hotel?.id],
    queryFn: () => hotelApi.getRooms(hotel.id).then(r => r.data?.data || r.data || []),
    enabled: !!hotel?.id,
  })

  return (
    <div className="space-y-5">
      {/* Header with Lihat Log */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900">Atur Harga &amp; Ketersediaan</h1>
        <button
          onClick={() => setLogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold transition-colors"
        >
          <Clock className="w-4 h-4" /> Lihat Log
        </button>
      </div>

      {/* Tab indicator (single section: Rate & Allotment) */}
      <div className="border-b border-slate-200 flex items-center gap-6">
        <div className="pb-3 -mb-px text-sm font-bold text-blue-600 border-b-2 border-blue-600">
          Rate &amp; Allotment
        </div>
      </div>

      <RegularAllotment hotel={hotel} rooms={rooms || []} />

      <LogDrawer open={logOpen} onClose={() => setLogOpen(false)} hotelId={hotel?.id} />
    </div>
  )
}
