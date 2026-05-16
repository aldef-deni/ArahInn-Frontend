import { useOutletContext } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { useToast } from '@/hooks/use-toast'
import { getImageUrl } from '@/utils'
import { validateImageFiles } from '@/utils/imageValidation'
import { Save, MapPin, Star, UploadCloud, X, ImageIcon, Crown } from 'lucide-react'

const STARS = [1, 2, 3, 4, 5]
const MAX_IMAGES = 10
const CATEGORIES = ['Hotel', 'Apartment', 'Kosan', 'Guest House', 'Villa', 'Resort', 'Glamping']

export default function PropertiDetail() {
  const { hotel }  = useOutletContext()
  const { toast }  = useToast()
  const qc         = useQueryClient()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    category: '', name: '', description: '', address: '', city: '',
    province: '', country: 'Indonesia', star_rating: 3,
  })
  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages]           = useState([]) // { file, previewUrl }

  useEffect(() => {
    if (hotel) {
      setForm({
        category    : hotel.category    || '',
        name        : hotel.name        || '',
        description : hotel.description || '',
        address     : hotel.address     || '',
        city        : hotel.city        || '',
        province    : hotel.province    || '',
        country     : hotel.country     || 'Indonesia',
        star_rating : hotel.starRating  || 3,
      })
      setExistingImages(
        (hotel.images || []).map(img => (typeof img === 'object' ? img?.path : img)).filter(Boolean)
      )
      setNewImages([])
    }
  }, [hotel?.id])

  // Cleanup object URLs on unmount
  useEffect(() => () => {
    newImages.forEach(i => URL.revokeObjectURL(i.previewUrl))
  }, [newImages])

  const hasImageChanges =
    JSON.stringify(existingImages) !== JSON.stringify(hotel?.images || []) ||
    newImages.length > 0

  const mutation = useMutation({
    mutationFn: (payload) => hotelApi.update(hotel.id, payload),
    onSuccess: (res) => {
      const updatedImages = res?.data?.data?.images
      if (Array.isArray(updatedImages)) setExistingImages(updatedImages)
      setNewImages(prev => { prev.forEach(i => URL.revokeObjectURL(i.previewUrl)); return [] })
      qc.invalidateQueries({ queryKey: ['owner-my-hotels'] })
      toast({ title: 'Properti berhasil diperbarui.' })
    },
    onError: () => toast({ title: 'Gagal menyimpan.', variant: 'destructive' }),
  })

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = () => {
    if (hasImageChanges) {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.append(k, String(v))
      })
      existingImages.forEach(url => fd.append('existing_images[]', url))
      newImages.forEach(item => fd.append('images[]', item.file))
      mutation.mutate(fd)
    } else {
      mutation.mutate(form)
    }
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    const total = existingImages.length + newImages.length + files.length
    if (total > MAX_IMAGES) {
      toast({ title: `Maksimal ${MAX_IMAGES} foto`, variant: 'destructive' })
      return
    }
    const { validFiles, errors } = await validateImageFiles(files)
    if (errors.length) {
      toast({ title: 'Beberapa foto ditolak', description: errors.join('\n'), variant: 'destructive' })
    }
    if (!validFiles.length) return
    setNewImages(prev => [
      ...prev,
      ...validFiles.map(file => ({ file, previewUrl: URL.createObjectURL(file) })),
    ])
  }

  const removeExisting = (url) => setExistingImages(prev => prev.filter(u => u !== url))

  const removeNew = (previewUrl) => {
    setNewImages(prev => {
      const target = prev.find(i => i.previewUrl === previewUrl)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter(i => i.previewUrl !== previewUrl)
    })
  }

  const totalPhotos = existingImages.length + newImages.length

  if (!hotel) return (
    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
      Memuat data properti...
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Informasi Dasar ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-semibold text-slate-900">Informasi Dasar</h2>
          <p className="text-xs text-slate-400 mt-0.5">Nama, deskripsi, dan rating properti Anda</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Kategori</label>
            <select value={form.category} onChange={f('category')}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
              <option value="">-- Pilih Kategori --</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
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

      {/* ── Foto Hotel ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-500" /> Foto Hotel
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Foto pertama akan jadi thumbnail utama di halaman pencarian. Maks {MAX_IMAGES} foto.
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Min. resolusi 1024 px · maks. 5 MB per file.</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            totalPhotos >= MAX_IMAGES ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
          }`}>
            {totalPhotos}/{MAX_IMAGES}
          </span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">

            {/* Existing images */}
            {existingImages.map((url, idx) => (
              <div key={url} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                <img src={getImageUrl(url)} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                {idx === 0 && (
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Crown className="w-2.5 h-2.5" /> Utama
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeExisting(url)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* New images (preview) */}
            {newImages.map(({ previewUrl }, idx) => (
              <div key={previewUrl} className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-blue-300 bg-blue-50">
                <img src={previewUrl} alt="Preview baru" className="w-full h-full object-cover" />
                {existingImages.length === 0 && idx === 0 && (
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Crown className="w-2.5 h-2.5" /> Utama
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-blue-600/70 text-white text-[10px] text-center py-0.5 font-medium">
                  Belum tersimpan
                </div>
                <button
                  type="button"
                  onClick={() => removeNew(previewUrl)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Add button */}
            {totalPhotos < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center gap-1.5 transition-colors group"
              >
                <UploadCloud className="w-6 h-6 text-slate-300 group-hover:text-blue-400 transition-colors" />
                <span className="text-[10px] font-medium text-slate-400 group-hover:text-blue-500">Tambah Foto</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {totalPhotos === 0 && (
            <p className="text-center text-xs text-slate-400 mt-4">
              Belum ada foto. Upload foto untuk meningkatkan visibilitas properti Anda.
            </p>
          )}
        </div>
      </div>

      {/* ── Alamat & Lokasi ──────────────────────────────── */}
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

      <button onClick={handleSave} disabled={mutation.isPending}
        className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-sm">
        {mutation.isPending
          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <Save className="w-4 h-4" />}
        Simpan Perubahan
      </button>
    </div>
  )
}
