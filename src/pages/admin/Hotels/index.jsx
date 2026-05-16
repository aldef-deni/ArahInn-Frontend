import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminApi, userApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { getImageUrl } from '@/utils'
import { validateImageFiles } from '@/utils/imageValidation'
import {
  Plus, Search, Star, MapPin, Eye, Pencil, Trash2, X, Save,
  Building2, CheckCircle2, XCircle, Tag, ChevronLeft, ChevronRight,
  AlertTriangle, Hotel, ImagePlus,
} from 'lucide-react'

// ── Constants ────────────────────────────────────────────────────────────
const STATUS_MAP = {
  approved: { label: 'Disetujui', cls: 'bg-emerald-100 text-emerald-700' },
  pending:  { label: 'Menunggu',  cls: 'bg-amber-100  text-amber-700'  },
  blocked:  { label: 'Diblokir',  cls: 'bg-red-100    text-red-700'    },
}

const FACILITIES = [
  'WiFi Gratis','Parkir','Kolam Renang','Gym','Restoran','Spa',
  'AC','TV Kabel','Laundry','Room Service','Front Desk 24 Jam',
  'Lift','Meeting Room','Bar','Sauna','Concierge',
]

// ── StarPicker ───────────────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onClick={() => onChange(n === value ? null : n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none">
          <Star className={`w-6 h-6 transition-colors ${
            n <= (hover || value || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
          }`} />
        </button>
      ))}
      {value && (
        <span className="ml-1 self-center text-xs text-slate-500">{value} bintang</span>
      )}
    </div>
  )
}

