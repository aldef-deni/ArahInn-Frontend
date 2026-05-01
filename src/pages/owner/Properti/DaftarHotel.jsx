import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { useToast } from '@/hooks/use-toast'
import { Building2, MapPin, Star, Save, CheckCircle2, Clock } from 'lucide-react'

const STARS = [1, 2, 3, 4, 5]

const CITIES = [
  'Jakarta','Surabaya','Bandung','Medan','Semarang','Makassar',
  'Yogyakarta','Palembang','Bali','Lombok','Manado','Balikpapan',
  'Batam','Pekanbaru','Banjarmasin',
]

export default function DaftarHotel() {
  const { toast }  = useToast()
  const navigate   = useNavigate()
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', address: '',
    city: '', province: '', country: 'Indonesia', star_rating: 3,
  })

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      return hotelApi.create(fd)
    },
    onSuccess: () => {
      setSuccess(true)
      toast({ title: 'Hotel berhasil didaftarkan!', description: 'Menunggu persetujuan Superadmin.' })
    },
    onError: (e) => toast({
      title: 'Gagal mendaftarkan hotel',
      description: e?.response?.data?.message || 'Terjadi kesalahan.',
      variant: 'destructive',
    }),
  })

  if (success) return (
    <div className="max-w-lg mx-auto mt-10">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Pendaftaran Terkirim!</h2>
        <p className="text-sm text-slate-500 mb-1">
          Hotel <span className="font-semibold text-slate-800">{form.name}</span> berhasil didaftarkan.
        </p>
        <p className="text-sm text-slate-400 mb-8">
          Status saat ini <span className="font-semibold text-amber-600">Menunggu Persetujuan</span>.<br />
          Pihak Manajemen ArahInn akan meninjau dan menginformasikan status properti Anda.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setSuccess(false); setForm({ name:'',description:'',address:'',city:'',province:'',country:'Indonesia',star_rating:3 }) }}
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            Daftarkan Hotel Lain
          </button>
          <button onClick={() => navigate('/owner')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <Clock className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
        <span>Hotel yang baru didaftarkan akan berstatus <strong>Pending</strong> hingga disetujui oleh Superadmin.</span>
      </div>

      {/* Form Informasi Dasar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-semibold text-slate-900">Informasi Properti</h2>
          <p className="text-xs text-slate-400 mt-0.5">Lengkapi data dasar hotel yang ingin didaftarkan</p>
        </div>
        <div className="p-6 space-y-5">

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Nama Hotel / Penginapan <span className="text-red-500">*</span>
            </label>
            <input value={form.name} onChange={f('name')} placeholder="contoh: Grand Arahinn Hotel Jakarta"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Deskripsi
            </label>
            <textarea value={form.description} onChange={f('description')} rows={3}
              placeholder="Ceritakan keunggulan properti Anda..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Rating Bintang
            </label>
            <div className="flex gap-2">
              {STARS.map(s => (
                <button key={s} type="button" onClick={() => setForm(p => ({ ...p, star_rating: s }))}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    form.star_rating === s
                      ? 'bg-amber-400 border-amber-400 text-white shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50'
                  }`}>
                  <Star className="w-3.5 h-3.5" /> {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Form Lokasi */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" /> Lokasi
          </h2>
        </div>
        <div className="p-6 space-y-4">

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Alamat Lengkap <span className="text-red-500">*</span>
            </label>
            <input value={form.address} onChange={f('address')} placeholder="Jl. Contoh No. 1, ..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Kota <span className="text-red-500">*</span>
              </label>
              <input value={form.city} onChange={f('city')} placeholder="Jakarta"
                list="cities-list"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              <datalist id="cities-list">
                {CITIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Provinsi</label>
              <input value={form.province} onChange={f('province')} placeholder="DKI Jakarta"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Negara</label>
            <input value={form.country} onChange={f('country')}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <button type="button" onClick={() => navigate('/owner')}
          className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
          Batal
        </button>
        <button
          onClick={() => {
            if (!form.name.trim() || !form.address.trim() || !form.city.trim()) {
              toast({ title: 'Lengkapi data wajib', description: 'Nama, alamat, dan kota harus diisi.', variant: 'destructive' })
              return
            }
            mutation.mutate()
          }}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
          <Save className="w-4 h-4" />
          {mutation.isPending ? 'Mendaftarkan...' : 'Daftarkan Hotel'}
        </button>
      </div>
    </div>
  )
}
