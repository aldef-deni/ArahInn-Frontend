import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { interiorDesignApi, adminApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { getImageUrl } from '@/utils'
import { validateImageFile } from '@/utils/imageValidation'
import {
  Plus, Pencil, Trash2, X, Loader2, ImageIcon,
  Film, CheckCircle2, Clock, XCircle, Upload, Sofa, Save,
  MessageCircle, Phone,
} from 'lucide-react'

const MAX_VIDEO_MB = 20
const MIN_RES_INTERIOR_PX = 600

const StatusBadge = ({ status }) => {
  if (status === 'approved') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
      <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
    </span>
  )
  if (status === 'rejected') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full">
      <XCircle className="w-3.5 h-3.5" /> Ditolak
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full">
      <Clock className="w-3.5 h-3.5" /> Menunggu
    </span>
  )
}

export default function AdminInterior() {
  const qc           = useQueryClient()
  const { toast }    = useToast()
  const isSuperAdmin = useAuthStore(s => s.isSuperAdmin())
  const minRes       = MIN_RES_INTERIOR_PX

  const [showModal, setShowModal]     = useState(false)
  const [editing, setEditing]         = useState(null)
  const [form, setForm]               = useState({ title: '', description: '', wa_number: '' })
  const [errors, setErrors]           = useState({})

  const [newImages, setNewImages]             = useState([])
  const [newImagePreviews, setNewImagePreviews] = useState([])
  const [removedImages, setRemovedImages]     = useState([])
  const [newVideos, setNewVideos]             = useState([])
  const [removedVideos, setRemovedVideos]     = useState([])

  const [deleteId, setDeleteId]   = useState(null)
  const [approvingId, setApprovingId] = useState(null)

  const imgInputRef   = useRef()
  const videoInputRef = useRef()

  // ── Query ────────────────────────────────────────────────
  const { data: designs = [], isLoading } = useQuery({
    queryKey: ['admin-interior-designs'],
    queryFn : () => interiorDesignApi.adminList().then(r => r.data.data),
    staleTime: 0,
  })

  // ── Nomor WA konsultasi (global, dipakai tombol "Mulai Konsultasi") ──
  const role      = useAuthStore(s => s.user?.role)
  const canEditWa = ['superadmin', 'admin', 'design_interior'].includes(role)
  const [waNumber, setWaNumber] = useState('')

  const { data: waData } = useQuery({
    queryKey: ['admin-interior-wa'],
    enabled : canEditWa,
    queryFn : () => adminApi.getInteriorWa().then(r => r.data?.data),
    staleTime: 5 * 60 * 1000,
  })
  useEffect(() => { if (waData?.number != null) setWaNumber(waData.number) }, [waData])

  const waMut = useMutation({
    mutationFn: () => adminApi.setInteriorWa({ number: waNumber }),
    onSuccess : (r) => {
      toast({ title: 'Nomor WA disimpan', description: r.data?.message })
      if (r.data?.data?.number) setWaNumber(r.data.data.number)
      qc.invalidateQueries({ queryKey: ['interior-wa'] })
    },
    onError: (e) => toast({ title: 'Gagal menyimpan', description: e?.response?.data?.message || 'Coba lagi.', variant: 'destructive' }),
  })

  // ── Mutations ────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (fd) => editing
      ? interiorDesignApi.update(editing.id, fd)
      : interiorDesignApi.create(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-interior-designs'] })
      qc.invalidateQueries({ queryKey: ['interior-designs-public'] })
      toast({ title: editing ? 'Design interior berhasil diperbarui.' : 'Design interior berhasil ditambahkan.' })
      closeModal()
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Gagal menyimpan.'
      setErrors(e => ({ ...e, general: msg }))
      toast({ title: 'Gagal menyimpan design.', description: msg, variant: 'destructive' })
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id) => interiorDesignApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-interior-designs'] })
      qc.invalidateQueries({ queryKey: ['interior-designs-public'] })
      setApprovingId(null)
      toast({ title: 'Design interior disetujui.' })
    },
    onError: () => toast({ title: 'Gagal menyetujui design.', variant: 'destructive' }),
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => interiorDesignApi.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-interior-designs'] })
      qc.invalidateQueries({ queryKey: ['interior-designs-public'] })
      setApprovingId(null)
      toast({ title: 'Design interior ditolak.' })
    },
    onError: () => toast({ title: 'Gagal menolak design.', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => interiorDesignApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-interior-designs'] })
      qc.invalidateQueries({ queryKey: ['interior-designs-public'] })
      setDeleteId(null)
      toast({ title: 'Design interior berhasil dihapus.' })
    },
    onError: () => toast({ title: 'Gagal menghapus design.', variant: 'destructive' }),
  })

  // ── Helpers ──────────────────────────────────────────────
  const resetForm = () => {
    setForm({ title: '', description: '', wa_number: '' })
    setNewImages([])
    setNewImagePreviews([])
    setRemovedImages([])
    setNewVideos([])
    setRemovedVideos([])
    setErrors({})
  }

  const openAdd = () => { setEditing(null); resetForm(); setShowModal(true) }

  const openEdit = (d) => {
    setEditing(d)
    setForm({ title: d.title, description: d.description || '', wa_number: d.waNumber || d.wa_number || '' })
    setNewImages([]); setNewImagePreviews([]); setRemovedImages([])
    setNewVideos([]); setRemovedVideos([])
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditing(null); resetForm() }

  const onImageChange = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    const errs = []; const valid = []; const previews = []
    for (const f of files) {
      const ext = f.name.split('.').pop().toLowerCase()
      if (!['jpg', 'jpeg'].includes(ext)) { errs.push(`${f.name}: hanya .jpg / .jpeg`); continue }
      const result = await validateImageFile(f, { minResolution: minRes })
      if (!result.valid) { errs.push(result.error); continue }
      valid.push(f)
      previews.push(URL.createObjectURL(f))
    }
    if (errs.length) setErrors(ev => ({ ...ev, images: errs.join(' | ') }))
    else setErrors(ev => ({ ...ev, images: undefined }))
    if (valid.length) {
      setNewImages(prev => [...prev, ...valid])
      setNewImagePreviews(prev => [...prev, ...previews])
    }
  }

  const removeNewImage = (idx) => {
    URL.revokeObjectURL(newImagePreviews[idx])
    setNewImages(prev => prev.filter((_, i) => i !== idx))
    setNewImagePreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const removeExistingImage = (path) => setRemovedImages(prev => [...prev, path])

  const onVideoChange = (e) => {
    const files = Array.from(e.target.files || [])
    const errs = []; const valid = []
    files.forEach(f => {
      const ext = f.name.split('.').pop().toLowerCase()
      if (!['mp4', 'mpg', 'avi'].includes(ext)) { errs.push(`${f.name}: format tidak didukung (hanya .mp4 / .mpg / .avi)`); return }
      if (f.size > MAX_VIDEO_MB * 1024 * 1024) { errs.push(`${f.name}: melebihi ${MAX_VIDEO_MB} MB`); return }
      valid.push(f)
    })
    setErrors(ev => ({ ...ev, video: errs.length ? errs.join('\n') : undefined }))
    if (valid.length) setNewVideos(prev => [...prev, ...valid])
    e.target.value = ''
  }

  const removeNewVideo      = (idx)  => setNewVideos(prev => prev.filter((_, i) => i !== idx))
  const removeExistingVideo = (path) => setRemovedVideos(prev => [...prev, path])

  const keptImages = (design) => (design?.images || []).filter(p => !removedImages.includes(p))
  const keptVideos = (design) => (design?.videos || []).filter(p => !removedVideos.includes(p))

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Judul wajib diisi.'
    const existingKept = (editing?.images || []).filter(p => !removedImages.includes(p))
    if (existingKept.length === 0 && newImages.length === 0) e.images = 'Upload minimal 1 gambar.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('description', form.description)
    fd.append('wa_number', form.wa_number)
    newImages.forEach(f => fd.append('images[]', f))
    newVideos.forEach(f => fd.append('videos[]', f))
    removedImages.forEach(p => fd.append('remove_images[]', p))
    removedVideos.forEach(p => fd.append('remove_videos[]', p))
    saveMutation.mutate(fd)
  }

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Furnish & Design Interior</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isSuperAdmin
              ? 'Kelola dan setujui desain yang diajukan owner.'
              : 'Ajukan desain interior untuk ditampilkan di galeri.'}
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Tambah Desain
        </button>
      </div>

      {/* WhatsApp konsultasi (global) */}
      {canEditWa && (
        <div className="bg-white border rounded-2xl shadow-card p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-slate-900 text-sm">Nomor WhatsApp Konsultasi</h2>
              <p className="text-xs text-slate-500 mt-0.5 mb-3">
                Dipakai tombol <strong>"Mulai Konsultasi"</strong> di halaman Design Interior publik.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <input value={waNumber} onChange={e => setWaNumber(e.target.value)} inputMode="tel"
                    placeholder="6282181111618 / 0821..."
                    className="bg-transparent outline-none text-sm w-48" />
                </div>
                <button onClick={() => waMut.mutate()} disabled={waMut.isPending || !waNumber.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50">
                  {waMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
                </button>
                {waNumber.trim() && (
                  <a href={`https://wa.me/${waNumber.replace(/\D+/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-green-600 font-semibold">Tes buka WA →</a>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Format bebas (0821…, +62…, 62…) — otomatis dinormalisasi ke 62xxxx saat disimpan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border rounded-2xl shadow-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {['Gambar', 'Judul', 'Video', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {designs.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">

                    {/* Gambar */}
                    <td className="px-4 py-3">
                      {(d.images || []).length > 0 ? (
                        <div className="relative shrink-0 w-fit">
                          <img
                            src={getImageUrl(d.images[0])}
                            alt={d.title}
                            className="w-16 h-14 object-cover rounded-xl border-2 border-orange-200 shadow-sm"
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                          />
                          <div className="w-16 h-14 rounded-xl border-2 border-slate-200 bg-slate-100 items-center justify-center hidden">
                            <ImageIcon className="w-5 h-5 text-slate-300" />
                          </div>
                          {(d.images || []).length > 1 && (
                            <span className="absolute -bottom-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shadow">
                              +{d.images.length - 1}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-16 h-14 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-slate-300" />
                        </div>
                      )}
                    </td>

                    {/* Judul */}
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px]">
                      <p className="truncate">{d.title}</p>
                      {d.description && <p className="text-xs text-slate-400 truncate mt-0.5">{d.description}</p>}
                    </td>

                    {/* Video */}
                    <td className="px-4 py-3">
                      {(d.videos || []).length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                          <Film className="w-3.5 h-3.5" /> {(d.videos || []).length} file
                        </span>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} />
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Approve / Reject — superadmin only, hanya untuk pending */}
                        {isSuperAdmin && d.status === 'pending' && (
                          <>
                            <button
                              onClick={() => { setApprovingId(d.id); approveMutation.mutate(d.id) }}
                              disabled={approveMutation.isPending && approvingId === d.id}
                              className="px-2.5 py-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
                              {approveMutation.isPending && approvingId === d.id ? '...' : 'Setujui'}
                            </button>
                            <button
                              onClick={() => { setApprovingId(d.id); rejectMutation.mutate(d.id) }}
                              disabled={rejectMutation.isPending && approvingId === d.id}
                              className="px-2.5 py-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
                              {rejectMutation.isPending && approvingId === d.id ? '...' : 'Tolak'}
                            </button>
                          </>
                        )}
                        {isSuperAdmin && d.status === 'approved' && (
                          <button
                            onClick={() => { setApprovingId(d.id); rejectMutation.mutate(d.id) }}
                            disabled={rejectMutation.isPending && approvingId === d.id}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-xs font-semibold rounded-lg transition-colors">
                            Nonaktifkan
                          </button>
                        )}
                        {isSuperAdmin && d.status === 'rejected' && (
                          <button
                            onClick={() => { setApprovingId(d.id); approveMutation.mutate(d.id) }}
                            disabled={approveMutation.isPending && approvingId === d.id}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-green-50 hover:text-green-600 text-slate-500 text-xs font-semibold rounded-lg transition-colors">
                            Aktifkan
                          </button>
                        )}
                        <button onClick={() => openEdit(d)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(d.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
            {!designs.length && (
              <div className="py-16 text-center text-slate-400 text-sm">
                Belum ada desain. Klik "Tambah Desain" untuk memulai.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Side Drawer Tambah / Edit ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={closeModal} />
          <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-slide-in-right">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Sofa className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">{editing ? 'Edit Desain' : 'Tambah Desain Baru'}</h2>
                  <p className="text-xs text-slate-500">
                    {editing ? 'Perbarui data desain interior' : 'Desain akan menunggu persetujuan superadmin'}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 overflow-y-auto space-y-5 flex-1">
              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{errors.general}</div>
              )}

              {/* Info pending untuk non-superadmin */}
              {!isSuperAdmin && (
                <div className="flex items-start gap-2.5 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Desain yang ditambahkan akan menunggu persetujuan dari superadmin sebelum tampil di galeri.</span>
                </div>
              )}

              {/* Judul */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Judul <span className="text-red-500">*</span></label>
                <input type="text" placeholder="cth. Ruang Tamu Modern Minimalis"
                  value={form.title} onChange={e => upd('title', e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${errors.title ? 'border-red-400' : 'border-slate-200'}`} />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Deskripsi
                  <span className="text-slate-400 font-normal ml-1 text-xs">(opsional)</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Jelaskan konsep, material, ruangan yang dikerjakan, dll."
                  value={form.description}
                  onChange={e => upd('description', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none leading-relaxed"
                />
              </div>

              {/* Nomor WhatsApp */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Nomor WhatsApp Penawaran
                  <span className="text-slate-400 font-normal ml-1 text-xs">(digunakan tombol "Minta Penawaran")</span>
                </label>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-300">
                  <span className="px-3.5 py-2.5 bg-slate-50 text-slate-500 text-sm border-r border-slate-200 shrink-0">+62</span>
                  <input
                    type="tel"
                    placeholder="81234567890"
                    value={form.wa_number.replace(/^\+?62/, '')}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '')
                      upd('wa_number', raw ? `62${raw}` : '')
                    }}
                    className="flex-1 px-3.5 py-2.5 text-sm focus:outline-none bg-white"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Kosongkan jika menggunakan nomor default Arahinn.</p>
              </div>

              {/* Gambar */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Gambar <span className="text-red-500">*</span>
                  <span className="text-slate-400 font-normal ml-1 text-xs">(.jpg / .jpeg · min. resolusi {minRes} px · maks 5 MB per foto)</span>
                </label>
                {editing && keptImages(editing).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {keptImages(editing).map((path, i) => (
                      <div key={i} className="relative group">
                        <img src={getImageUrl(path)} alt="" className="w-20 h-16 object-cover rounded-lg border"
                          onError={e => { e.target.src = 'https://placehold.co/80x64/f1f5f9/94a3b8?text=IMG' }} />
                        <button type="button" onClick={() => removeExistingImage(path)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {newImagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newImagePreviews.map((src, i) => (
                      <div key={i} className="relative group">
                        <img src={src} alt="" className="w-20 h-16 object-cover rounded-lg border-2 border-orange-300" />
                        <button type="button" onClick={() => removeNewImage(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => imgInputRef.current?.click()}
                  className={`flex items-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-xl text-sm transition-colors w-full justify-center
                    ${errors.images ? 'border-red-400 text-red-500' : 'border-slate-300 hover:border-orange-400 text-slate-500 hover:text-orange-500'}`}>
                  <Upload className="w-4 h-4" /> Upload Gambar (bisa pilih lebih dari 1)
                </button>
                <input ref={imgInputRef} type="file" accept=".jpg,.jpeg" multiple className="hidden" onChange={onImageChange} />
                {errors.images && <p className="text-xs text-red-500 mt-1">{errors.images}</p>}
              </div>

              {/* Video */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Video
                  <span className="text-slate-400 font-normal ml-1 text-xs">(opsional · .mp4 / .mpg / .avi · maks {MAX_VIDEO_MB} MB per file)</span>
                </label>
                {editing && keptVideos(editing).length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {keptVideos(editing).map((path, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                        <Film className="w-4 h-4 text-blue-500 shrink-0" />
                        <a href={getImageUrl(path)} target="_blank" rel="noreferrer"
                          className="text-sm text-blue-600 underline flex-1 truncate">{path.split('/').pop()}</a>
                        <button type="button" onClick={() => removeExistingVideo(path)} className="text-red-400 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {newVideos.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {newVideos.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 bg-green-50 rounded-xl border border-green-100">
                        <Film className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="text-sm text-green-700 flex-1 truncate">{f.name}</span>
                        <span className="text-xs text-slate-400 shrink-0">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                        <button type="button" onClick={() => removeNewVideo(i)} className="text-red-400 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => videoInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl text-sm text-slate-500 hover:text-blue-500 transition-colors w-full justify-center">
                  <Upload className="w-4 h-4" /> Upload Video (bisa pilih lebih dari 1)
                </button>
                <input ref={videoInputRef} type="file" accept=".mp4,.mpg,.mpeg,.avi" multiple className="hidden" onChange={onVideoChange} />
                {errors.video && (
                  <div className="mt-1.5 p-2 bg-red-50 rounded-lg">
                    {errors.video.split('\n').map((msg, i) => <p key={i} className="text-xs text-red-500">{msg}</p>)}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex gap-3 shrink-0">
              <button onClick={closeModal}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button onClick={handleSubmit} disabled={saveMutation.isPending}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                {saveMutation.isPending
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
                  : <><Save className="w-4 h-4" /> {editing ? 'Simpan Perubahan' : 'Ajukan Desain'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Konfirmasi Hapus ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Hapus Desain?</h3>
            <p className="text-sm text-slate-500 mb-6">Semua gambar dan video terkait juga akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