// ── HotelFormDrawer ──────────────────────────────────────────────────────
function HotelFormDrawer({ hotel, onClose }) {
  const { toast } = useToast()
  const qc        = useQueryClient()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: hotel ? {
      name       : hotel.name,
      description: hotel.description || '',
      address    : hotel.address,
      city       : hotel.city,
      province   : hotel.province || '',
      status     : hotel.status || 'approved',
      ownerId    : hotel.ownerId || hotel.owner?.id || '',
    } : { status: 'approved' },
  })

  const [starRating,      setStarRating]      = useState(hotel?.starRating || null)
  const [facilities,      setFacilities]      = useState(hotel?.facilities || [])
  const [customFac,       setCustomFac]       = useState('')
  const [existingImages,  setExistingImages]  = useState(hotel?.images || [])
  const [newFiles,        setNewFiles]        = useState([])
  const [newPreviews,     setNewPreviews]     = useState([])

  const { data: ownersData } = useQuery({
    queryKey: ['owner-users'],
    queryFn : () => userApi.getAll({ role: 'owner', limit: 100 }).then(r => r.data.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d) => hotel ? adminApi.updateHotel(hotel.id, d) : adminApi.createHotel(d),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-hotels'] })
      qc.invalidateQueries({ queryKey: ['pending-hotels'] })
      toast({ title: hotel ? 'Hotel berhasil diperbarui.' : 'Hotel berhasil ditambahkan.' })
      onClose()
    },
    onError: (e) => toast({
      title      : 'Gagal menyimpan',
      description: e?.response?.data?.message || 'Terjadi kesalahan.',
      variant    : 'destructive',
    }),
  })

  const onSubmit = (data) => {
    const fd = new FormData()
    if (data.name)        fd.append('name',        data.name)
    if (data.description) fd.append('description', data.description)
    if (data.address)     fd.append('address',     data.address)
    if (data.city)        fd.append('city',        data.city)
    if (data.province)    fd.append('province',    data.province)
    if (data.status)      fd.append('status',      data.status)
    if (data.ownerId)     fd.append('owner_id',    data.ownerId)
    if (starRating)       fd.append('star_rating', starRating)
    facilities.forEach(f    => fd.append('facilities[]',      f))
    existingImages.forEach(u => fd.append('existing_images[]', u))
    newFiles.forEach(f       => fd.append('images[]',          f))
    saveMutation.mutate(fd)
  }

  const toggleFacility = (f) =>
    setFacilities(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])

  const addCustom = (e) => {
    if (e.key === 'Enter' && customFac.trim()) {
      e.preventDefault()
      if (!facilities.includes(customFac.trim())) setFacilities(p => [...p, customFac.trim()])
      setCustomFac('')
    }
  }

  const handleImageSelect = async (e) => {
    const allowed = ['jpg', 'jpeg', 'png', 'webp']
    const files   = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return

    const extErrors = []
    const extOk = files.filter(f => {
      const ext = f.name.split('.').pop().toLowerCase()
      if (!allowed.includes(ext)) {
        extErrors.push(`${f.name}: format harus .jpg .jpeg .png .webp`)
        return false
      }
      return true
    })

    const { validFiles, errors } = await validateImageFiles(extOk)
    const allErrors = [...extErrors, ...errors]
    if (allErrors.length) {
      toast({ title: 'Beberapa foto ditolak', description: allErrors.join('\n'), variant: 'destructive' })
    }
    if (!validFiles.length) return

    const remaining = 10 - existingImages.length - newFiles.length
    const accepted  = validFiles.slice(0, remaining)
    setNewFiles(p => [...p, ...accepted])
    setNewPreviews(p => [...p, ...accepted.map(f => URL.createObjectURL(f))])
  }

  const removeExisting = (url) => setExistingImages(p => p.filter(u => u !== url))
  const removeNew = (i) => {
    URL.revokeObjectURL(newPreviews[i])
    setNewFiles(p => p.filter((_, idx) => idx !== i))
    setNewPreviews(p => p.filter((_, idx) => idx !== i))
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-[520px] bg-white shadow-2xl flex flex-col h-full animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{hotel ? 'Edit Hotel' : 'Tambah Hotel'}</h2>
              <p className="text-xs text-slate-500">{hotel ? hotel.name : 'Isi detail properti baru'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form body — scrollable */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nama Hotel <span className="text-red-500">*</span>
              </label>
              <input {...register('name', { required: 'Nama hotel wajib diisi' })}
                placeholder="Grand Arahinn Hotel Jakarta"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Address + City */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Alamat <span className="text-red-500">*</span>
                </label>
                <input {...register('address', { required: 'Alamat wajib diisi' })}
                  placeholder="Jl. MH Thamrin No. 1"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Kota <span className="text-red-500">*</span>
                </label>
                <input {...register('city', { required: 'Kota wajib diisi' })}
                  placeholder="Jakarta"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
              </div>
            </div>

            {/* Province + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Provinsi</label>
                <input {...register('province')}
                  placeholder="DKI Jakarta"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                <select {...register('status')}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                  <option value="approved">Disetujui</option>
                  <option value="pending">Menunggu</option>
                  <option value="blocked">Diblokir</option>
                </select>
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Rating Bintang</label>
              <StarPicker value={starRating} onChange={setStarRating} />
            </div>

            {/* Owner */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Pemilik (Owner)</label>
              <select {...register('ownerId')}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                <option value="">-- Tidak Ada / Pilih Nanti --</option>
                {ownersData?.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Deskripsi</label>
              <textarea {...register('description')} rows={3}
                placeholder="Deskripsikan keunggulan hotel ini..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none" />
            </div>

            {/* Facilities */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fasilitas</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {FACILITIES.map(f => (
                  <button key={f} type="button" onClick={() => toggleFacility(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      facilities.includes(f)
                        ? 'bg-brand text-white border-brand shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-brand/40 hover:bg-brand/5'
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input value={customFac} onChange={e => setCustomFac(e.target.value)} onKeyDown={addCustom}
                  placeholder="Fasilitas lain, tekan Enter untuk menambah"
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
              {facilities.filter(f => !FACILITIES.includes(f)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {facilities.filter(f => !FACILITIES.includes(f)).map(f => (
                    <span key={f} className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg text-xs text-slate-700">
                      {f}
                      <button type="button" onClick={() => setFacilities(p => p.filter(x => x !== f))}
                        className="hover:text-red-500 transition-colors ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── Gambar Hotel ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Gambar Hotel</label>
                <span className="text-xs text-slate-400">
                  {existingImages.length + newFiles.length}/10 foto · .jpg .jpeg .png .webp · min. 1024 px · maks 5 MB
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Existing images */}
                {existingImages.map(url => (
                  <div key={url} className="relative group aspect-video rounded-xl overflow-hidden bg-slate-100">
                    <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeExisting(url)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}

                {/* New file previews */}
                {newPreviews.map((src, i) => (
                  <div key={i} className="relative group aspect-video rounded-xl overflow-hidden bg-slate-100">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-brand/80 text-white text-center text-[10px] font-semibold py-0.5">
                      Baru
                    </div>
                    <button type="button" onClick={() => removeNew(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}

                {/* Upload area */}
                {existingImages.length + newFiles.length < 10 && (
                  <label className="aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand/50 hover:bg-brand/5 transition-colors">
                    <ImagePlus className="w-6 h-6 text-slate-300 mb-1" />
                    <span className="text-xs text-slate-400 text-center leading-tight">
                      Tambah<br />foto
                    </span>
                    <input type="file" multiple accept=".jpg,.jpeg,.png,.webp" className="hidden"
                      onChange={handleImageSelect} />
                  </label>
                )}
              </div>

              {existingImages.length + newFiles.length === 0 && (
                <p className="text-xs text-slate-400 mt-2">Belum ada gambar. Upload minimal 1 foto untuk tampil di listing.</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors">
              Batal
            </button>
            <button type="submit" disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm">
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Menyimpan...' : hotel ? 'Simpan Perubahan' : 'Tambah Hotel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── DeleteConfirm ────────────────────────────────────────────────────────
function DeleteConfirm({ hotel, onClose }) {
  const { toast } = useToast()
  const qc        = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteHotel(hotel.id),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-hotels'] })
      toast({ title: `Hotel "${hotel.name}" berhasil dihapus.` })
      onClose()
    },
    onError: (e) => toast({
      title      : 'Gagal menghapus',
      description: e?.response?.data?.message || 'Terjadi kesalahan.',
      variant    : 'destructive',
    }),
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Hapus Hotel?</h3>
        <p className="text-sm text-slate-500 mb-1">
          <strong className="text-slate-700">{hotel.name}</strong>
        </p>
        <p className="text-xs text-slate-400 mb-6">
          Tindakan ini tidak dapat dibatalkan. Semua data terkait hotel ini akan ikut terhapus.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
            {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────
export default function AdminHotels() {
  const { toast } = useToast()
  const qc        = useQueryClient()

  const [search,      setSearch]      = useState('')
  const [status,      setStatus]      = useState('')
  const [page,        setPage]        = useState(1)
  const [drawer,      setDrawer]      = useState(null)  // null | 'create' | hotel object
  const [deleteTarget,setDeleteTarget]= useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-hotels', search, status, page],
    queryFn : () => adminApi.hotels({ search: search || undefined, status: status || undefined, page, limit: 15 }).then(r => r.data),
  })

  const { data: pendingList } = useQuery({
    queryKey: ['pending-hotels'],
    queryFn : () => adminApi.pendingHotels().then(r => r.data.data),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => adminApi.approveHotel(id),
    onSuccess : () => { qc.invalidateQueries({ queryKey: ['admin-hotels'] }); qc.invalidateQueries({ queryKey: ['pending-hotels'] }); toast({ title: 'Hotel disetujui.' }) },
    onError   : () => toast({ title: 'Gagal menyetujui.', variant: 'destructive' }),
  })

  const blockMutation = useMutation({
    mutationFn: (id) => adminApi.blockHotel(id),
    onSuccess : () => { qc.invalidateQueries({ queryKey: ['admin-hotels'] }); toast({ title: 'Hotel diblokir.' }) },
    onError   : () => toast({ title: 'Gagal memblokir.', variant: 'destructive' }),
  })

  const hotels     = data?.data || []
  const pagination = data?.pagination || {}
  const totalPages = pagination.totalPages || 1

  return (
    <div className="space-y-5">

      {/* Pending banner */}
      {pendingList?.length > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Hotel className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-amber-800">
              {pendingList.length} hotel menunggu persetujuan
            </p>
          </div>
          <button onClick={() => { setStatus('pending'); setPage(1) }}
            className="text-xs text-amber-700 font-semibold hover:underline whitespace-nowrap">
            Lihat Semua →
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cari nama / kota / alamat..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 min-w-[140px]">
          <option value="">Semua Status</option>
          <option value="approved">Disetujui</option>
          <option value="pending">Menunggu</option>
          <option value="blocked">Diblokir</option>
        </select>
        <span className="text-sm text-slate-400 hidden sm:block">
          {pagination.total ?? 0} hotel
        </span>
        <button onClick={() => setDrawer('create')}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm ml-auto">
          <Plus className="w-4 h-4" />
          Tambah Hotel
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Hotel', 'Kota', 'Bintang', 'Pemilik', 'Fasilitas', 'Status', 'Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(7).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="skeleton h-4 rounded-lg" />
                        </td>
                      ))}
                    </tr>
                  ))
                : hotels.map(hotel => (
                    <tr key={hotel.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Hotel */}
                      <td className="px-4 py-3.5 max-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                            {hotel.images?.[0]
                              ? <img src={getImageUrl(hotel.images[0])} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-xl">🏨</div>}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{hotel.name}</p>
                            <p className="text-xs text-slate-400 truncate">{hotel.address}</p>
                          </div>
                        </div>
                      </td>
                      {/* Kota */}
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-1 text-slate-600 whitespace-nowrap">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {hotel.city}
                        </span>
                      </td>
                      {/* Bintang */}
                      <td className="px-4 py-3.5">
                        {hotel.starRating ? (
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{hotel.starRating}</span>
                          </span>
                        ) : <span className="text-slate-300">–</span>}
                      </td>
                      {/* Pemilik */}
                      <td className="px-4 py-3.5">
                        {hotel.owner
                          ? <div>
                              <p className="font-medium text-slate-800 whitespace-nowrap">{hotel.owner.name}</p>
                              <p className="text-xs text-slate-400">{hotel.owner.email}</p>
                            </div>
                          : <span className="text-slate-300">–</span>}
                      </td>
                      {/* Fasilitas */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {hotel.facilities?.slice(0, 3).map(f => (
                            <span key={f} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs">{f}</span>
                          ))}
                          {hotel.facilities?.length > 3 && (
                            <span className="px-2 py-0.5 bg-brand/10 text-brand rounded-md text-xs">
                              +{hotel.facilities.length - 3}
                            </span>
                          )}
                          {!hotel.facilities?.length && <span className="text-slate-300 text-xs">–</span>}
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_MAP[hotel.status]?.cls}`}>
                          {STATUS_MAP[hotel.status]?.label || hotel.status}
                        </span>
                      </td>
                      {/* Aksi */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          {/* View */}
                          <a href={`/hotel/${hotel.id}`} target="_blank" rel="noreferrer"
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Lihat di website">
                            <Eye className="w-4 h-4" />
                          </a>
                          {/* Edit */}
                          <button onClick={() => setDrawer(hotel)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Edit hotel">
                            <Pencil className="w-4 h-4" />
                          </button>
                          {/* Approve */}
                          {hotel.status !== 'approved' && (
                            <button onClick={() => approveMutation.mutate(hotel.id)}
                              disabled={approveMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                              title="Setujui">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {/* Block */}
                          {hotel.status !== 'blocked' && (
                            <button onClick={() => blockMutation.mutate(hotel.id)}
                              disabled={blockMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-orange-50 text-slate-400 hover:text-orange-500 transition-colors"
                              title="Blokir">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {/* Delete */}
                          <button onClick={() => setDeleteTarget(hotel)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>

          {!isLoading && !hotels.length && (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">🏨</p>
              <p className="font-semibold text-slate-700">Tidak ada hotel ditemukan</p>
              <p className="text-sm text-slate-400 mt-1">Coba ubah filter pencarian atau tambah hotel baru.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-medium border transition-colors ${
                page === p
                  ? 'bg-brand text-white border-brand'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drawer: Create or Edit */}
      {drawer && (
        <HotelFormDrawer
          hotel={drawer === 'create' ? null : drawer}
          onClose={() => setDrawer(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirm hotel={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
    </div>
  )
}
