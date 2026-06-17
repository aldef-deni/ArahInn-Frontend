import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, Hotel, Building2, Save, Loader2, CheckCircle2, Info } from 'lucide-react'
import { adminWishlistApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'

const TYPES = [
  { key: 'hotel', label: 'Akomodasi (Hotel)', Icon: Hotel },
  { key: 'property', label: 'Jual–Beli Properti', Icon: Building2 },
]

export default function AdminWishlist() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data: cfg, isLoading } = useQuery({ queryKey: ['admin-wishlist-config'], queryFn: () => adminWishlistApi.getConfig().then(r => r.data?.data) })

  const [enabled, setEnabled] = useState(true)
  const [types, setTypes] = useState(['hotel', 'property'])
  const [maxItems, setMaxItems] = useState(0)

  useEffect(() => {
    if (!cfg) return
    setEnabled(cfg.enabled !== false)
    setTypes(Array.isArray(cfg.types) && cfg.types.length ? cfg.types : ['hotel', 'property'])
    setMaxItems(Number(cfg.maxItems) || 0)
  }, [cfg])

  const save = useMutation({
    mutationFn: () => adminWishlistApi.setConfig({ enabled, types, maxItems }).then(r => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-wishlist-config'] })
      qc.invalidateQueries({ queryKey: ['wishlist-config'] })
      toast({ title: res?.message || 'Konfigurasi wishlist disimpan.' })
    },
    onError: (e) => toast({ title: e?.response?.data?.message || 'Gagal menyimpan.' }),
  })

  const toggleType = (k) => setTypes(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])
  const canSave = types.length > 0

  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-brand" /></div>

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-rose-500 flex items-center justify-center shadow-md shadow-rose-200"><Heart className="w-5 h-5 text-white" fill="white" /></div>
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">Konfigurasi Wishlist</h1>
          <p className="text-sm text-slate-500">Atur fitur simpan hotel & properti favorit customer.</p>
        </div>
      </div>

      {/* Enable toggle */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm text-slate-900">Aktifkan Fitur Wishlist</p>
            <p className="text-xs text-slate-500 mt-0.5">Bila dimatikan, tombol wishlist disembunyikan & customer tak bisa menyimpan item.</p>
          </div>
          <button onClick={() => setEnabled(v => !v)} className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
            <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Allowed types */}
      <div className={`bg-white rounded-2xl border border-slate-200 p-5 ${!enabled && 'opacity-50 pointer-events-none'}`}>
        <p className="font-bold text-sm text-slate-900 mb-1">Tipe Item yang Bisa Disimpan</p>
        <p className="text-xs text-slate-500 mb-3.5">Pilih jenis item yang boleh ditambahkan customer ke wishlist.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TYPES.map(({ key, label, Icon }) => {
            const on = types.includes(key)
            return (
              <button key={key} onClick={() => toggleType(key)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-colors ${on ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${on ? 'bg-rose-500' : 'bg-slate-100'}`}><Icon className={`w-4.5 h-4.5 ${on ? 'text-white' : 'text-slate-400'}`} /></div>
                <span className={`text-sm font-semibold ${on ? 'text-rose-700' : 'text-slate-600'}`}>{label}</span>
                {on && <CheckCircle2 className="w-4 h-4 text-rose-500 ml-auto" />}
              </button>
            )
          })}
        </div>
        {types.length === 0 && <p className="text-xs text-red-500 mt-2">Pilih minimal satu tipe item.</p>}
      </div>

      {/* Max items */}
      <div className={`bg-white rounded-2xl border border-slate-200 p-5 ${!enabled && 'opacity-50 pointer-events-none'}`}>
        <p className="font-bold text-sm text-slate-900 mb-1">Batas Item per Customer</p>
        <p className="text-xs text-slate-500 mb-3.5">Jumlah maksimal item yang bisa disimpan tiap customer. Isi <strong>0</strong> untuk tanpa batas.</p>
        <div className="flex items-center gap-3">
          <input type="number" min={0} max={1000} value={maxItems}
            onChange={e => setMaxItems(Math.max(0, Math.min(1000, Number(e.target.value) || 0)))}
            className="w-32 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          <span className="text-sm text-slate-500">{maxItems === 0 ? 'Tanpa batas' : `Maks. ${maxItems} item`}</span>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3.5 bg-sky-50 border border-sky-100 rounded-xl">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <p className="text-xs text-sky-800 leading-relaxed">Perubahan langsung berlaku untuk semua customer. Item yang sudah tersimpan tetap aman meski tipe dinonaktifkan, namun tidak bisa menambah tipe yang dimatikan.</p>
      </div>

      <button onClick={() => save.mutate()} disabled={!canSave || save.isPending}
        className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-md shadow-brand/30">
        {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Konfigurasi
      </button>
    </div>
  )
}
