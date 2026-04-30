import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { promoApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import { Plus, Tag, X, Trash2 } from 'lucide-react'

const emptyForm = {
  code: '', name: '', discount_type: 'percent', discount_value: '',
  min_purchase: '', quota: '', start_date: '', end_date: '',
}

export default function OwnerPromo() {
  const { toast }  = useToast()
  const qc         = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm]   = useState(emptyForm)

  const { data: promos, isLoading } = useQuery({
    queryKey: ['owner-promos'],
    queryFn : () => promoApi.getActive().then(r => r.data?.data || []),
  })

  const createMutation = useMutation({
    mutationFn: (d) => promoApi.create(d),
    onSuccess : () => { qc.invalidateQueries(['owner-promos']); setModal(false); setForm(emptyForm); toast({ title: 'Promo berhasil dibuat.' }) },
    onError   : () => toast({ title: 'Gagal membuat promo.', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => promoApi.remove(id),
    onSuccess : () => { qc.invalidateQueries(['owner-promos']); toast({ title: 'Promo dihapus.' }) },
    onError   : () => toast({ title: 'Gagal menghapus.', variant: 'destructive' }),
  })

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Buat Promo
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-36 rounded-xl" />)
          : promos?.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                    <Tag className="w-4 h-4 text-orange-500" />
                  </div>
                  <button onClick={() => { if (confirm('Hapus promo ini?')) deleteMutation.mutate(p.id) }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {p.code && (
                  <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-mono font-semibold mb-2">
                    {p.code}
                  </span>
                )}
                <p className="font-semibold text-slate-900 text-sm line-clamp-2">{p.name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Diskon {p.discountType === 'percent' ? `${p.discountValue}%` : formatRupiah(p.discountValue)}
                </p>
                <p className="text-xs text-slate-300 mt-2">
                  s/d {new Date(p.endDate).toLocaleDateString('id-ID')} · Sisa {p.quota - p.usedCount} kuota
                </p>
              </div>
            ))
        }
        {!isLoading && !promos?.length && (
          <div className="col-span-3 py-14 text-center text-slate-400 text-sm">Belum ada promo aktif.</div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Buat Promo Baru</h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Promo</label>
                <input value={form.name} onChange={f('name')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kode Voucher (opsional)</label>
                <input value={form.code} onChange={f('code')} placeholder="mis. DISKON20"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tipe Diskon</label>
                  <select value={form.discount_type} onChange={f('discount_type')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30">
                    <option value="percent">Persen (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nilai Diskon</label>
                  <input type="number" value={form.discount_value} onChange={f('discount_value')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Min. Pembelian</label>
                  <input type="number" value={form.min_purchase} onChange={f('min_purchase')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kuota</label>
                  <input type="number" value={form.quota} onChange={f('quota')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mulai</label>
                  <input type="date" value={form.start_date} onChange={f('start_date')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Berakhir</label>
                  <input type="date" value={form.end_date} onChange={f('end_date')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setModal(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}
                className="px-5 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50">
                {createMutation.isPending ? 'Menyimpan...' : 'Buat Promo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
