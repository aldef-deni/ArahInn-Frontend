import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { promoApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, formatDateShort } from '@/utils'
import { Plus, Tag, X, Trash2, Zap, Award, Copy, Check, ShieldCheck, Clock, ToggleLeft, ToggleRight, Heart, HeartOff, CheckCircle2 } from 'lucide-react'
import PriceInput from '@/components/ui/PriceInput'

const TYPE_STYLES = {
  flash_sale : { grad: 'from-orange-500 to-red-500',    sub: 'text-orange-100', icon: Zap,   iconBg: 'bg-white/20' },
  voucher    : { grad: 'from-blue-500 to-indigo-600',   sub: 'text-blue-100',   icon: Tag,   iconBg: 'bg-white/20' },
  loyalty    : { grad: 'from-purple-500 to-violet-600', sub: 'text-purple-100', icon: Award, iconBg: 'bg-white/20' },
}

function PlatformPromoCard({ promo, onToggleFollow, busy }) {
  const [copied, setCopied] = useState(false)
  const style = TYPE_STYLES[promo.type] || TYPE_STYLES.voucher
  const Icon  = style.icon
  const discountLabel = promo.discountType === 'percent'
    ? `${promo.discountValue}% OFF`
    : `${formatRupiah(promo.discountValue)} OFF`

  // Bandingkan di level tanggal lokal (abaikan jam) supaya konsisten
  // dengan ekspektasi user yang input "tanggal mulai".
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = promo.startDate ? new Date(promo.startDate) : null
  if (start) start.setHours(0, 0, 0, 0)
  const isUpcoming = !!(start && start > today)
  const isRunning  = !isUpcoming   // promo sudah mulai (atau tidak ada start_date)
  const followed   = !!promo.followed

  const copyCode = () => {
    navigator.clipboard.writeText(promo.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-r ${style.grad} shadow-md ${isUpcoming ? 'opacity-95' : ''}`}>
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        {isUpcoming ? (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-400 text-amber-900 rounded-full text-[10px] font-bold shadow-sm">
            <Clock className="w-3 h-3" /> Segera Hadir
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold shadow-sm">
            <CheckCircle2 className="w-3 h-3" /> Sedang Berjalan
          </span>
        )}
        <span className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-[10px] text-white font-semibold">
          <ShieldCheck className="w-3 h-3" /> Platform
        </span>
      </div>
      <div className="p-5 pb-3 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl ${style.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-snug">{promo.name}</p>
          <p className={`text-xs ${style.sub} mt-0.5`}>
            {promo.minPurchase > 0 && `Min. ${formatRupiah(promo.minPurchase)} · `}
            {isUpcoming
              ? `Mulai ${formatDateShort(promo.startDate)}`
              : promo.endDate && `s/d ${formatDateShort(promo.endDate)}`}
          </p>
          {promo.code && (
            <button onClick={copyCode}
              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg transition-colors">
              <span className="font-mono text-xs font-bold text-white tracking-widest">{promo.code}</span>
              {copied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3 text-white/60" />}
            </button>
          )}
        </div>
        <span className="text-white font-black text-xl shrink-0">{discountLabel}</span>
      </div>

      {/* Footer: tombol Ikuti / Hentikan */}
      <div className="px-5 pb-4 pt-1 flex items-center justify-between gap-3 border-t border-white/20 mt-1">
        <p className="text-[11px] text-white/85 leading-tight flex-1">
          {followed
            ? 'Promo aktif — diskon otomatis berlaku untuk hotel Anda.'
            : 'Ikuti promo untuk memberikan diskon otomatis di hotel Anda.'}
        </p>
        <button
          onClick={() => onToggleFollow(promo)}
          disabled={busy}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors disabled:opacity-60 ${
            followed
              ? 'bg-white/15 text-white hover:bg-white/25 border border-white/30'
              : 'bg-white text-slate-900 hover:bg-slate-100 shadow'
          }`}
        >
          {followed
            ? <><HeartOff className="w-3.5 h-3.5" /> Hentikan</>
            : <><Heart    className="w-3.5 h-3.5" /> Ikuti Promo</>}
        </button>
      </div>
    </div>
  )
}

const emptyForm = {
  code: '', name: '', type: 'voucher', discount_type: 'percent', discount_value: '',
  min_purchase: '', quota: '', start_date: '', end_date: '',
}

export default function OwnerPromo() {
  const { toast }  = useToast()
  const qc         = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm]   = useState(emptyForm)

  const { data: platformPromos = [], isLoading: loadingPlatform } = useQuery({
    queryKey: ['platform-promos'],
    queryFn : () => promoApi.platform().then(r => r.data?.data || []),
  })

  const { data: ownerPromos = [], isLoading: loadingOwner } = useQuery({
    queryKey: ['my-promos'],
    queryFn : () => promoApi.myPromos().then(r => r.data?.data || []),
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

  const followMutation = useMutation({
    mutationFn: ({ id, follow }) => follow ? promoApi.follow(id) : promoApi.unfollow(id),
    onSuccess : (r) => {
      qc.invalidateQueries({ queryKey: ['platform-promos'] })
      toast({ title: r?.data?.message || 'Status promo diperbarui.' })
    },
    onError: () => toast({ title: 'Gagal memperbarui status promo.', variant: 'destructive' }),
  })

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="space-y-8">

      {/* ── Promo dari Platform ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Promo dari Platform Arahinn</h2>
        </div>

        {loadingPlatform ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array(2).fill(0).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
          </div>
        ) : platformPromos.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {platformPromos.map(p => (
              <PlatformPromoCard
                key={p.id}
                promo={p}
                busy={followMutation.isPending}
                onToggleFollow={(promo) => followMutation.mutate({ id: promo.id, follow: !promo.followed })}
              />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center bg-white rounded-2xl border border-slate-200">
            <Tag className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Belum ada promo aktif dari platform.</p>
          </div>
        )}
      </div>

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
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tipe Promo</label>
                <select value={form.type} onChange={f('type')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30">
                  <option value="voucher">Voucher</option>
                  <option value="flash_sale">Flash Sale</option>
                </select>
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
