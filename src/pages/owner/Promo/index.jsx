import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { promoApi } from '@/services/index'
import { hotelApi } from '@/services/hotelApi'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, formatDateShort } from '@/utils'
import DateInput from '@/components/ui/DateInput'
import { Plus, Tag, X, Trash2, Zap, Award, Copy, Check, ShieldCheck, Clock, ToggleLeft, ToggleRight, Heart, HeartOff, CheckCircle2 } from 'lucide-react'
import PriceInput from '@/components/ui/PriceInput'

const TYPE_STYLES = {
  flash_sale : { grad: 'from-orange-500 to-red-500',    sub: 'text-orange-100', icon: Zap,   iconBg: 'bg-white/20' },
  voucher    : { grad: 'from-blue-500 to-indigo-600',   sub: 'text-blue-100',   icon: Tag,   iconBg: 'bg-white/20' },
  loyalty    : { grad: 'from-purple-500 to-violet-600', sub: 'text-purple-100', icon: Award, iconBg: 'bg-white/20' },
}

const emptyForm = {
  code: '', name: '', type: 'voucher', discount_type: 'percent', discount_value: '',
  min_purchase: '', quota: '', start_date: '', end_date: '', hotel_id: '',
}

export default function OwnerPromo() {
  const { toast }  = useToast()
  const qc         = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm]   = useState(emptyForm)

  const { data: ownerPromos = [], isLoading: loadingOwner } = useQuery({
    queryKey: ['my-promos'],
    queryFn : () => promoApi.myPromos().then(r => r.data?.data || []),
  })

  // Daftar properti owner untuk dropdown "Berlaku untuk"
  const { data: myHotels = [] } = useQuery({
    queryKey: ['owner-my-hotels'],
    queryFn : () => hotelApi.myHotels().then(r => r.data?.data || []),
    staleTime: 5 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: (d) => promoApi.create(d),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['my-promos'] })
      setModal(false)
      setForm(emptyForm)
      toast({ title: 'Promo berhasil dibuat.' })
    },
    onError: () => toast({ title: 'Gagal membuat promo.', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => promoApi.remove(id),
    onSuccess : () => { qc.invalidateQueries({ queryKey: ['my-promos'] }); toast({ title: 'Promo dihapus.' }) },
    onError   : () => toast({ title: 'Gagal menghapus.', variant: 'destructive' }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => promoApi.update(id, { is_active: isActive }),
    onSuccess : (_, { isActive }) => {
      qc.invalidateQueries({ queryKey: ['my-promos'] })
      toast({ title: isActive ? 'Promo diaktifkan.' : 'Promo dinonaktifkan.' })
    },
    onError: () => toast({ title: 'Gagal mengubah status promo.', variant: 'destructive' }),
  })

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="space-y-8">

      {/* ── Promo Hotel Saya ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Promo Hotel Saya</h2>
          </div>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Buat Promo
          </button>
        </div>

        {loadingOwner ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-36 rounded-xl" />)}
          </div>
        ) : ownerPromos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ownerPromos.map(p => (
              <div key={p.id} className={`bg-white rounded-xl border shadow-sm p-5 transition-all ${p.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
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
                <p className="text-[11px] text-brand-700 bg-brand/10 inline-block px-2 py-0.5 rounded-md mt-1 font-medium">
                  {p.hotelId
                    ? (myHotels.find(h => String(h.id) === String(p.hotelId))?.name || 'Properti tertentu')
                    : 'Semua Properti'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Diskon {p.discountType === 'percent'
                    ? `${p.discountValue}%`
                    : formatRupiah(p.discountValue)}
                </p>
                <p className="text-xs text-slate-300 mt-2">
                  {p.endDate && `s/d ${new Date(p.endDate).toLocaleDateString('id-ID')}`}
                  {(p.quota != null) && ` · Sisa ${p.quota - (p.usedCount ?? 0)} kuota`}
                </p>

                {/* Toggle Aktif */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <button
                    onClick={() => toggleMutation.mutate({ id: p.id, isActive: !p.isActive })}
                    disabled={toggleMutation.isPending}
                    title={p.isActive ? 'Nonaktifkan promo' : 'Aktifkan promo'}
                    className="disabled:opacity-50 transition-opacity"
                  >
                    {p.isActive
                      ? <ToggleRight className="w-8 h-8 text-green-500" />
                      : <ToggleLeft  className="w-8 h-8 text-slate-300" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center bg-white rounded-2xl border border-slate-200">
            <Tag className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Belum ada promo hotel. Buat promo pertama Anda.</p>
          </div>
        )}
      </div>

      {/* Modal Buat Promo */}
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
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Berlaku untuk</label>
                <select value={form.hotel_id} onChange={f('hotel_id')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30">
                  <option value="">Semua Properti</option>
                  {myHotels.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Pilih properti tertentu, atau "Semua Properti" untuk seluruh akomodasi Anda.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kode Voucher <span className="text-red-500">*</span></label>
                <input value={form.code} onChange={f('code')} placeholder="mis. DISKON20"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand uppercase" />
                <p className="text-[11px] text-slate-400 mt-1">Wajib — kode ini dimasukkan customer saat pembayaran.</p>
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
                  <PriceInput
                    value={form.min_purchase}
                    onChange={v => setForm(p => ({ ...p, min_purchase: v }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kuota</label>
                  <input type="number" value={form.quota} onChange={f('quota')}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mulai</label>
                  <DateInput value={form.start_date} onChange={v => setForm(p => ({ ...p, start_date: v }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Berakhir</label>
                  <DateInput value={form.end_date} min={form.start_date || undefined}
                    onChange={v => setForm(p => ({ ...p, end_date: v }))} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setModal(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button
                onClick={() => {
                  if (!form.code?.trim()) { toast({ title: 'Kode voucher wajib diisi.', variant: 'destructive' }); return }
                  createMutation.mutate(form)
                }}
                disabled={createMutation.isPending}
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
