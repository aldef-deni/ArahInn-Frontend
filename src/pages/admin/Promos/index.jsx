import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { promoApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { formatRupiah, formatDateShort } from '@/utils'
import { Plus, Tag, Zap, Edit2, Trash2, X, Save, ToggleLeft, ToggleRight, Users, User, Image as ImageIcon, Upload } from 'lucide-react'
import DateInput from '@/components/ui/DateInput'
import PriceInput from '@/components/ui/PriceInput'
import { getImageUrl } from '@/utils'

const TYPE_ICONS  = { voucher: Tag, flash_sale: Zap, loyalty: '⭐' }
const TYPE_COLORS = {
  voucher    : 'bg-blue-100 text-blue-700',
  flash_sale : 'bg-orange-100 text-orange-700',
  loyalty    : 'bg-purple-100 text-purple-700',
}

export default function AdminPromos() {
  const { toast } = useToast()
  const qc        = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [imageFile, setImageFile]     = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-promos'],
    queryFn : () => promoApi.getAll().then(r => r.data.data),
  })

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { discountType: 'percent', discountValue: 0, minPurchase: 0, dayType: '', hotelTypes: [], location: '', productTypes: [] }
  })
  const discountType = watch('discountType')
  const hotelTypes   = watch('hotelTypes') || []
  const productTypes = watch('productTypes') || []

  const toggleHotelType = (val) => {
    const cur = watch('hotelTypes') || []
    setValue('hotelTypes', cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val])
  }
  const toggleProductType = (val) => {
    const cur = watch('productTypes') || []
    setValue('productTypes', cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val])
  }

  const saveMutation = useMutation({
    mutationFn: (d) => {
      const fields = {
        name          : d.name,
        code          : d.code,                 // wajib — voucher tanpa kode tidak berguna
        type          : 'voucher',              // semua promo = voucher (kode di checkout)
        description   : d.description || undefined,
        discount_type : d.discountType,
        discount_value: d.discountValue,
        min_purchase  : d.minPurchase || 0,
        max_discount  : d.maxDiscount || undefined,
        quota         : d.quota || undefined,
        start_date    : d.startDate || undefined,
        end_date      : d.endDate || undefined,
        // Kondisi opsional
        day_type      : d.dayType || undefined,
        hotel_types   : (d.hotelTypes && d.hotelTypes.length) ? d.hotelTypes : undefined,
        location      : d.location || undefined,
        product_types : (d.productTypes && d.productTypes.length) ? d.productTypes : undefined,
        // owner_id sengaja tidak dikirim → backend set null (promo platform untuk semua customer)
      }

      // Kalau ada image baru → kirim sebagai FormData
      if (imageFile) {
        const fd = new FormData()
        Object.entries(fields).forEach(([k, v]) => {
          if (v === undefined || v === null || v === '') return
          if (Array.isArray(v)) v.forEach(item => fd.append(`${k}[]`, item))
          else fd.append(k, v)
        })
        fd.append('image', imageFile)
        return editing ? promoApi.update(editing.id, fd) : promoApi.create(fd)
      }

      return editing ? promoApi.update(editing.id, fields) : promoApi.create(fields)
    },
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-promos'] })
      toast({ title: editing ? 'Promo diperbarui.' : 'Promo berhasil dibuat.' })
      setShowForm(false); setEditing(null); reset()
      setImageFile(null); setImagePreview(null)
    },
    onError: (e) => toast({ title: 'Gagal', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const handleImageChange = (e) => {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return
    // Maks 5 MB
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Ukuran gambar terlalu besar', description: 'Maksimal 5 MB. Silakan pilih gambar yang lebih kecil atau dikompres dulu.', variant: 'destructive' })
      input.value = ''
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result
      const img = new window.Image()
      img.onload = () => {
        // Resolusi minimal wajib 1536×1024 px
        if (img.naturalWidth < 1536 || img.naturalHeight < 1024) {
          toast({ title: 'Resolusi gambar terlalu kecil', description: `Minimal 1536×1024 piksel. Gambar Anda ${img.naturalWidth}×${img.naturalHeight} px.`, variant: 'destructive' })
          input.value = ''
          return
        }
        setImageFile(file)
        setImagePreview(dataUrl)
      }
      img.onerror = () => { toast({ title: 'Gambar tidak valid', variant: 'destructive' }); input.value = '' }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const deleteMutation = useMutation({
    mutationFn: (id) => promoApi.remove(id),
    onSuccess : () => { qc.invalidateQueries({ queryKey: ['admin-promos'] }); toast({ title: 'Promo dihapus.' }) },
    onError   : (e) => toast({ title: 'Gagal hapus', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const handleDelete = (promo) => {
    if (!window.confirm(`Hapus promo "${promo.name}"? Tindakan ini tidak bisa dibatalkan.`)) return
    deleteMutation.mutate(promo.id)
  }

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => promoApi.update(id, { is_active: isActive }),
    onSuccess : (_, { isActive }) => {
      qc.invalidateQueries({ queryKey: ['admin-promos'] })
      toast({ title: isActive ? 'Promo diaktifkan.' : 'Promo dinonaktifkan.' })
    },
    onError: (e) => toast({ title: 'Gagal', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const openEdit = (promo) => {
    setEditing(promo); setShowForm(true)
    setImageFile(null)
    setImagePreview(promo.image ? getImageUrl(promo.image) : null)
    reset({
      name         : promo.name,
      code         : promo.code,
      description  : promo.description ?? '',
      discountType : promo.discountType,
      discountValue: promo.discountValue,
      minPurchase  : promo.minPurchase,
      maxDiscount  : promo.maxDiscount,
      quota        : promo.quota,
      startDate    : promo.startDate?.slice(0, 10),
      endDate      : promo.endDate?.slice(0, 10),
      dayType      : promo.dayType ?? '',
      hotelTypes   : Array.isArray(promo.hotelTypes) ? promo.hotelTypes : [],
      location     : promo.location ?? '',
      productTypes : Array.isArray(promo.productTypes) ? promo.productTypes : [],
    })
  }

  const onClose = () => {
    setShowForm(false); setEditing(null); reset()
    setImageFile(null); setImagePreview(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Manajemen Promo</h2>
          <p className="text-muted-foreground text-sm">Kelola voucher, flash sale, dan program loyalitas</p>
        </div>
        <button onClick={() => { setEditing(null); reset(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Buat Promo
        </button>
      </div>

      {/* Promo grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)
          : data?.map(promo => {
              const Icon = TYPE_ICONS[promo.type]
              return (
                <div key={promo.id} className={`bg-white border rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow ${!promo.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${TYPE_COLORS[promo.type]}`}>
                      {typeof Icon === 'string' ? Icon : Icon && <Icon className="w-3.5 h-3.5" />}
                      <span className="capitalize">{promo.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(promo)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(promo)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-base mb-1 line-clamp-1">{promo.name}</h3>

                  {/* Owner badge */}
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mb-2 ${promo.owner ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {promo.owner ? <><User className="w-3 h-3" />{promo.owner.name}</> : <><Users className="w-3 h-3" />Semua Owner</>}
                  </div>

                  {promo.code && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted rounded-lg font-mono text-xs font-bold text-foreground mb-3">
                      <Tag className="w-3 h-3" /> {promo.code}
                    </div>
                  )}

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Diskon</span>
                      <span className="font-semibold text-foreground">
                        {promo.discountType === 'percent'
                          ? `${promo.discountValue}%`
                          : formatRupiah(promo.discountValue)}
                      </span>
                    </div>
                    {promo.minPurchase > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Min. pembelian</span>
                        <span>{formatRupiah(promo.minPurchase)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Kuota</span>
                      <span>{promo.usedCount || 0} / {promo.quota ?? '∞'}</span>
                    </div>
                    {promo.endDate && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Berlaku hingga</span>
                        <span>{formatDateShort(promo.endDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {promo.quota && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full transition-all"
                          style={{ width: `${Math.min(100, ((promo.usedCount || 0) / promo.quota) * 100)}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Active toggle */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {promo.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <button
                      onClick={() => toggleMutation.mutate({ id: promo.id, isActive: !promo.isActive })}
                      disabled={toggleMutation.isPending}
                      title={promo.isActive ? 'Nonaktifkan promo' : 'Aktifkan promo'}
                      className="disabled:opacity-50 transition-opacity">
                      {promo.isActive
                        ? <ToggleRight className="w-8 h-8 text-green-500" />
                        : <ToggleLeft  className="w-8 h-8 text-gray-400" />}
                    </button>
                  </div>
                </div>
              )
            })
        }
        {!isLoading && !data?.length && (
          <div className="col-span-3 py-16 text-center text-muted-foreground">
            <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Belum ada promo aktif.</p>
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="font-semibold">{editing ? 'Edit Promo' : 'Buat Promo Baru'}</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="p-6 space-y-4">
              {/* Image flyer */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Flyer Image <span className="text-muted-foreground font-normal">(wajib min. 1536×1024px · maks 5 MB)</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <label className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    {imagePreview ? 'Ganti Gambar' : 'Pilih Gambar'}
                    <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Format PNG/JPG/WEBP · wajib minimal 1536×1024px (rasio 3:2) · maks 5 MB. Promo dengan flyer akan tampil di carousel main website (walaupun belum mulai).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Nama Promo <span className="text-red-500">*</span></label>
                  <input {...register('name', { required: true })}
                    className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Deskripsi <span className="text-muted-foreground font-normal">(opsional)</span></label>
                  <textarea {...register('description')} rows={3} placeholder="Detail promo, syarat & ketentuan, dll..."
                    className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Kode Voucher <span className="text-red-500">*</span></label>
                  <input {...register('code', { required: true })} placeholder="HEMAT50"
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand/50 ${errors.code ? 'border-red-400' : ''}`} />
                  {errors.code
                    ? <p className="text-xs text-red-500 mt-1">Kode voucher wajib diisi.</p>
                    : <p className="text-xs text-muted-foreground mt-1">Kode ini yang dimasukkan customer saat pembayaran untuk dapat potongan.</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tipe Diskon <span className="text-red-500">*</span></label>
                  <select {...register('discountType')} className="w-full px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/50">
                    <option value="percent">Persentase (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Nilai Diskon ({discountType === 'percent' ? '%' : 'Rp'}) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold pointer-events-none">
                      {discountType === 'percent' ? '%' : 'Rp'}
                    </span>
                    <input type="number" min="0" step={discountType === 'percent' ? '0.1' : '1'}
                      {...register('discountValue', { required: true, min: 0.01, max: discountType === 'percent' ? 100 : undefined, valueAsNumber: true })}
                      placeholder={discountType === 'percent' ? 'mis. 20' : 'mis. 50000'}
                      className={`w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 ${errors.discountValue ? 'border-red-400' : ''}`} />
                  </div>
                  {errors.discountValue
                    ? <p className="text-xs text-red-500 mt-1">Nilai diskon wajib diisi & lebih dari 0{discountType === 'percent' ? ' (maks 100%)' : ''}.</p>
                    : <p className="text-xs text-muted-foreground mt-1">{discountType === 'percent' ? 'Potongan dalam persen (mis. 20 = 20%).' : 'Potongan nominal rupiah (mis. 50000 = Rp 50.000).'}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Min. Pembelian</label>
                  <PriceInput
                    value={watch('minPurchase')}
                    onChange={v => setValue('minPurchase', v)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Maks. Diskon</label>
                  <PriceInput
                    value={watch('maxDiscount')}
                    onChange={v => setValue('maxDiscount', v)}
                    placeholder="Tidak terbatas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Kuota</label>
                  <input type="number" {...register('quota')} placeholder="Tidak terbatas"
                    className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tanggal Mulai <span className="text-muted-foreground font-normal">(opsional)</span></label>
                  <DateInput value={watch('startDate') || ''} onChange={v => setValue('startDate', v)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tanggal Berakhir <span className="text-muted-foreground font-normal">(opsional)</span></label>
                  <DateInput value={watch('endDate') || ''} min={watch('startDate') || undefined}
                    onChange={v => setValue('endDate', v)} />
                </div>
              </div>

              {/* Kondisi opsional */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50/60">
                <p className="text-sm font-semibold text-slate-700">
                  Kondisi Promo <span className="font-normal text-slate-400">(opsional — kosongkan jika tanpa syarat)</span>
                </p>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Berlaku untuk</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { v: 'accommodation', l: 'Akomodasi' },
                      { v: 'pesawat',       l: 'Tiket Pesawat' },
                      { v: 'pelni',         l: 'Tiket PELNI' },
                      { v: 'kereta',        l: 'Tiket KAI' },
                    ].map(({ v, l }) => {
                      const active = productTypes.includes(v)
                      return (
                        <button type="button" key={v} onClick={() => toggleProductType(v)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${active ? 'bg-brand text-white border-brand' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                          {l}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">Kosong = berlaku untuk semua produk (akomodasi & tiket).</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Hari Berlaku</label>
                  <select {...register('dayType')} className="w-full px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/50">
                    <option value="">Semua hari</option>
                    <option value="weekday">Hari kerja (Senin–Jumat)</option>
                    <option value="weekend">Akhir pekan (Sabtu–Minggu)</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">Berdasarkan tanggal check-in.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Jenis Akomodasi</label>
                  <div className="flex flex-wrap gap-2">
                    {['Hotel', 'Villa', 'Apartment', 'Guest House', 'Kosan', 'Resort', 'Glamping'].map(tp => {
                      const active = hotelTypes.includes(tp)
                      return (
                        <button type="button" key={tp} onClick={() => toggleHotelType(tp)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${active ? 'bg-brand text-white border-brand' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                          {tp}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">Kosong = berlaku untuk semua jenis akomodasi.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Lokasi (Kota / Area)</label>
                  <input {...register('location')} placeholder="mis. Bandung"
                    className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
                  <p className="text-[11px] text-slate-400 mt-1.5">Kosong = semua lokasi. Dicocokkan dengan kota/area hotel.</p>
                </div>
              </div>

              {/* Info: promo berlaku untuk semua customer via kode di checkout */}
              <div className="col-span-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                Voucher ini berlaku untuk <b>semua customer</b>. Saat customer memasukkan kode di halaman
                pembayaran, potongan langsung diterapkan sesuai diskon &amp; kondisi di atas.
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={saveMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors">
                  <Save className="w-4 h-4" />
                  {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
