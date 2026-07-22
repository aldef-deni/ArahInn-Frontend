import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminApi, userApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { getImageUrl, hotelDetailUrl } from '@/utils'
import { getCustomerPortalUrl } from '@/utils/isExtranet'
import { validateImageFiles } from '@/utils/imageValidation'
import {
  Plus, Search, Star, MapPin, Eye, Pencil, Trash2, X, Save,
  Building2, CheckCircle2, XCircle, Tag, ChevronLeft, ChevronRight,
  AlertTriangle, Hotel, ImagePlus, DollarSign, Mail,
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
  const [voucherEmails,   setVoucherEmails]   = useState(
    Array.isArray(hotel?.voucherEmails) ? hotel.voucherEmails : []
  )

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
    // Email penerima voucher (selain email akun owner). Selalu dikirim agar bisa dikosongkan.
    fd.append('voucher_emails', JSON.stringify(
      voucherEmails.map(e => (e || '').trim()).filter(Boolean)
    ))
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
    const files   = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return

    // Validasi unified: ekstensi JPG/JPEG, max 5MB, min 800px (semua dilakukan di validateImageFiles)
    const { validFiles, errors } = await validateImageFiles(files)
    const allErrors = errors
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
              <h2 className="font-bold text-slate-900">{hotel ? 'Edit Akomodasi' : 'Tambah Akomodasi'}</h2>
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Pemilik (Owner) {!hotel && <span className="text-red-500">*</span>}
              </label>
              <select
                {...register('ownerId', !hotel ? {
                  required: 'Pemilik (Owner) wajib dipilih sebelum hotel baru disimpan.',
                } : {})}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand ${
                  errors.ownerId ? 'border-red-300' : 'border-slate-200'
                }`}>
                <option value="">
                  {hotel ? '-- Tidak Ada / Pilih Nanti --' : '-- Pilih Owner --'}
                </option>
                {ownersData?.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              {errors.ownerId && (
                <p className="text-red-500 text-xs mt-1">{errors.ownerId.message}</p>
              )}
              {!hotel && (
                <p className="text-xs text-slate-500 mt-1">
                  Hotel baru wajib terhubung ke akun owner agar bisa dikelola dan menerima booking.
                </p>
              )}
            </div>

            {/* Email Penerima Voucher */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                <Mail className="w-4 h-4 text-brand" /> Email Penerima Voucher
              </label>
              <div className="space-y-2">
                {voucherEmails.map((val, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="email"
                      value={val}
                      onChange={e => setVoucherEmails(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
                      placeholder="pengelola@contoh.com"
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                    <button type="button" title="Hapus email ini"
                      onClick={() => setVoucherEmails(prev => prev.filter((_, idx) => idx !== i))}
                      className="px-3 py-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setVoucherEmails(p => [...p, ''])}
                className="mt-2 flex items-center gap-1.5 text-sm text-brand hover:opacity-80 font-medium">
                <Plus className="w-3.5 h-3.5" /> Tambah email
              </button>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                E-voucher booking otomatis dikirim ke <strong>email akun owner</strong> dan
                <strong> semua email</strong> yang didaftarkan di sini. Berguna bila akun owner
                memakai email yang tidak dipantau (mis. <code>superadmin@</code>) — tambahkan email
                pengelola asli agar voucher pasti diterima.
              </p>
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
                    <input type="file" multiple accept="image/jpeg,image/jpg,.jpg,.jpeg" className="hidden"
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

// ── OwnerPickerModal ─────────────────────────────────────────────────────
// Tampil saat superadmin klik "Tambah Hotel". User wajib pilih owner dulu
// sebelum lanjut ke form multi-step DaftarHotel.
function OwnerPickerModal({ onClose }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [pickedId, setPickedId] = useState(null)

  const { data: owners, isLoading } = useQuery({
    queryKey: ['owner-users-picker'],
    queryFn : () => userApi.getAll({ role: 'owner', limit: 200 }).then(r => r.data?.data || []),
  })

  const filtered = (owners || []).filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleContinue = () => {
    if (!pickedId) return
    navigate(`/admin/hotels/new-full?owner_id=${pickedId}`)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900">Pilih Pemilik (Owner)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hotel baru wajib terhubung ke akun owner. Pilih owner terlebih dahulu sebelum lanjut.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama atau email owner..."
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </div>

        {/* Owner list */}
        <div className="px-3 pb-3 max-h-[320px] overflow-y-auto">
          {isLoading && (
            <p className="px-3 py-6 text-center text-sm text-slate-400">Memuat daftar owner...</p>
          )}
          {!isLoading && !filtered.length && (
            <p className="px-3 py-6 text-center text-sm text-slate-400">
              {search ? 'Owner tidak ditemukan.' : 'Belum ada owner terdaftar.'}
            </p>
          )}
          {filtered.map(u => {
            const picked = pickedId === u.id
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setPickedId(u.id)}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  picked ? 'bg-blue-50 border border-blue-200' : 'border border-transparent hover:bg-slate-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  picked ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {u.name?.[0]?.toUpperCase() || 'O'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{u.name}</p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                  picked ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                }`}>
                  {picked && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-white transition-colors">
            Batal
          </button>
          <button onClick={handleContinue} disabled={!pickedId}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
            Lanjut ke Form
          </button>
        </div>
      </div>
    </div>
  )
}

