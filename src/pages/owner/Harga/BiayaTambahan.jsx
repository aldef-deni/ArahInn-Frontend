import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import { Plus, Pencil, Trash2, X, Save, Receipt } from 'lucide-react'

const PER_LABEL = { night: '/malam', stay: '/menginap', person: '/orang' }

function FeeForm({ fee, hotelId, onClose }) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [form, setForm] = useState(
    fee
      ? { name: fee.name, amount: fee.amount, type: fee.type, per: fee.per, mandatory: fee.mandatory }
      : { name: '', amount: 0, type: 'fixed', per: 'night', mandatory: false }
  )
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: (d) =>
      fee
        ? hotelApi.updateHotelFee(hotelId, fee.id, d)
        : hotelApi.createHotelFee(hotelId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotel-fees', hotelId] })
      toast({ title: fee ? 'Biaya diperbarui.' : 'Biaya tambahan ditambahkan.' })
      onClose()
    },
    onError: () => toast({ title: 'Gagal menyimpan.', variant: 'destructive' }),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-900">{fee ? 'Edit Biaya' : 'Tambah Biaya Tambahan'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Nama Biaya</label>
            <input value={form.name} onChange={e => upd('name', e.target.value)} placeholder="e.g. Pajak Daerah"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Tipe</label>
              <select value={form.type} onChange={e => upd('type', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
                <option value="fixed">Nominal Tetap</option>
                <option value="percent">Persentase (%)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                {form.type === 'percent' ? 'Persentase (%)' : 'Jumlah (Rp)'}
              </label>
              <input type="number" value={form.amount} onChange={e => upd('amount', +e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Berlaku Per</label>
            <select value={form.per} onChange={e => upd('per', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
              <option value="night">Per Malam</option>
              <option value="stay">Per Menginap</option>
              <option value="person">Per Orang</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.mandatory} onChange={e => upd('mandatory', e.target.checked)} className="rounded" />
            <span className="text-sm text-slate-700">Wajib (tidak bisa dilewati tamu)</span>
          </label>
        </div>
        <div className="mt-5 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
          <button
            onClick={() => { if (form.name) mutation.mutate(form) }}
            disabled={mutation.isPending || !form.name}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60">
            <Save className="w-4 h-4" /> Simpan
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BiayaTambahan() {
  const { hotel } = useOutletContext()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)

  const { data: fees, isLoading } = useQuery({
    queryKey: ['hotel-fees', hotel?.id],
    queryFn: () => hotelApi.getHotelFees(hotel.id).then(r => r.data?.data || []),
    enabled: !!hotel?.id,
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => hotelApi.deleteHotelFee(hotel.id, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotel-fees', hotel?.id] })
      toast({ title: 'Biaya dihapus.' })
    },
    onError: () => toast({ title: 'Gagal menghapus.', variant: 'destructive' }),
  })

  const toggleMutation = useMutation({
    mutationFn: (fee) => hotelApi.updateHotelFee(hotel.id, fee.id, { active: !fee.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel-fees', hotel?.id] }),
    onError: () => toast({ title: 'Gagal memperbarui.', variant: 'destructive' }),
  })

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Biaya Tambahan</h2>
            <p className="text-xs text-slate-400 mt-0.5">Biaya ekstra di luar harga kamar</p>
          </div>
          <button onClick={() => setModal('add')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Tambah Biaya
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {isLoading
            ? Array(3).fill(0).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="skeleton w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-2"><div className="skeleton h-4 w-28 rounded" /><div className="skeleton h-3 w-20 rounded" /></div>
                </div>
              ))
            : fees?.map(f => (
                <div key={f.id} className={`px-6 py-4 flex items-center gap-4 ${!f.active ? 'opacity-50' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${f.active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-900">{f.name}</p>
                      {f.mandatory && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Wajib</span>}
                      {!f.active && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Nonaktif</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {f.type === 'percent' ? `${f.amount}% dari harga kamar` : formatRupiah(f.amount)}
                      {PER_LABEL[f.per]}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleMutation.mutate(f)} disabled={toggleMutation.isPending}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50">
                      {f.active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button onClick={() => setModal(f)} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteMutation.mutate(f.id)} disabled={deleteMutation.isPending}
                      className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
          }
          {!isLoading && !fees?.length && (
            <div className="py-14 text-center text-slate-400 text-sm">Belum ada biaya tambahan.</div>
          )}
        </div>
      </div>

      {modal && (
        <FeeForm fee={modal === 'add' ? null : modal} hotelId={hotel?.id} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
