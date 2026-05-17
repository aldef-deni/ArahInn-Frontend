import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { ChevronLeft, ChevronRight, BedDouble, X, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import PriceInput from '@/components/ui/PriceInput'

const DAYS   = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni',
                'Juli','Agustus','September','Oktober','November','Desember']

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

function compact(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'jt'
  if (n >= 1000)    return Math.round(n / 1000) + 'rb'
  return String(n)
}

export default function AturHarga() {
  const { hotel } = useOutletContext()
  const { toast } = useToast()
  const qc = useQueryClient()
  const today = new Date()

  const [year, setYear]             = useState(today.getFullYear())
  const [month, setMonth]           = useState(today.getMonth())
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [editing, setEditing]       = useState(null)

  const { data: rooms } = useQuery({
    queryKey: ['owner-rooms', hotel?.id],
    queryFn: () => hotelApi.getRooms(hotel.id).then(r => r.data?.data || r.data),
    enabled: !!hotel?.id,
  })

  const { data: priceData } = useQuery({
    queryKey: ['room-prices', selectedRoom?.id, year, month + 1],
    queryFn: () =>
      hotelApi.getRoomPrices(hotel.id, selectedRoom.id, { year, month: month + 1 })
        .then(r => ({ prices: r.data?.data || {}, basePrice: r.data?.base_price || 0 })),
    enabled: !!hotel?.id && !!selectedRoom?.id,
  })

  const upsertMutation = useMutation({
    mutationFn: (prices) => hotelApi.upsertRoomPrices(hotel.id, selectedRoom.id, { prices }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['room-prices', selectedRoom?.id] })
      setEditing(null)
      toast({ title: 'Harga berhasil diperbarui.' })
    },
    onError: () => toast({ title: 'Gagal menyimpan.', variant: 'destructive' }),
  })

  const days = useMemo(() => getCalendarDays(year, month), [year, month])

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const getCell = (date) => {
    const key   = fmtKey(date)
    const saved = priceData?.prices?.[key]
    return {
      price:     saved?.price       ?? priceData?.basePrice ?? selectedRoom?.basePrice ?? 0,
      available: saved?.is_available ?? true,
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
    setEditing({ date: day.date, price: cell.price, available: cell.available })
  }

  const saveEdit = () => {
    if (!editing) return
    upsertMutation.mutate([{
      date:         fmtKey(editing.date),
      price:        editing.price,
      is_available: editing.available,
    }])
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Pilih Tipe Kamar</p>
        <div className="flex flex-wrap gap-2">
          {rooms?.map(r => (
            <button key={r.id} onClick={() => setSelectedRoom(r)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                selectedRoom?.id === r.id
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
              }`}>
              <BedDouble className="w-4 h-4" /> {r.name}
            </button>
          ))}
          {!rooms?.length && <p className="text-sm text-slate-400">Belum ada kamar.</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-semibold text-slate-900">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS.map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">{d}</div>
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
                className={`min-h-[76px] p-2 border-r border-b border-slate-50 transition-colors ${
                  !day.isCurrentMonth ? 'bg-slate-50/40 cursor-default'
                  : past ? 'bg-white cursor-default'
                  : clickable ? 'bg-white cursor-pointer hover:bg-blue-50/60'
                  : 'bg-white cursor-default'
                }`}>
                <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-blue-600 text-white'
                  : !day.isCurrentMonth || past ? 'text-slate-300'
                  : 'text-slate-700'
                }`}>
                  {day.date.getDate()}
                </div>
                {day.isCurrentMonth && !past && selectedRoom && (
                  <>
                    <p className={`text-[10px] font-semibold leading-tight ${cell.available ? 'text-slate-700' : 'text-red-400'}`}>
                      {cell.available ? compact(cell.price) : 'Tutup'}
                    </p>
                    <div className={`mt-1 w-2 h-2 rounded-full ${cell.available ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 px-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Tersedia</div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /> Tutup</div>
        {!selectedRoom && <p className="text-xs text-amber-600 font-medium">← Pilih tipe kamar untuk melihat & mengedit harga</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">
                {editing.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Harga per Malam</label>
                <PriceInput
                  value={editing.price}
                  onChange={v => setEditing(prev => ({ ...prev, price: v || 0 }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-2 block">Status Ketersediaan</label>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(v => ({ ...v, available: true }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${editing.available ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-500 hover:border-emerald-200'}`}>
                    Tersedia
                  </button>
                  <button onClick={() => setEditing(v => ({ ...v, available: false }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${!editing.available ? 'bg-red-500 border-red-500 text-white' : 'border-slate-200 text-slate-500 hover:border-red-200'}`}>
                    Tutup
                  </button>
                </div>
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
