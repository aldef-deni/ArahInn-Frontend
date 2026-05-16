import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { propertyApi } from '@/services/propertyApi'
import { formatRupiah, getImageUrl } from '@/utils'
import { validateImageFiles } from '@/utils/imageValidation'
import { useToast } from '@/hooks/use-toast'
import {
  Plus, Building2, MapPin, Tag, Pencil, Trash2, X, Save,
  CheckCircle2, Clock, XCircle, Image, Phone, Mail, Upload,
  AlertTriangle, Eye,
} from 'lucide-react'

const CATEGORIES = ['Hotel', 'Apartment', 'Kosan', 'Guest House', 'Villa', 'Resort']
const FACILITIES_LIST = [
  'AC', 'WiFi', 'Kolam Renang', 'Parkir', 'Gym', 'Restoran',
  'Laundry', 'CCTV', 'Security 24 Jam', 'Generator Listrik',
  'Lift', 'Rooftop', 'Taman', 'Dapur', 'Balkon',
]

const STATUS_META = {
  approved : { label: 'Disetujui', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  pending  : { label: 'Menunggu Review', cls: 'bg-amber-100 text-amber-700', icon: Clock },
  rejected : { label: 'Ditolak', cls: 'bg-red-100 text-red-600', icon: XCircle },
}

const CERT_OPTIONS = ['SHM', 'HGB', 'Strata', 'Lainnya']

const INIT_FORM = {
  title: '', description: '', category: '', listingType: 'sell',
  price: '', priceNegotiable: false, address: '', city: '', province: '',
  landArea: '', buildingArea: '', bedrooms: '', bathrooms: '',
  certificate: '', certificateCustom: '', facilities: [], contactPhone: '', contactEmail: '',
}

function FormDrawer({ listing, onClose }) {
  const { toast } = useToast()
  const qc        = useQueryClient()
  const fileRef   = useRef(null)
  const isEdit    = !!listing

  const [form, setForm] = useState(() => {
    if (!isEdit) return { ...INIT_FORM }
    const rawCert = listing.certificate || ''
    const isCustom = rawCert && !['SHM', 'HGB', 'Strata', 'Lainnya'].includes(rawCert)
    return {
      title            : listing.title || '',
      description      : listing.description || '',
      category         : listing.category || '',
      listingType      : listing.listingType || 'sell',
      price            : listing.price || '',
      priceNegotiable  : listing.priceNegotiable || false,
      address          : listing.address || '',
      city             : listing.city || '',
      province         : listing.province || '',
      landArea         : listing.landArea || '',
      buildingArea     : listing.buildingArea || '',
      bedrooms         : listing.bedrooms ?? '',
      bathrooms        : listing.bathrooms ?? '',
      certificate      : isCustom ? 'Lainnya' : rawCert,
      certificateCustom: isCustom ? rawCert : '',
      facilities       : listing.facilities || [],
      contactPhone     : listing.contactPhone || '',
      contactEmail     : listing.contactEmail || '',
    }
  })

  const [newImages, setNewImages]     = useState([])
  const [existingImgs, setExistingImgs] = useState(listing?.images || [])
  const [previews, setPreviews]       = useState([])

  const f = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(p => ({ ...p, [k]: val }))
  }

  const toggleFacility = (fac) => {
    setForm(p => ({
      ...p,
      facilities: p.facilities.includes(fac)
        ? p.facilities.filter(x => x !== fac)
        : [...p.facilities, fac],
    }))
  }

  const onFileChange = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    const { validFiles, errors } = await validateImageFiles(files)
    if (errors.length) {
      toast({ title: 'Beberapa foto ditolak', description: errors.join('\n'), variant: 'destructive' })
    }
    if (!validFiles.length) return
    setNewImages(prev => [...prev, ...validFiles])
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => setPreviews(prev => [...prev, ev.target.result])
      reader.readAsDataURL(file)
    })
  }

  const removeExisting = (idx) => setExistingImgs(p => p.filter((_, i) => i !== idx))
  const removeNew      = (idx) => {
    setNewImages(p => p.filter((_, i) => i !== idx))
    setPreviews(p => p.filter((_, i) => i !== idx))
  }

  const toSnake = (key) => key.replace(/([A-Z])/g, '_$1').toLowerCase()

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      const certValue = form.certificate === 'Lainnya' ? form.certificateCustom : form.certificate
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'certificateCustom') return
        const sk = toSnake(k)
        if (sk === 'facilities') {
          v.forEach(fac => fd.append('facilities[]', fac))
        } else if (sk === 'certificate') {
          if (certValue) fd.append('certificate', certValue)
        } else if (v !== '' && v !== null && v !== undefined) {
          fd.append(sk, typeof v === 'boolean' ? (v ? 1 : 0) : v)
        }
      })
      newImages.forEach(img => fd.append('images[]', img))
      if (isEdit) {
        existingImgs.forEach(url => fd.append('existing_images[]', url))
        return propertyApi.update(listing.id, fd)
      }
      return propertyApi.create(fd)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-my-listings'] })
      toast({ title: isEdit ? 'Listing berhasil diperbarui.' : 'Listing berhasil dikirim, menunggu persetujuan.' })
      onClose()
    },
    onError: (e) => toast({
      title      : 'Gagal menyimpan',
      description: e?.response?.data?.message || 'Terjadi kesalahan.',
      variant    : 'destructive',
    }),
  })

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{isEdit ? 'Edit Listing' : 'Daftarkan Properti'}</h2>
              <p className="text-xs text-slate-500">{isEdit ? 'Perbarui data listing Anda' : 'Isi data properti yang ingin dijual/disewakan'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Judul Listing *</label>
            <input value={form.title} onChange={f('title')}
              placeholder="contoh: Hotel Bintang 3 Strategis di Pusat Kota Bandung"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>

          {/* Category + Listing Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kategori *</label>
              <select value={form.category} onChange={f('category')}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">Pilih...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipe Listing *</label>
              <select value={form.listingType} onChange={f('listingType')}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="sell">Dijual</option>
                <option value="rent">Disewakan</option>
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Harga (Rp) *</label>
            <input type="number" value={form.price} onChange={f('price')}
              placeholder="Contoh: 2500000000"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" checked={form.priceNegotiable} onChange={f('priceNegotiable')}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer" />
              <span className="text-sm text-slate-600">Harga dapat dinegosiasikan</span>
            </label>
          </div>

          {/* City + Province */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kota *</label>
              <input value={form.city} onChange={f('city')}
                placeholder="contoh: Bandung"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Provinsi</label>
              <input value={form.province} onChange={f('province')}
                placeholder="Jawa Barat"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alamat Lengkap</label>
            <input value={form.address} onChange={f('address')}
              placeholder="Jl. Sudirman No. 10, RT 05/RW 03..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>

          {/* Areas + Rooms */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Luas Tanah (m²)</label>
              <input type="number" value={form.landArea} onChange={f('landArea')}
                placeholder="200"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Luas Bangunan (m²)</label>
              <input type="number" value={form.buildingArea} onChange={f('buildingArea')}
                placeholder="150"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kamar Tidur</label>
              <input type="number" value={form.bedrooms} onChange={f('bedrooms')}
                placeholder="5"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kamar Mandi</label>
              <input type="number" value={form.bathrooms} onChange={f('bathrooms')}
                placeholder="3"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>

          {/* Certificate */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jenis Sertifikat</label>
            <select value={form.certificate} onChange={f('certificate')}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
              <option value="">Tidak Ada / Belum Ada</option>
              {CERT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {form.certificate === 'Lainnya' && (
              <input
                value={form.certificateCustom}
                onChange={f('certificateCustom')}
                placeholder="Tuliskan jenis sertifikat..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 mt-2"
              />
            )}
          </div>

          {/* Facilities */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Fasilitas</label>
            <div className="grid grid-cols-2 gap-2">
              {FACILITIES_LIST.map(fac => (
                <label key={fac} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox"
                    checked={form.facilities.includes(fac)}
                    onChange={() => toggleFacility(fac)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer" />
                  <span className="text-sm text-slate-700">{fac}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">No. HP Kontak</label>
              <input value={form.contactPhone} onChange={f('contactPhone')}
                placeholder="+6281234567890"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Kontak</label>
              <input type="email" value={form.contactEmail} onChange={f('contactEmail')}
                placeholder="jual@email.com"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deskripsi</label>
            <textarea value={form.description} onChange={f('description')}
              rows={4}
              placeholder="Jelaskan kondisi, keunggulan, dan detail properti Anda..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Foto Properti</label>
            <p className="text-xs text-slate-400 mb-2">Min. resolusi 1024 px · maks. 5 MB per file.</p>

            {/* Existing images */}
            {existingImgs.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {existingImgs.map((url, i) => (
                  <div key={i} className="relative w-20 h-16 rounded-xl overflow-hidden group">
                    <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeExisting(i)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New image previews */}
            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-20 h-16 rounded-xl overflow-hidden group border-2 border-blue-300">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeNew(i)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={onFileChange} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center">
              <Upload className="w-4 h-4" /> Pilih Foto (maks. 10)
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.title || !form.category || !form.price || !form.city}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {mutation.isPending ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
            ) : (
              <><Save className="w-4 h-4" /> {isEdit ? 'Simpan Perubahan' : 'Kirim Listing'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ listing, onConfirm, onClose, isLoading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-center font-bold text-slate-900 mb-1">Hapus Listing?</h3>
        <p className="text-center text-sm text-slate-500 mb-5">
          Listing "<span className="font-semibold">{listing.title}</span>" akan dihapus permanen.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button onClick={onConfirm} disabled={isLoading}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors">
            {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OwnerPropertySale() {
  const { toast } = useToast()
  const qc        = useQueryClient()
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [editListing, setEditListing] = useState(null)
  const [deleteListing, setDeleteListing] = useState(null)
  const [imgErr, setImgErr]           = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['owner-my-listings'],
    queryFn : () => propertyApi.myListings().then(r => r.data?.data || []),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => propertyApi.destroy(id),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['owner-my-listings'] })
      toast({ title: 'Listing berhasil dihapus.' })
      setDeleteListing(null)
    },
    onError: (e) => toast({
      title: 'Gagal menghapus',
      description: e?.response?.data?.message || 'Terjadi kesalahan.',
      variant: 'destructive',
    }),
  })

  const openEdit = (listing) => { setEditListing(listing); setDrawerOpen(true) }
  const closeDrawer = () => { setDrawerOpen(false); setEditListing(null); setImgErr({}) }

  const listings = data || []

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Jual Properti</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola listing properti yang ingin Anda jual atau sewakan</p>
        </div>
        <button
          onClick={() => { setEditListing(null); setDrawerOpen(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Daftarkan Properti
        </button>
      </div>

      {/* Listings */}
      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 flex gap-4">
              <div className="skeleton w-32 h-24 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-2/3 rounded" />
                <div className="skeleton h-4 w-1/3 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-blue-300" />
          </div>
          <p className="font-semibold text-slate-700 text-lg mb-1">Belum ada listing</p>
          <p className="text-slate-400 text-sm mb-5">Daftarkan properti Anda untuk mulai</p>
          <button
            onClick={() => { setEditListing(null); setDrawerOpen(true) }}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            Daftarkan Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map(listing => {
            const s   = STATUS_META[listing.status] || STATUS_META.pending
            const img = listing.images?.[0]

            return (
              <div key={listing.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex gap-0">
                  {/* Image */}
                  <div className="w-36 sm:w-48 shrink-0 bg-slate-100 relative overflow-hidden">
                    {img && !imgErr[img] ? (
                      <img src={getImageUrl(img)} alt={listing.title} className="w-full h-full object-cover"
                        onError={() => setImgErr(p => ({ ...p, [img]: true }))} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center min-h-[110px]">
                        <Building2 className="w-10 h-10 text-slate-300" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {listing.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 leading-snug mb-1 truncate">{listing.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-orange-400" />
                            {listing.city}
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5" />
                            {listing.listingType === 'sell' ? 'Dijual' : 'Disewa'}
                          </span>
                          {listing.viewsCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              {listing.viewsCount.toLocaleString('id')} views
                            </span>
                          )}
                        </div>
                        <p className="text-base font-bold text-orange-600 mt-2">{formatRupiah(listing.price)}</p>
                      </div>

                      {/* Status */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${s.cls} shrink-0`}>
                        <s.icon className="w-3.5 h-3.5" /> {s.label}
                      </span>
                    </div>

                    {/* Rejection reason */}
                    {listing.status === 'rejected' && listing.rejectionReason && (
                      <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                        <p className="text-xs font-bold text-red-600 mb-0.5">Alasan Penolakan:</p>
                        <p className="text-xs text-red-700">{listing.rejectionReason}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                      <button onClick={() => openEdit(listing)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => setDeleteListing(listing)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form Drawer */}
      {drawerOpen && <FormDrawer listing={editListing} onClose={closeDrawer} />}

      {/* Delete Confirm */}
      {deleteListing && (
        <DeleteConfirmModal
          listing={deleteListing}
          onClose={() => setDeleteListing(null)}
          onConfirm={() => deleteMutation.mutate(deleteListing.id)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
