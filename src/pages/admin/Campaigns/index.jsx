import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { formatDateShort, getImageUrl } from '@/utils'
import {
  Plus, Megaphone, Pencil, Trash2, X, Save,
  Calendar, Users, AlertTriangle,
  MousePointerClick, Eye, Image as ImageIcon, Upload,
} from 'lucide-react'
import { campaignApi } from '@/services/index'


const TYPE_META = {
  banner   : { label: 'Banner',    cls: 'bg-blue-100 text-blue-700'   },
  email    : { label: 'Email',     cls: 'bg-purple-100 text-purple-700' },
  push     : { label: 'Push Notif', cls: 'bg-orange-100 text-orange-700' },
  popup    : { label: 'Pop-up',    cls: 'bg-pink-100 text-pink-700'   },
}

// Pilihan tipe yang bisa dibuat (multi-select): banner &/atau popup
const TYPE_OPTIONS = ['banner', 'popup']

// "banner,popup" → ['banner','popup']
const parseTypes = (t) => (Array.isArray(t) ? t : String(t || '').split(',')).map(s => s.trim()).filter(Boolean)

const TARGET_META = {
  all      : { label: 'Semua Pengguna' },
  new_user : { label: 'Pengguna Baru'  },
  loyal    : { label: 'Pelanggan Setia' },
  inactive : { label: 'Tidak Aktif'    },
}

const STATUS_META = {
  active  : { label: 'Aktif',     cls: 'bg-emerald-100 text-emerald-700' },
  inactive: { label: 'Nonaktif',  cls: 'bg-slate-100 text-slate-500'     },
  draft   : { label: 'Draft',     cls: 'bg-amber-100 text-amber-700'     },
  ended   : { label: 'Selesai',   cls: 'bg-red-100 text-red-500'         },
}

const INIT_FORM = {
  title: '', type: ['banner'], target: 'all', status: 'draft',
  startDate: '', endDate: '', discountPercent: '', description: '',
}

