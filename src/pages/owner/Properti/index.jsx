import { useOutletContext } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { useToast } from '@/hooks/use-toast'
import { Save, MapPin, Star } from 'lucide-react'

const STARS = [1, 2, 3, 4, 5]

export default function PropertiDetail() {
  const { hotel }  = useOutletContext()
  const { toast }  = useToast()
  const qc         = useQueryClient()
  const [form, setForm] = useState({
    name: '', description: '', address: '', city: '',
    province: '', country: 'Indonesia', star_rating: 3,
  })

  useEffect(() => {
    if (hotel) setForm({
      name        : hotel.name        || '',
      description : hotel.description || '',
      address     : hotel.address     || '',
      city        : hotel.city        || '',
      province    : hotel.province    || '',
      country     : hotel.country     || 'Indonesia',
      star_rating : hotel.starRating  || 3,
    })
  }, [hotel])

  const mutation = useMutation({
    mutationFn: (d) => hotelApi.update(hotel.id, d),
    onSuccess : () => {
      qc.invalidateQueries(['owner-my-hotel'])
      toast({ title: 'Properti berhasil diperbarui.' })
    },
    onError: () => toast({ title: 'Gagal menyimpan.', variant: 'destructive' }),
  })

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  if (!hotel) return (
    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
      Memuat data properti...
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-semibold text-slate-900">Informasi Dasar</h2>
          <p className="text-xs text-slate-400 mt-0.5">Nama, deskripsi, dan rating properti Anda</p>
        </div>
        <div className="p-6 space-y-4">

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Nama Properti</label>
            <input value={form.name} onChange={f('name')}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Deskripsi</label>
            <textarea value={form.description} onChange={f('description')} rows={4}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Bintang</label>
            <div className="flex gap-2">
              {STARS.map(n => (
                <button key={n} type="button" onClick={() => setForm(p => ({ ...p, star_rating: n }))}
                  className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${
                    form.star_rating >= n ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-amber-200'
                  }`}>
                  <Star className={`w-5 h-5 ${form.star_rating >= n ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-500" /> Alamat & Lokasi
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Alamat Lengkap</label>
            <input value={form.address} onChange={f('address')}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Kota</label>
              <input value={form.city} onChange={f('city')}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Provinsi</label>
              <input value={form.province} onChange={f('province')}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}
        className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-sm">
        {mutation.isPending
          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <Save className="w-4 h-4" />}
        Simpan Perubahan
      </button>
    </div>
  )
}