// ── CommissionModal ──────────────────────────────────────────────────────
// Modal untuk set/ubah persentase komisi per hotel.
function CommissionField({ label, required, value, onChange, placeholder, autoFocus, hint }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input type="number" min={0} max={100} step="0.01" value={value}
          onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
          className="w-full px-4 py-3 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
      </div>
      {hint && <p className="text-[11px] text-slate-500 mt-1.5">{hint}</p>}
    </div>
  )
}

// Komisi DIPOTONG dari setoran owner (owner terima harga × (1 − komisi% − PPh 2%)).
// Tidak ditambahkan ke harga customer — biaya customer = setting Biaya Layanan Akomodasi.
function CommissionModal({ hotel, onClose }) {
  const { toast } = useToast()
  const qc        = useQueryClient()

  const PPH = 2
  const [daily,   setDaily]   = useState(String(hotel.commissionPercent ?? hotel.commission_percent ?? 10))
  const [weekly,  setWeekly]  = useState(hotel.commissionPercentWeekly  != null ? String(hotel.commissionPercentWeekly)  : '')
  const [monthly, setMonthly] = useState(hotel.commissionPercentMonthly != null ? String(hotel.commissionPercentMonthly) : '')

  const numOrNull = (v) => (v === '' || v == null) ? null : Number(v)
  const inRange   = (v) => v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 100)
  const dailyNum  = Number(daily)
  const dailyValid = Number.isFinite(dailyNum) && dailyNum >= 0 && dailyNum <= 100
  const isValid   = dailyValid && inRange(weekly) && inRange(monthly)

  const mutation = useMutation({
    mutationFn: () => adminApi.updateHotelCommission(hotel.id, { daily: dailyNum, weekly: numOrNull(weekly), monthly: numOrNull(monthly) }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-hotels'] })
      toast({ title: res?.data?.message || 'Komisi berhasil disimpan.' })
      onClose()
    },
    onError: (e) => toast({
      title: 'Gagal menyimpan komisi',
      description: e?.response?.data?.message || 'Terjadi kesalahan.',
      variant: 'destructive',
    }),
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900">Atur Komisi</h3>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{hotel.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Harian (wajib) */}
          <CommissionField
            label="Komisi Harian" required value={daily} onChange={setDaily} placeholder="10" autoFocus
            hint="Komisi untuk pemesanan harian. Wajib diisi."
          />
          {/* Mingguan & Bulanan (opsional) */}
          <div className="grid grid-cols-2 gap-3">
            <CommissionField label="Komisi Mingguan" value={weekly} onChange={setWeekly} placeholder="kosong = 0%"
              hint="Opsional. Kosong = tanpa komisi." />
            <CommissionField label="Komisi Bulanan" value={monthly} onChange={setMonthly} placeholder="kosong = 0%"
              hint="Opsional. Kosong = tanpa komisi." />
          </div>

          {/* Breakdown info — komisi DIPOTONG dari setoran owner; sistem menambah PPh 2% */}
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm">
            <p className="font-bold text-emerald-900 mb-2">Dampak ke setoran owner (sudah termasuk PPh 2%):</p>
            <div className="space-y-1.5 text-emerald-800">
              {[['Harian', daily], ['Mingguan', weekly], ['Bulanan', monthly]].map(([lbl, v]) => {
                const set = v !== '' && Number.isFinite(Number(v))
                const eff = set ? Number(v) + PPH : 0
                return (
                  <div key={lbl} className="flex justify-between">
                    <span>{lbl}</span>
                    <span className="font-semibold">
                      {set
                        ? <>komisi {Number(v).toFixed(2)}% + PPh {PPH}% = <b>{eff.toFixed(2)}%</b> · owner {(100 - eff).toFixed(2)}%</>
                        : <span className="text-emerald-700/60">tanpa komisi</span>}
                    </span>
                  </div>
                )
              })}
              <p className="text-[11px] text-emerald-700/80 pt-1.5 leading-relaxed border-t border-emerald-200 mt-1.5">
                Komisi <b>dipotong dari setoran owner</b> (bukan ditambah ke harga customer); <b>PPh 2%</b> otomatis ditambahkan sistem.
                Contoh harian {dailyValid ? `${dailyNum.toFixed(0)}%` : '15%'}: harga Rp 500.000 → owner terima Rp {dailyValid ? (500000 * (100 - dailyNum - PPH) / 100).toLocaleString('id-ID') : '415.000'}.
                Biaya customer ("Pajak &amp; Others") diatur terpisah di <b>Pengaturan → Biaya Layanan Akomodasi</b>.
              </p>
            </div>
          </div>

          {!isValid && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Setiap persentase harus antara 0 dan 100 (harian wajib diisi).
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-white transition-colors">
            Batal
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {mutation.isPending ? 'Menyimpan...' : <>
              <Save className="w-4 h-4" /> Simpan Komisi
            </>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── BulkDeleteConfirm (HARD DELETE — khusus akun aldeftech@gmail.com) ──────
function BulkDeleteConfirm({ count, onClose, onConfirm, isLoading }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Hapus Permanen {count} Akomodasi?</h3>
        <p className="text-xs text-slate-400 mb-6">
          Tindakan ini <strong className="text-red-600">tidak dapat dibatalkan</strong>. Seluruh data terkait
          (kamar, booking, riwayat pembayaran, chat, ulasan) akan ikut terhapus permanen dari database.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50">
            Batal
          </button>
          <button onClick={onConfirm} disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
            {isLoading ? 'Menghapus...' : 'Ya, Hapus Permanen'}
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
  const navigate  = useNavigate()
  const { user }  = useAuthStore()
  // Hapus akomodasi (HARD DELETE) KHUSUS akun ini — gate keras juga di backend.
  const isAldeftech = (user?.email || '').trim().toLowerCase() === 'aldeftech@gmail.com'

  const [search,      setSearch]      = useState('')
  const [status,      setStatus]      = useState('')
  const [page,        setPage]        = useState(1)
  const [drawer,      setDrawer]      = useState(null)  // null | hotel object (untuk quick edit drawer lama, opsional)
  const [ownerPickerOpen, setOwnerPickerOpen] = useState(false)
  const [commissionTarget, setCommissionTarget] = useState(null) // hotel object
  const [selectedIds, setSelectedIds] = useState([])
  const [showBulkDelete, setShowBulkDelete] = useState(false)

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

  // ── Hapus massal (khusus aldeftech@gmail.com) ───────────────
  // Reset pilihan saat ganti halaman / filter (hindari hapus lintas-konteks tak sengaja).
  useEffect(() => { setSelectedIds([]) }, [page, search, status])

  const allOnPageSelected = hotels.length > 0 && hotels.every(h => selectedIds.includes(h.id))
  const toggleSelectAll = () =>
    setSelectedIds(allOnPageSelected ? [] : hotels.map(h => h.id))
  const toggleSelect = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const bulkDeleteMutation = useMutation({
    mutationFn: () => adminApi.bulkDeleteHotels(selectedIds),
    onSuccess : (r) => {
      qc.invalidateQueries({ queryKey: ['admin-hotels'] })
      qc.invalidateQueries({ queryKey: ['pending-hotels'] })
      toast({ title: r?.data?.message || `Berhasil menghapus ${selectedIds.length} akomodasi.` })
      setSelectedIds([])
      setShowBulkDelete(false)
    },
    onError: (e) => toast({
      title      : 'Gagal menghapus',
      description: e?.response?.data?.message || 'Terjadi kesalahan.',
      variant    : 'destructive',
    }),
  })

  const COL_COUNT = isAldeftech ? 9 : 8

  // ── Kolom yang bisa di-resize (tarik pembatas kiri/kanan agar fleksibel) ──
  // w = lebar awal, min = lebar minimum (mentok di nama kolom, tak menimpa teks).
  const COLS = useMemo(() => ([
    ...(isAldeftech ? [{ key: 'check', label: '', w: 44, min: 44, fixed: true }] : []),
    { key: 'name',       label: 'Akomodasi', w: 340, min: 180 },
    { key: 'city',       label: 'Kota',      w: 150, min: 110 },
    { key: 'star',       label: 'Bintang',   w: 100, min: 100 },
    { key: 'cat',        label: 'Kategori',  w: 130, min: 120 },
    { key: 'owner',      label: 'Pemilik',   w: 220, min: 130 },
    { key: 'status',     label: 'Status',    w: 120, min: 100 },
    { key: 'commission', label: 'Komisi',    w: 150, min: 120 },
    { key: 'action',     label: 'Aksi',      w: 150, min: 110 },
  ]), [isAldeftech])
  const [colW, setColW] = useState({})
  const wOf = (c) => Math.max(c.min ?? 60, colW[c.key] ?? c.w)
  const dragRef = useRef(null)
  const startResize = (col, e) => {
    e.preventDefault(); e.stopPropagation()
    const th = e.currentTarget.closest('th')
    dragRef.current = { key: col.key, min: col.min ?? 60, startX: e.clientX, startW: th ? th.offsetWidth : col.w }
    const onMove = (ev) => {
      if (!dragRef.current) return
      // Tak boleh lebih kecil dari min → divider "mentok" di nama kolom, bukan menimpa.
      const w = Math.max(dragRef.current.min, dragRef.current.startW + (ev.clientX - dragRef.current.startX))
      setColW(prev => ({ ...prev, [dragRef.current.key]: w }))
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''; document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

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
            placeholder="Cari ID / nama / kota / alamat..."
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
          {pagination.total ?? 0} akomodasi
        </span>
        <button onClick={() => setOwnerPickerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm ml-auto">
          <Plus className="w-4 h-4" />
          Tambah Akomodasi
        </button>
      </div>

      {/* Bulk delete bar (khusus aldeftech@gmail.com) */}
      {isAldeftech && selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
          <p className="text-sm font-medium text-red-700">
            {selectedIds.length} akomodasi dipilih
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedIds([])}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white rounded-lg transition-colors">
              Batal pilih
            </button>
            <button onClick={() => setShowBulkDelete(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
              <Trash2 className="w-4 h-4" />
              Hapus Permanen
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="text-sm [&_th]:border-r [&_th]:border-slate-200 [&_td]:border-r [&_td]:border-slate-100 [&_th:last-child]:border-r-0 [&_td:last-child]:border-r-0"
            style={{ tableLayout: 'fixed', width: COLS.reduce((s, c) => s + wOf(c), 0), minWidth: '100%' }}
          >
            <colgroup>
              {COLS.map(c => <col key={c.key} style={{ width: wOf(c) }} />)}
            </colgroup>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {COLS.map(c => (
                  <th key={c.key} className="relative px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap select-none">
                    {c.key === 'check'
                      ? <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                          title="Pilih semua di halaman ini" />
                      : c.label}
                    {!c.fixed && (
                      // Zona tarik di garis pembatas (straddle border kanan). Tak menimpa teks
                      // karena kolom tak bisa lebih kecil dari min-width-nya.
                      <span
                        onMouseDown={(e) => startResize(c, e)}
                        title="Tarik untuk mengubah lebar kolom"
                        className="group/resize absolute top-0 -right-1.5 z-10 flex h-full w-3 cursor-col-resize items-stretch justify-center"
                      >
                        <span className="w-0.5 rounded bg-transparent transition-colors group-hover/resize:bg-brand" />
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(COL_COUNT).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="skeleton h-4 rounded-lg" />
                        </td>
                      ))}
                    </tr>
                  ))
                : hotels.map(hotel => (
                    <tr key={hotel.id} className={`hover:bg-slate-50/70 transition-colors group ${selectedIds.includes(hotel.id) ? 'bg-red-50/50' : ''}`}>
                      {/* Checkbox (khusus aldeftech) */}
                      {isAldeftech && (
                        <td className="px-4 py-3.5">
                          <input type="checkbox" checked={selectedIds.includes(hotel.id)} onChange={() => toggleSelect(hotel.id)}
                            className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer" />
                        </td>
                      )}
                      {/* Akomodasi */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                            {hotel.images?.[0]
                              ? <img src={getImageUrl(hotel.images[0])} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-xl">🏨</div>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-mono text-slate-400 leading-tight truncate">ID {hotel.propertyCode || `#${hotel.id}`}</p>
                            <p className="font-semibold text-slate-900 truncate" title={hotel.name}>{hotel.name}</p>
                            <p className="text-xs text-slate-400 truncate" title={hotel.address}>{hotel.address}</p>
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
                      {/* Kategori */}
                      <td className="px-4 py-3.5">
                        {hotel.category
                          ? <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 whitespace-nowrap">
                              {hotel.category}
                            </span>
                          : <span className="text-slate-300">–</span>}
                      </td>
                      {/* Pemilik */}
                      <td className="px-4 py-3.5">
                        {hotel.owner
                          ? <div className="min-w-0">
                              <p className="font-medium text-slate-800 truncate" title={hotel.owner.name}>{hotel.owner.name}</p>
                              <p className="text-xs text-slate-400 truncate" title={hotel.owner.email}>{hotel.owner.email}</p>
                            </div>
                          : <span className="text-slate-300">–</span>}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_MAP[hotel.status]?.cls}`}>
                          {STATUS_MAP[hotel.status]?.label || hotel.status}
                        </span>
                      </td>
                      {/* Komisi */}
                      <td className="px-4 py-3.5">
                        {hotel.commissionPercent != null ? (
                          <div>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                              {Number(hotel.commissionPercent).toFixed(2)}%
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">
                              + PPh 2% · owner {(100 - Number(hotel.commissionPercent) - 2).toFixed(2)}%
                            </p>
                            {(hotel.commissionPercentWeekly != null || hotel.commissionPercentMonthly != null) && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {hotel.commissionPercentWeekly != null && <>M: {Number(hotel.commissionPercentWeekly).toFixed(0)}% </>}
                                {hotel.commissionPercentMonthly != null && <>B: {Number(hotel.commissionPercentMonthly).toFixed(0)}%</>}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 italic">belum diset</span>
                        )}
                      </td>
                      {/* Aksi */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          {/* View */}
                          <a href={`${getCustomerPortalUrl()}${hotelDetailUrl(hotel)}`} target="_blank" rel="noreferrer"
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Lihat di website">
                            <Eye className="w-4 h-4" />
                          </a>
                          {/* Edit (full multi-step form) */}
                          <button onClick={() => navigate(`/admin/hotels/${hotel.id}/edit`)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Edit hotel (form lengkap)">
                            <Pencil className="w-4 h-4" />
                          </button>
                          {/* Atur Komisi */}
                          <button onClick={() => setCommissionTarget(hotel)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Atur komisi platform">
                            <DollarSign className="w-4 h-4" />
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
                          {/* Hapus permanen via checkbox (khusus aldeftech) — superadmin biasa tidak bisa hapus */}
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

      {/* Drawer: Edit cepat (legacy — sekarang hanya dipakai kalau ada caller lain) */}
      {drawer && drawer !== 'create' && (
        <HotelFormDrawer
          hotel={drawer}
          onClose={() => setDrawer(null)}
        />
      )}

      {/* Owner picker modal — wajib dilewati sebelum tambah hotel baru */}
      {ownerPickerOpen && (
        <OwnerPickerModal onClose={() => setOwnerPickerOpen(false)} />
      )}

      {/* Commission modal */}
      {commissionTarget && (
        <CommissionModal
          hotel={commissionTarget}
          onClose={() => setCommissionTarget(null)}
        />
      )}

      {/* Bulk delete confirm (khusus aldeftech@gmail.com) */}
      {showBulkDelete && (
        <BulkDeleteConfirm
          count={selectedIds.length}
          onClose={() => setShowBulkDelete(false)}
          onConfirm={() => bulkDeleteMutation.mutate()}
          isLoading={bulkDeleteMutation.isPending}
        />
      )}
    </div>
  )
}
