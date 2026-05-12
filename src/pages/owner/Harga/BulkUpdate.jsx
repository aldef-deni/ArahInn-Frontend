import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export default function BulkUpdate() {
  const { hotel } = useOutletContext()
  const { toast } = useToast()

  const { data: rooms } = useQuery({
    queryKey: ['owner-rooms', hotel?.id],
    queryFn: () => hotelApi.getRooms(hotel.id).then(r => r.data?.data || r.data),
    enabled: !!hotel?.id,
  })

  const [form, setForm] = useState({
    selectedRooms: [],
    dateFrom: '',
    dateTo: '',
    newPrice: '',
    available: 'keep',
    applyDays: ['0', '1', '2', '3', '4', '5', '6'],
  })

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleRoom = (id) =>
    setForm(f => ({
      ...f,
      selectedRooms: f.selectedRooms.includes(id)
        ? f.selectedRooms.filter(r => r !== id)
        : [...f.selectedRooms, id],
    }))

  const toggleDay = (d) =>
    setForm(f => ({
      ...f,
      applyDays: f.applyDays.includes(d)
        ? f.applyDays.filter(x => x !== d)
        : [...f.applyDays, d],
    }))

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
      toast({ title: res.data?.message || 'Bulk update berhasil diterapkan.' })
    },
    onError: () => toast({ title: 'Gagal menerapkan perubahan.', variant: 'destructive' }),
  })

  const handleApply = () => {
    if (!form.dateFrom || !form.dateTo) {
      toast({ title: 'Pilih rentang tanggal terlebih dahulu.', variant: 'destructive' })
      return
    }
    if (!form.selectedRooms.length) {
      toast({ title: 'Pilih minimal satu kamar.', variant: 'destructive' })
      return
    }
    if (form.newPrice === '' && form.available === 'keep') {
      toast({ title: 'Pilih harga baru atau status ketersediaan yang ingin diubah.', variant: 'destructive' })
      return
    }
    mutation.mutate()
  }

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
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Pilih Kamar</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Dari Tanggal</label>
              <input type="date" value={form.dateFrom} onChange={e => upd('dateFrom', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Sampai Tanggal</label>
              <input type="date" value={form.dateTo} onChange={e => upd('dateTo', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Harga Baru</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium shrink-0">Rp</span>
                <input type="number" value={form.newPrice} onChange={e => upd('newPrice', e.target.value)}
                  placeholder="Kosongkan jika tidak diubah"
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
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
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
          <button onClick={handleApply} disabled={mutation.isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${mutation.isPending ? 'animate-spin' : ''}`} />
            {mutation.isPending ? 'Memproses...' : 'Terapkan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  )
}
