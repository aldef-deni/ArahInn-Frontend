import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { RefreshCw, AlertTriangle, X, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import PriceInput from '@/components/ui/PriceInput'

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

/* ─── Confirm modal ─── */
function ConfirmModal({ open, summary, onCancel, onConfirm, pending }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900">Terapkan Bulk Update?</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Perubahan akan langsung menimpa data yang ada dan tidak dapat dibatalkan.
            </p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Ringkasan</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Jumlah kamar</dt>            <dd className="font-semibold text-slate-800">{summary.roomCount}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Rentang tanggal</dt>          <dd className="font-semibold text-slate-800">{summary.dateFrom} → {summary.dateTo}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Hari yang terdampak</dt>      <dd className="font-semibold text-slate-800">{summary.dayCount} dari 7</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Estimasi cell terupdate</dt>  <dd className="font-semibold text-blue-600">{summary.estimatedCells}</dd></div>
            {summary.priceLabel && (
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Harga baru</dt>             <dd className="font-semibold text-slate-800">{summary.priceLabel}</dd></div>
            )}
            {summary.availLabel && (
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Status</dt>                 <dd className="font-semibold text-slate-800">{summary.availLabel}</dd></div>
            )}
          </dl>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Batal
          </button>
          <button onClick={onConfirm} disabled={pending}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
            {pending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {pending ? 'Memproses...' : 'Ya, Terapkan'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main page ─── */
export default function BulkUpdate() {
  const { hotel } = useOutletContext()
  const { toast } = useToast()
  const qc        = useQueryClient()

  const { data: rooms } = useQuery({
    queryKey: ['owner-rooms', hotel?.id],
    queryFn: () => hotelApi.getRooms(hotel.id).then(r => r.data?.data || r.data || []),
    enabled: !!hotel?.id,
  })

  const [form, setForm] = useState({
    selectedRooms: [],
    dateFrom: '',
    dateTo: '',
    newPrice: '',
    available: 'keep',
    applyDays: [],
  })
  const [showConfirm, setShowConfirm] = useState(false)

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleRoom = (id) =>
    setForm(f => ({
      ...f,
      selectedRooms: f.selectedRooms.includes(id)
        ? f.selectedRooms.filter(r => r !== id)
        : [...f.selectedRooms, id],
    }))

  const selectAllRooms = () => {
    setForm(f => ({
      ...f,
      selectedRooms: f.selectedRooms.length === (rooms?.length || 0)
        ? []
        : (rooms || []).map(r => r.id),
    }))
  }

  const toggleDay = (d) =>
    setForm(f => ({
      ...f,
      applyDays: f.applyDays.includes(d)
        ? f.applyDays.filter(x => x !== d)
        : [...f.applyDays, d],
    }))

  /* Estimasi jumlah cell yang akan terupdate (FE side) */
  const estimate = useMemo(() => {
    if (!form.dateFrom || !form.dateTo) return { dayCount: 0, estimatedCells: 0 }
    const from = new Date(form.dateFrom)
    const to   = new Date(form.dateTo)
    if (to < from) return { dayCount: 0, estimatedCells: 0 }
    let matchedDates = 0
    const cur = new Date(from)
    while (cur <= to) {
      if (form.applyDays.includes(String(cur.getDay()))) matchedDates++
      cur.setDate(cur.getDate() + 1)
    }
    return {
      dayCount: form.applyDays.length,
      estimatedCells: matchedDates * form.selectedRooms.length,
    }
  }, [form.dateFrom, form.dateTo, form.applyDays, form.selectedRooms])

  const mutation = useMutation({
    mutationFn: () =>
      hotelApi.bulkUpdatePrices(hotel.id, {
        room_ids:     form.selectedRooms,
        date_from:    form.dateFrom,
        date_to:      form.dateTo,
        price:        form.newPrice !== '' ? Number(form.newPrice) : null,
        is_available: form.available === 'keep' ? null : form.available === 'true',
        apply_days:   form.applyDays.map(Number),
      }),
    onSuccess: (res) => {
      // Invalidate semua cache terkait price/availability
      qc.invalidateQueries({ queryKey: ['room-prices'] })
      qc.invalidateQueries({ queryKey: ['room-prices-range'] })
      qc.invalidateQueries({ queryKey: ['owner-rooms'] })

      const affected = res.data?.affected_cells ?? estimate.estimatedCells
      const dates    = res.data?.dates ?? 0
      setShowConfirm(false)
      toast({
        title: 'Bulk update berhasil',
        description: `${affected} cell diperbarui (${form.selectedRooms.length} kamar × ${dates} tanggal).`,
      })
    },
    onError: (e) => {
      const msg = e?.response?.data?.message
        || (e?.response?.status === 422 ? 'Data tidak valid: ' + JSON.stringify(e.response.data?.errors) : null)
        || 'Gagal menerapkan perubahan.'
      toast({ title: 'Gagal', description: msg, variant: 'destructive' })
    },
  })

  const validate = () => {
    if (!form.dateFrom || !form.dateTo) {
      toast({ title: 'Pilih rentang tanggal terlebih dahulu.', variant: 'destructive' })
      return false
    }
    if (new Date(form.dateTo) < new Date(form.dateFrom)) {
      toast({ title: 'Tanggal "Sampai" harus setelah atau sama dengan "Dari".', variant: 'destructive' })
      return false
    }
    if (!form.selectedRooms.length) {
      toast({ title: 'Pilih minimal satu kamar.', variant: 'destructive' })
      return false
    }
    if (!form.applyDays.length) {
      toast({ title: 'Pilih minimal satu hari dalam minggu.', variant: 'destructive' })
      return false
    }
    if (form.newPrice === '' && form.available === 'keep') {
      toast({ title: 'Pilih harga baru atau status ketersediaan yang ingin diubah.', variant: 'destructive' })
      return false
    }
    if (form.newPrice !== '' && +form.newPrice < 0) {
      toast({ title: 'Harga tidak boleh negatif.', variant: 'destructive' })
      return false
    }
    return true
  }

  const handleApply = () => {
    if (!validate()) return
    setShowConfirm(true)
  }

  const summary = useMemo(() => ({
    roomCount: form.selectedRooms.length,
    dateFrom:  form.dateFrom,
    dateTo:    form.dateTo,
    dayCount:  form.applyDays.length,
    estimatedCells: estimate.estimatedCells,
    priceLabel: form.newPrice !== '' ? formatRupiah(+form.newPrice) : null,
    availLabel: form.available === 'keep' ? null : form.available === 'true' ? 'Tersedia' : 'Tutup',
  }), [form, estimate])

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Bulk Update Harga</h2>
            <p className="text-xs text-slate-400">Perbarui harga beberapa kamar dan rentang tanggal sekaligus</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Kamar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700">Pilih Kamar</label>
              {rooms?.length > 0 && (
                <button onClick={selectAllRooms} className="text-xs font-semibold text-blue-600 hover:underline">
                  {form.selectedRooms.length === rooms.length ? 'Batalkan semua' : 'Pilih semua'}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {rooms?.map(r => (
                <button key={r.id} onClick={() => toggleRoom(r.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    form.selectedRooms.includes(r.id)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-blue-200'
                  }`}>
                  {r.name}
                </button>
              ))}
              {!rooms?.length && <p className="text-sm text-slate-400">Belum ada kamar.</p>}
            </div>
          </div>

          {/* Tanggal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Dari Tanggal</label>
              <input type="date" value={form.dateFrom} onChange={e => upd('dateFrom', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Sampai Tanggal</label>
              <input type="date" value={form.dateTo} min={form.dateFrom} onChange={e => upd('dateTo', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>

          {/* Hari */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Terapkan pada Hari</label>
            <div className="flex gap-2 flex-wrap">
              {DAY_LABELS.map((d, i) => (
                <button key={i} onClick={() => toggleDay(String(i))}
                  className={`w-10 h-10 rounded-xl text-xs font-semibold border transition-all ${
                    form.applyDays.includes(String(i))
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-200 text-slate-500 hover:border-blue-200'
                  }`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Harga & status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Harga Baru</label>
              <PriceInput
                value={form.newPrice}
                onChange={v => upd('newPrice', v)}
                placeholder="Kosongkan jika tidak diubah"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Status Ketersediaan</label>
              <select value={form.available} onChange={e => upd('available', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
                <option value="keep">Tidak diubah</option>
                <option value="true">Tersedia</option>
                <option value="false">Tutup</option>
              </select>
            </div>
          </div>

          {/* Estimasi dampak */}
          {estimate.estimatedCells > 0 && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800 flex items-center justify-between">
              <span>
                Estimasi <span className="font-bold">{estimate.estimatedCells} cell</span> akan diupdate
                ({form.selectedRooms.length} kamar × tanggal yang match)
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
          <button onClick={handleApply} disabled={mutation.isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${mutation.isPending ? 'animate-spin' : ''}`} />
            {mutation.isPending ? 'Memproses...' : 'Terapkan Perubahan'}
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showConfirm}
        summary={summary}
        pending={mutation.isPending}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => mutation.mutate()}
      />
    </div>
  )
}
