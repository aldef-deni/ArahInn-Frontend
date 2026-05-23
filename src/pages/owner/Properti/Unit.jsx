import { useOutletContext } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import { Plus, Pencil, Trash2, X, BedDouble, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react'
import PriceInput from '@/components/ui/PriceInput'
import { getImageUrl } from '@/utils'
import { validateImageFile } from '@/utils/imageValidation'

// Preview komponen — pakai useEffect agar URL.createObjectURL dipanggil sekali per file
function NewImagePreview({ file, onRemove }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    const u = URL.createObjectURL(file)
    setSrc(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  return (
    <div className="relative aspect-square rounded-xl overflow-hidden border border-blue-200 bg-blue-50 group">
      {src && <img src={src} alt={file.name} className="w-full h-full object-cover" />}
      <span className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-md text-center truncate">
        BARU
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
        title="Hapus"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

const ROOM_TYPES = [
  { value: 'single_room',      label: 'Single Room'           },
  { value: 'standard',         label: 'Standard'              },
  { value: 'superior',         label: 'Superior'              },
  { value: 'deluxe',           label: 'Deluxe'                },
  { value: 'family',           label: 'Family'                },
  { value: 'suite',            label: 'Suite'                 },
  { value: 'apartment_studio', label: 'Apartment - Studio'    },
  { value: 'apartment_2br',    label: 'Apartment - 2 Bedroom' },
  { value: 'apartment_3br',    label: 'Apartment - 3 Bedroom' },
  { value: 'villa',            label: 'Villa'                 },
]

const roomTypeLabel = (val) => ROOM_TYPES.find(t => t.value === val)?.label ?? val
const FACILITIES = ['ac','tv','wifi','minibar','bathtub','jacuzzi','balcony','kitchen','living_room','extra_bed']

const emptyForm = { name: '', type: 'standard', base_price: '', max_guests: 2, total_units: 1, description: '', facilities: [], existingImages: [], newImages: [] }

export default function PropertiUnit() {
  const { hotel }  = useOutletContext()
  const { toast }  = useToast()
  const qc         = useQueryClient()
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]     = useState(emptyForm)
  const [imageErrors, setImageErrors] = useState([])  // [{ name, reason }]

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['owner-rooms', hotel?.id],
    queryFn : () => hotelApi.getRooms(hotel.id).then(r => r.data?.data || r.data),
    enabled : !!hotel?.id,
  })

  const addMutation = useMutation({
    mutationFn: (d) => hotelApi.addRoom(hotel.id, d),
    onSuccess : () => { qc.invalidateQueries({ queryKey: ['owner-rooms'] }); closeModal(); toast({ title: 'Kamar ditambahkan.' }) },
    onError   : () => toast({ title: 'Gagal menyimpan.', variant: 'destructive' }),
  })

  const editMutation = useMutation({
    mutationFn: (d) => hotelApi.updateRoom(hotel.id, editing.id, d),
    onSuccess : () => { qc.invalidateQueries({ queryKey: ['owner-rooms'] }); closeModal(); toast({ title: 'Kamar diperbarui.' }) },
    onError   : () => toast({ title: 'Gagal menyimpan.', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => hotelApi.deleteRoom(hotel.id, id),
    onSuccess : () => { qc.invalidateQueries({ queryKey: ['owner-rooms'] }); toast({ title: 'Kamar dihapus.' }) },
    onError   : () => toast({ title: 'Gagal menghapus.', variant: 'destructive' }),
  })

  const openAdd  = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit = (r) => {
    setEditing(r)
    setForm({
      name: r.name,
      type: r.type,
      base_price: r.basePrice,
      max_guests: r.maxGuests,
      total_units: r.totalUnits,
      description: r.description || '',
      facilities: r.facilities || [],
      existingImages: r.images || [],
      newImages: [],
    })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null); setImageErrors([]) }
  const toggleFacility = (f) => setForm(p => ({ ...p, facilities: p.facilities.includes(f) ? p.facilities.filter(x => x !== f) : [...p.facilities, f] }))

  const handleImagesChange = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = '' // reset segera

    const accepted = []
    const errors = []

    for (const f of files) {
      const result = await validateImageFile(f)
      if (!result.valid) {
        errors.push({ name: f.name, reason: result.error })
        continue
      }
      accepted.push(f)
    }

    if (errors.length) {
      setImageErrors(errors)
      toast({
        title: `${errors.length} foto gagal diupload`,
        description: 'Format JPG/JPEG · Min 800px · Maks 5 MB',
        variant: 'destructive',
      })
    } else {
      setImageErrors([])
    }

    if (accepted.length) {
      setForm(p => ({ ...p, newImages: [...p.newImages, ...accepted] }))
    }
  }

  const removeExistingImage = (idx) =>
    setForm(p => ({ ...p, existingImages: p.existingImages.filter((_, i) => i !== idx) }))

  const removeNewImage = (idx) =>
    setForm(p => ({ ...p, newImages: p.newImages.filter((_, i) => i !== idx) }))

  const buildPayload = () => {
    const hasNewImages    = form.newImages.length > 0
    const imagesChanged   = editing
      ? form.existingImages.length !== (editing.images?.length || 0) || hasNewImages
      : hasNewImages

    if (hasNewImages || imagesChanged) {
      // Pakai FormData supaya bisa kirim file
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('type', form.type)
      fd.append('base_price', form.base_price)
      fd.append('max_guests', form.max_guests)
      fd.append('total_units', form.total_units)
      fd.append('description', form.description || '')
      ;(form.facilities || []).forEach(f => fd.append('facilities[]', f))
      ;(form.existingImages || []).forEach(img => fd.append('existing_images[]', typeof img === 'string' ? img : (img?.path || '')))
      ;(form.newImages || []).forEach(file => fd.append('image_files[]', file))
      return fd
    }

    // Tanpa image baru — kirim JSON biasa
    return {
      name: form.name,
      type: form.type,
      base_price: form.base_price,
      max_guests: form.max_guests,
      total_units: form.total_units,
      description: form.description || '',
      facilities: form.facilities,
    }
  }

  const handleSubmit = () => {
    const payload = buildPayload()
    editing ? editMutation.mutate(payload) : addMutation.mutate(payload)
  }
  const isPending    = addMutation.isPending || editMutation.isPending

  if (!hotel) return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <BedDouble className="w-10 h-10 mb-3 opacity-30" />
      <p className="text-sm font-semibold text-slate-500">Properti tidak ditemukan</p>
      <p className="text-sm mt-1">Pastikan Anda sudah mendaftarkan properti terlebih dahulu.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{rooms?.length || 0} tipe kamar terdaftar</p>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Tambah Kamar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Kamar','Tipe','Harga / Malam','Kapasitas','Unit','Aksi'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading
              ? Array(3).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              : rooms?.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{roomTypeLabel(r.type)}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatRupiah(r.basePrice)}</td>
                    <td className="px-4 py-3 text-slate-500">{r.maxGuests} tamu</td>
                    <td className="px-4 py-3 text-slate-500">{r.totalUnits} unit</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(r)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm('Hapus kamar ini?')) deleteMutation.mutate(r.id) }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
        {!isLoading && !rooms?.length && (
          <div className="py-14 text-center space-y-2">
            <BedDouble className="w-10 h-10 text-slate-200 mx-auto" />
            <p className="text-slate-400 text-sm">Belum ada kamar. Tambah sekarang.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">{editing ? 'Edit Kamar' : 'Tambah Kamar'}</h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Kamar</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tipe</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30">
                    {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Harga / Malam</label>
                  <PriceInput
                    value={form.base_price}
                    onChange={v => setForm(p => ({ ...p, base_price: v }))}
                    suffix="/malam"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kapasitas Tamu</label>
                  <select value={form.max_guests} onChange={e => setForm(p => ({ ...p, max_guests: +e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30">
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} tamu</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jumlah Unit</label>
                  <input type="number" min={1} value={form.total_units} onChange={e => setForm(p => ({ ...p, total_units: +e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Deskripsi Kamar <span className="font-normal text-slate-400">(opsional)</span>
                  </label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Ceritakan tentang kamar ini — suasana, view, ukuran, kelebihan, dll."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
                  />
                  <p className="mt-1 text-[10px] text-slate-400 text-right">{(form.description || '').length}/1000</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Foto Kamar
                  <span className="font-normal text-slate-400"> (min. 1024×1024 px · max 5 MB / foto · bisa pilih banyak)</span>
                </label>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {/* Existing images */}
                  {form.existingImages?.map((img, idx) => {
                    const src = typeof img === 'string' ? getImageUrl(img) : getImageUrl(img?.path)
                    return (
                      <div key={`old-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                        <img src={src} alt={`foto ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          title="Hapus foto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })}

                  {/* New image previews */}
                  {form.newImages?.map((file, idx) => (
                    <NewImagePreview
                      key={`new-${idx}-${file.name}-${file.size}`}
                      file={file}
                      onRemove={() => removeNewImage(idx)}
                    />
                  ))}

                  {/* Upload button (tile) */}
                  <label className="cursor-pointer aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-brand transition-colors flex flex-col items-center justify-center gap-1.5 text-slate-500">
                    <Upload className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">Tambah Foto</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,.jpg,.jpeg"
                      multiple
                      onChange={handleImagesChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {(form.existingImages?.length || 0) + (form.newImages?.length || 0) === 0 && (
                  <p className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> Belum ada foto. Tambahkan minimal 1 foto.
                  </p>
                )}

                {/* Danger alert: list file yang ditolak */}
                {imageErrors.length > 0 && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-red-900">
                            {imageErrors.length} foto gagal diupload
                          </p>
                          <p className="text-xs text-red-700 mt-0.5">
                            Foto berikut tidak memenuhi persyaratan minimal 1024×1024 px atau maksimal 5 MB:
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImageErrors([])}
                        className="p-1 rounded-lg hover:bg-red-100 text-red-500 transition-colors shrink-0"
                        title="Tutup"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <ul className="mt-3 space-y-1.5 max-h-32 overflow-y-auto">
                      {imageErrors.map((err, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <span className="mt-1 w-1 h-1 rounded-full bg-red-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-red-900 truncate">{err.name}</p>
                            <p className="text-red-700 leading-relaxed">{err.reason}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Fasilitas Kamar</label>
                <div className="flex flex-wrap gap-2">
                  {FACILITIES.map(f => (
                    <button key={f} type="button" onClick={() => toggleFacility(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                        form.facilities.includes(f)
                          ? 'bg-brand/10 border-brand text-brand-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}>
                      {f.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeModal}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button onClick={handleSubmit} disabled={isPending}
                className="px-5 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50">
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
