import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { propertyApi } from '@/services/propertyApi'
import { formatRupiah, getImageUrl } from '@/utils'
import { validateImageFiles } from '@/utils/imageValidation'
import PriceInput from '@/components/ui/PriceInput'
import { useToast } from '@/hooks/use-toast'
import {
  Building2, CheckCircle2, XCircle, Clock, Eye,
  MapPin, Tag, X, ChevronLeft, ChevronRight,
  AlertTriangle, User, Phone, Mail, BedDouble, Bath, Maximize2,
  Plus, Save, Upload,
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const CATEGORIES     = ['Hotel', 'Apartment', 'Kosan', 'Guest House', 'Villa', 'Resort']
const CERTIFICATES   = ['SHM', 'HGB', 'Strata', 'Lainnya']
const FACILITIES_LIST = [
  'AC', 'WiFi', 'Kolam Renang', 'Parkir', 'Gym', 'Restoran',
  'Laundry', 'CCTV', 'Security 24 Jam', 'Generator Listrik',
  'Lift', 'Rooftop', 'Taman', 'Dapur', 'Balkon',
]
const INIT_FORM = {
  title: '', description: '', category: '', listingType: 'sell',
  price: '', priceNegotiable: false, address: '', city: '', province: '',
  landArea: '', buildingArea: '', bedrooms: '', bathrooms: '',
  certificate: '', facilities: [], contactPhone: '', contactEmail: '',
}

function PropertyFormDrawer({ onClose }) {
  const { toast } = useToast()
  const qc        = useQueryClient()
  const fileRef   = useRef(null)
  const [form, setForm]       = useState({ ...INIT_FORM })
  const [newImages, setNewImages] = useState([])
  const [previews, setPreviews]   = useState([])

  const f = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(p => ({ ...p, [k]: val }))
  }

  const toggleFacility = (fac) => setForm(p => ({
    ...p,
    facilities: p.facilities.includes(fac)
      ? p.facilities.filter(x => x !== fac)
      : [...p.facilities, fac],
  }))

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

  const removeNew = (idx) => {
    setNewImages(p => p.filter((_, i) => i !== idx))
    setPreviews(p => p.filter((_, i) => i !== idx))
  }

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'facilities') v.forEach(fac => fd.append('facilities[]', fac))
        else if (v !== '' && v !== null && v !== undefined) fd.append(k, v)
      })
      newImages.forEach(img => fd.append('images[]', img))
      return propertyApi.create(fd)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-property-listings'] })
      toast({ title: 'Properti berhasil ditambahkan.' })
      onClose()
    },
    onError: (e) => toast({
      title: 'Gagal menyimpan',
      description: e?.response?.data?.message || 'Terjadi kesalahan.',
      variant: 'destructive',
    }),
  })

  const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Tambah Properti</h2>
              <p className="text-xs text-slate-500">Daftarkan properti baru ke marketplace</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Judul Listing *</label>
            <input value={form.title} onChange={f('title')}
              placeholder="contoh: Hotel Bintang 3 Strategis di Pusat Kota Bandung"
              className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kategori *</label>
              <select value={form.category} onChange={f('category')} className={inputCls + ' bg-white'}>
                <option value="">Pilih...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipe Listing *</label>
              <select value={form.listingType} onChange={f('listingType')} className={inputCls + ' bg-white'}>
                <option value="sell">Dijual</option>
                <option value="rent">Disewakan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Harga <span className="text-red-500">*</span></label>
            <PriceInput
              value={form.price}
              onChange={v => setForm(p => ({ ...p, price: v }))}
              placeholder="Contoh: 2.500.000.000"
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" checked={form.priceNegotiable} onChange={f('priceNegotiable')}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer" />
              <span className="text-sm text-slate-600">Harga dapat dinegosiasikan</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kota *</label>
              <input value={form.city} onChange={f('city')} placeholder="contoh: Bandung" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Provinsi</label>
              <input value={form.province} onChange={f('province')} placeholder="Jawa Barat" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alamat Lengkap</label>
            <input value={form.address} onChange={f('address')}
              placeholder="Jl. Sudirman No. 10..." className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Luas Tanah (m²)</label>
              <input type="number" value={form.landArea} onChange={f('landArea')} placeholder="200" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Luas Bangunan (m²)</label>
              <input type="number" value={form.buildingArea} onChange={f('buildingArea')} placeholder="150" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kamar Tidur</label>
              <input type="number" value={form.bedrooms} onChange={f('bedrooms')} placeholder="5" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kamar Mandi</label>
              <input type="number" value={form.bathrooms} onChange={f('bathrooms')} placeholder="3" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jenis Sertifikat</label>
            <select value={form.certificate} onChange={f('certificate')} className={inputCls + ' bg-white'}>
              <option value="">Tidak Ada / Belum Ada</option>
              {CERTIFICATES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">No. HP Kontak</label>
              <input value={form.contactPhone} onChange={f('contactPhone')}
                placeholder="+6281234567890" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Kontak</label>
              <input type="email" value={form.contactEmail} onChange={f('contactEmail')}
                placeholder="jual@email.com" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deskripsi</label>
            <textarea value={form.description} onChange={f('description')} rows={4}
              placeholder="Jelaskan kondisi, keunggulan, dan detail properti..."
              className={inputCls + ' resize-none'} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Foto Properti</label>
            <p className="text-xs text-slate-400 mb-2">Min. resolusi 1024 px · maks. 5 MB per file.</p>
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
          <button onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.title || !form.category || !form.price || !form.city}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {mutation.isPending
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
              : <><Save className="w-4 h-4" /> Simpan Properti</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

const STATUS_TABS = [
  { label: 'Semua',    value: 'all' },
  { label: 'Pending',  value: 'pending' },
  { label: 'Disetujui', value: 'approved' },
  { label: 'Ditolak',  value: 'rejected' },
]

const STATUS_META = {
  approved : { label: 'Disetujui', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  pending  : { label: 'Menunggu',  cls: 'bg-amber-100 text-amber-700',     icon: Clock },
  rejected : { label: 'Ditolak',   cls: 'bg-red-100 text-red-600',         icon: XCircle },
}

function DetailModal({ listing, onClose, onApprove, onReject, isApproving, isRejecting }) {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const images = listing.images || []
  const s = STATUS_META[listing.status] || STATUS_META.pending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 line-clamp-1">{listing.title}</h2>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${s.cls}`}>
                <s.icon className="w-3 h-3" /> {s.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Images */}
          {images.length > 0 && (
            <div className="relative h-56 bg-slate-100 rounded-2xl overflow-hidden">
              <img src={getImageUrl(images[imgIdx])} alt="" className="w-full h-full object-cover" />
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    {imgIdx + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {/* Owner */}
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Pemilik</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                  {listing.owner?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{listing.owner?.name}</p>
                  <p className="text-xs text-slate-400">{listing.owner?.email}</p>
                </div>
              </div>
            </div>

            {/* Quick info */}
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Info Properti</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kategori</span>
                  <span className="font-semibold">{listing.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipe</span>
                  <span className="font-semibold">{listing.listingType === 'sell' ? 'Dijual' : 'Disewa'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kota</span>
                  <span className="font-semibold">{listing.city}</span>
                </div>
                {listing.certificate && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sertifikat</span>
                    <span className="font-semibold">{listing.certificate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
            <p className="text-xs text-orange-500 font-bold uppercase tracking-wide mb-1">Harga</p>
            <p className="text-xl font-black text-orange-600">{formatRupiah(listing.price)}</p>
            {listing.priceNegotiable && (
              <span className="text-xs text-emerald-600 font-semibold">Bisa Negosiasi</span>
            )}
          </div>

          {/* Specs */}
          {(listing.landArea || listing.buildingArea || listing.bedrooms != null || listing.bathrooms != null) && (
            <div className="grid grid-cols-4 gap-3">
              {listing.landArea && (
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <Maximize2 className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400">L. Tanah</p>
                  <p className="text-xs font-bold text-slate-900">{listing.landArea} m²</p>
                </div>
              )}
              {listing.buildingArea && (
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <Building2 className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400">L. Bangunan</p>
                  <p className="text-xs font-bold text-slate-900">{listing.buildingArea} m²</p>
                </div>
              )}
              {listing.bedrooms != null && (
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <BedDouble className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400">KT</p>
                  <p className="text-xs font-bold text-slate-900">{listing.bedrooms}</p>
                </div>
              )}
              {listing.bathrooms != null && (
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <Bath className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400">KM</p>
                  <p className="text-xs font-bold text-slate-900">{listing.bathrooms}</p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {listing.description && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Deskripsi</p>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>
          )}

          {/* Contact */}
          {(listing.contactPhone || listing.contactEmail) && (
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Kontak</p>
              <div className="flex flex-wrap gap-3">
                {listing.contactPhone && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-700">
                    <Phone className="w-4 h-4 text-blue-500" /> {listing.contactPhone}
                  </span>
                )}
                {listing.contactEmail && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-700">
                    <Mail className="w-4 h-4 text-blue-500" /> {listing.contactEmail}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Rejection reason (if rejected) */}
          {listing.status === 'rejected' && listing.rejectionReason && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">Alasan Penolakan</p>
              <p className="text-sm text-red-700">{listing.rejectionReason}</p>
            </div>
          )}

          {/* Reject form */}
          {showRejectForm && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-bold text-red-700 mb-2">Alasan Penolakan *</p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Jelaskan alasan penolakan listing ini..."
                className="w-full px-3 py-2.5 border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        {listing.status === 'pending' && (
          <div className="px-6 py-4 border-t flex flex-wrap gap-3 justify-end shrink-0 bg-slate-50">
            {!showRejectForm ? (
              <>
                <button onClick={() => setShowRejectForm(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">
                  <XCircle className="w-4 h-4" /> Tolak
                </button>
                <button onClick={onApprove} disabled={isApproving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                  {isApproving ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyetujui...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Setujui</>
                  )}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowRejectForm(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                  Batal
                </button>
                <button onClick={() => onReject(rejectReason)} disabled={isRejecting || !rejectReason.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {isRejecting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menolak...</>
                  ) : (
                    <><XCircle className="w-4 h-4" /> Kirim Penolakan</>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPropertyApproval() {
  const { toast }           = useToast()
  const qc                  = useQueryClient()
  const [tab, setTab]         = useState('pending')
  const [detail, setDetail]   = useState(null)
  const [page, setPage]       = useState(1)
  const [formOpen, setFormOpen] = useState(false)

  const params = tab === 'all'
    ? { status: 'all', page, limit: 20 }
    : tab === 'pending'
    ? {}
    : { status: tab, page, limit: 20 }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-property-listings', tab, page],
    queryFn : () => tab === 'pending'
      ? propertyApi.pending().then(r => r.data)
      : propertyApi.search(params).then(r => r.data),
    keepPreviousData: true,
  })

  const approveMutation = useMutation({
    mutationFn: (id) => propertyApi.approve(id),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-property-listings'] })
      toast({ title: 'Listing berhasil disetujui.' })
      setDetail(null)
    },
    onError: (e) => toast({
      title: 'Gagal menyetujui',
      description: e?.response?.data?.message || 'Terjadi kesalahan.',
      variant: 'destructive',
    }),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => propertyApi.reject(id, { reason }),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-property-listings'] })
      toast({ title: 'Listing berhasil ditolak.' })
      setDetail(null)
    },
    onError: (e) => toast({
      title: 'Gagal menolak',
      description: e?.response?.data?.message || 'Terjadi kesalahan.',
      variant: 'destructive',
    }),
  })

  const listings   = data?.data || []
  const pagination = data?.pagination
  const totalPages = pagination?.totalPages || 1

  const formatDate = (d) => {
    if (!d) return '-'
    try { return format(new Date(d), 'dd MMM yyyy', { locale: localeId }) }
    catch { return d }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Jual - Beli Properti</h1>
          <p className="text-sm text-slate-500 mt-0.5">Persetujuan Penjualan Properti</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Tambah Properti
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm w-fit mb-6">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => { setTab(t.value); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Properti</th>
                <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Owner</th>
                <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Kategori</th>
                <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Kota</th>
                <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Harga</th>
                <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide hidden xl:table-cell">Tanggal</th>
                <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="skeleton h-4 w-24 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">Tidak ada data listing</p>
                  </td>
                </tr>
              ) : (
                listings.map(listing => {
                  const s = STATUS_META[listing.status] || STATUS_META.pending
                  const img = listing.images?.[0]
                  return (
                    <tr key={listing.id} className="hover:bg-slate-50 transition-colors">
                      {/* Properti */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                            {img ? (
                              <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-slate-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm truncate max-w-[160px]">{listing.title}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[160px]">
                              {listing.listingType === 'sell' ? 'Dijual' : 'Disewa'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-slate-900 truncate max-w-[120px]">{listing.owner?.name || '-'}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[120px]">{listing.owner?.email}</p>
                      </td>

                      {/* Kategori */}
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-xs px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full font-semibold">
                          {listing.category}
                        </span>
                      </td>

                      {/* Kota */}
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="flex items-center gap-1 text-sm text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                          {listing.city}
                        </span>
                      </td>

                      {/* Harga */}
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <p className="text-sm font-bold text-orange-600">{formatRupiah(listing.price)}</p>
                      </td>

                      {/* Tanggal */}
                      <td className="px-4 py-4 hidden xl:table-cell">
                        <p className="text-xs text-slate-500">{formatDate(listing.createdAt)}</p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${s.cls}`}>
                          <s.icon className="w-3 h-3" /> {s.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setDetail(listing)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors">
                            <Eye className="w-3.5 h-3.5" /> Detail
                          </button>
                          {listing.status === 'pending' && (
                            <>
                              <button onClick={() => approveMutation.mutate(listing.id)}
                                disabled={approveMutation.isPending}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold hover:bg-emerald-100 disabled:opacity-50 transition-colors">
                                <CheckCircle2 className="w-3.5 h-3.5" /> OK
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-5 border-t">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors border ${
                  page === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Form Drawer */}
      {formOpen && <PropertyFormDrawer onClose={() => setFormOpen(false)} />}

      {/* Detail Modal */}
      {detail && (
        <DetailModal
          listing={detail}
          onClose={() => setDetail(null)}
          onApprove={() => approveMutation.mutate(detail.id)}
          onReject={(reason) => rejectMutation.mutate({ id: detail.id, reason })}
          isApproving={approveMutation.isPending}
          isRejecting={rejectMutation.isPending}
        />
      )}
    </div>
  )
}