function CampaignFormDrawer({ campaign, onSave, onClose, isSaving }) {
  const isEdit = !!campaign
  const [form, setForm] = useState(isEdit ? {
    title          : campaign.title || '',
    type           : parseTypes(campaign.type).filter(t => TYPE_OPTIONS.includes(t)),
    target         : campaign.target || 'all',
    status         : campaign.status || 'draft',
    startDate      : campaign.startDate?.slice(0, 10) || '',
    endDate        : campaign.endDate?.slice(0, 10) || '',
    discountPercent: campaign.discountPercent ?? '',
    description    : campaign.description || '',
  } : { ...INIT_FORM })

  const [imageFile, setImageFile]       = useState(null)
  const [imagePreview, setImagePreview] = useState(isEdit ? getImageUrl(campaign.image) : null)
  const [bannerFile, setBannerFile]     = useState(null)
  const [bannerPreview, setBannerPreview] = useState(isEdit ? getImageUrl(campaign.banner) : null)
  const [err, setErr] = useState('')

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const toggleType = (t) => setForm(p => ({
    ...p,
    type: p.type.includes(t) ? p.type.filter(x => x !== t) : [...p.type, t],
  }))

  const onPickImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const onPickBanner = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
    setErr('')
  }

  const handleSave = () => {
    if (form.type.length === 0) return
    // Banner landscape WAJIB (file baru atau yang sudah ada saat edit)
    if (!bannerFile && !bannerPreview) {
      setErr('Banner landscape wajib diupload.')
      return
    }
    const pct = form.discountPercent === '' ? 0 : Number(form.discountPercent)

    // Ada file baru (image/banner) → kirim FormData (key snake_case, tdk dikonversi interceptor)
    if (imageFile || bannerFile) {
      const fd = new FormData()
      fd.append('title', form.title)
      form.type.forEach(t => fd.append('type[]', t))
      fd.append('target', form.target)
      fd.append('status', form.status)
      if (form.startDate) fd.append('start_date', form.startDate)
      if (form.endDate)   fd.append('end_date', form.endDate)
      fd.append('discount_percent', pct)
      if (form.description) fd.append('description', form.description)
      if (imageFile)  fd.append('image', imageFile)
      if (bannerFile) fd.append('banner', bannerFile)
      onSave(fd)
      return
    }

    onSave({
      title          : form.title,
      type           : form.type,
      target         : form.target,
      status         : form.status,
      startDate      : form.startDate || null,
      endDate        : form.endDate || null,
      discountPercent: pct,
      description    : form.description || null,
    })
  }

  const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{isEdit ? 'Edit Campaign' : 'Buat Campaign'}</h2>
              <p className="text-xs text-slate-500">{isEdit ? 'Perbarui data campaign' : 'Buat campaign marketing baru'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Judul Campaign *</label>
            <input value={form.title} onChange={f('title')}
              placeholder="contoh: Promo Akhir Tahun 2025"
              className={inputCls} />
          </div>

          {/* Banner Landscape (WAJIB) — tampil memanjang di bawah banner utama */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Banner Landscape <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-4">
              {bannerPreview
                ? <img src={bannerPreview} alt="" className="w-40 h-16 rounded-xl object-cover border border-slate-200 shrink-0" />
                : <div className="w-40 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 shrink-0"><ImageIcon className="w-6 h-6" /></div>}
              <div className="flex-1 min-w-0">
                <input type="file" accept="image/jpeg,image/png,image/webp" id="campaign-banner" onChange={onPickBanner} className="hidden" />
                <label htmlFor="campaign-banner" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold cursor-pointer hover:bg-indigo-100 transition-colors">
                  <Upload className="w-4 h-4" /> {bannerPreview ? 'Ganti Banner' : 'Pilih Banner'}
                </label>
                <p className="text-xs text-slate-500 mt-1.5">Ukuran disarankan <b className="text-slate-700">1440 × 300 px</b> (landscape). Taruh konten penting di tengah. JPG, PNG, WEBP — maks 6MB. Tampil memanjang di bawah banner utama home.</p>
                {err && <p className="text-xs text-red-500 mt-1 font-semibold">{err}</p>}
              </div>
            </div>
          </div>

          {/* Gambar flyer/pop-up (opsional) — untuk kartu carousel & pop-up */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gambar Flyer / Pop-up <span className="font-normal text-slate-400">(opsional)</span></label>
            <div className="flex items-center gap-4">
              {imagePreview
                ? <img src={imagePreview} alt="" className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0" />
                : <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 shrink-0"><ImageIcon className="w-6 h-6" /></div>}
              <div className="flex-1 min-w-0">
                <input type="file" accept="image/jpeg,image/png,image/webp" id="campaign-image" onChange={onPickImage} className="hidden" />
                <label htmlFor="campaign-image" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold cursor-pointer hover:bg-slate-200 transition-colors">
                  <Upload className="w-4 h-4" /> {imagePreview ? 'Ganti Gambar' : 'Pilih Gambar'}
                </label>
                <p className="text-xs text-slate-400 mt-1.5">JPG, PNG, WEBP — maks 4MB. Dipakai untuk kartu carousel & pop-up campaign.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipe Campaign * <span className="font-normal text-slate-400">(boleh pilih keduanya)</span></label>
            <div className="grid grid-cols-2 gap-3">
              {TYPE_OPTIONS.map(t => {
                const active = form.type.includes(t)
                return (
                  <label key={t}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer text-sm transition-colors ${
                      active
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    <input type="checkbox" checked={active} onChange={() => toggleType(t)} className="accent-indigo-600" />
                    {TYPE_META[t].label}
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Target Pengguna *</label>
            <select value={form.target} onChange={f('target')} className={inputCls + ' bg-white'}>
              {Object.entries(TARGET_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Campaign bersifat global — semua owner bisa memilih ikut lewat extranet */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-xs text-indigo-700">
            Campaign ini otomatis tampil ke <b>semua owner</b> di extranet. Owner memilih sendiri
            ikut atau tidak, dan campaign yang diikuti akan tampil di halaman properti mereka.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal Mulai</label>
              <input type="date" value={form.startDate} onChange={f('startDate')} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal Berakhir</label>
              <input type="date" value={form.endDate} min={form.startDate} onChange={f('endDate')} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Diskon Campaign (%)</label>
            <div className="relative">
              <input
                type="number" min="0" max="100" step="0.1"
                value={form.discountPercent}
                onChange={f('discountPercent')}
                placeholder="0"
                className={inputCls + ' pr-10'} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">%</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Persentase diskon yang berlaku saat owner mengikuti campaign ini.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
            <select value={form.status} onChange={f('status')} className={inputCls + ' bg-white'}>
              <option value="draft">Draft</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deskripsi</label>
            <textarea value={form.description} onChange={f('description')} rows={4}
              placeholder="Jelaskan tujuan dan detail campaign ini..."
              className={inputCls + ' resize-none'} />
          </div>
        </div>

        <div className="px-6 py-4 border-t flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button onClick={handleSave}
            disabled={!form.title.trim() || isSaving}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {isSaving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Campaign'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ campaign, onConfirm, onClose, isLoading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="font-bold text-slate-900 mb-1">Hapus Campaign?</h3>
        <p className="text-sm text-slate-500 mb-5">
          Campaign "<span className="font-semibold">{campaign.title}</span>" akan dihapus permanen.
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

export default function AdminCampaigns() {
  const { toast }                       = useToast()
  const qc                              = useQueryClient()
  const [drawer, setDrawer]             = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn : () => campaignApi.getAll().then(r => r.data?.data || []),
  })

  const createMutation = useMutation({
    mutationFn: (d) => campaignApi.create(d),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-campaigns'] })
      setDrawer(null)
      toast({ title: 'Campaign berhasil dibuat.' })
    },
    onError: () => toast({ title: 'Gagal membuat campaign.', variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => campaignApi.update(id, data),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-campaigns'] })
      setDrawer(null)
      toast({ title: 'Campaign diperbarui.' })
    },
    onError: () => toast({ title: 'Gagal memperbarui campaign.', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => campaignApi.remove(id),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-campaigns'] })
      setDeleteTarget(null)
      toast({ title: 'Campaign berhasil dihapus.' })
    },
    onError: () => toast({ title: 'Gagal menghapus campaign.', variant: 'destructive' }),
  })

  const handleSave = (formData) => {
    if (drawer?.id) {
      updateMutation.mutate({ id: drawer.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  const totalActive = campaigns.filter(c => c.status === 'active').length
  const totalViews  = campaigns.reduce((s, c) => s + (c.views || 0), 0)
  const totalClicks = campaigns.reduce((s, c) => s + (c.clicks || 0), 0)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Campaign</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola kampanye marketing & promosi</p>
        </div>
        <button onClick={() => setDrawer({})}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Buat Campaign
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Campaign Aktif',   value: totalActive,                    icon: Megaphone,         cls: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Views',      value: totalViews.toLocaleString('id'), icon: Eye,               cls: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Total Klik',       value: totalClicks.toLocaleString('id'),icon: MousePointerClick, cls: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(({ label, value, icon: Icon, cls, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${cls}`} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
              <p className={`text-xl font-black ${cls}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="skeleton h-14 rounded-xl" />
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Campaign', 'Tipe', 'Target', 'Periode', 'Performa', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map(c => {
                  const types      = parseTypes(c.type)
                  const statusMeta = STATUS_META[c.status] || STATUS_META.draft
                  const targetMeta = TARGET_META[c.target] || { label: c.target }
                  const ctr = c.views > 0 ? ((c.clicks / c.views) * 100).toFixed(1) : '0.0'

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Campaign */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {c.image ? (
                            <img src={getImageUrl(c.image)} alt="" className="w-12 h-9 rounded-lg object-cover border border-slate-200 shrink-0" />
                          ) : (
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                            <Megaphone className="w-4 h-4 text-indigo-500" />
                          </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate max-w-[180px]">{c.title}</p>
                            {c.discountPercent > 0 && (
                              <p className="text-xs text-emerald-600 font-semibold">
                                Diskon {Number(c.discountPercent)}%
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Tipe */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {types.map(t => {
                            const tm = TYPE_META[t] || { label: t, cls: 'bg-slate-100 text-slate-600' }
                            return (
                              <span key={t} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${tm.cls}`}>
                                {tm.label}
                              </span>
                            )
                          })}
                        </div>
                      </td>

                      {/* Target */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <span className="flex items-center gap-1 text-xs text-slate-600">
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {targetMeta.label}
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-semibold">
                            {(c.followersCount || 0)} owner ikut
                          </span>
                        </div>
                      </td>

                      {/* Periode */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{c.startDate ? formatDateShort(c.startDate) : '—'}</span>
                          <span className="text-slate-300">–</span>
                          <span>{c.endDate ? formatDateShort(c.endDate) : '—'}</span>
                        </div>
                      </td>

                      {/* Performa */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                            <span>{(c.views || 0).toLocaleString('id')} views</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MousePointerClick className="w-3.5 h-3.5 text-orange-400" />
                            <span>{(c.clicks || 0).toLocaleString('id')} klik ({ctr}% CTR)</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusMeta.cls}`}>
                          {statusMeta.label}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setDrawer(c)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(c)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {!isLoading && campaigns.length === 0 && (
            <div className="py-16 text-center">
              <Megaphone className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Belum ada campaign</p>
              <p className="text-xs text-slate-400 mt-1">Buat campaign pertama Anda untuk mulai</p>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {drawer !== null && (
        <CampaignFormDrawer
          campaign={drawer?.id ? drawer : null}
          onSave={handleSave}
          onClose={() => setDrawer(null)}
          isSaving={isSaving}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          campaign={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
