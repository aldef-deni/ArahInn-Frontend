import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, X, Trash2, Pencil, Image as ImageIcon, Video, Link2, Loader2,
  MonitorSmartphone, Globe, Smartphone, Layers, CheckCircle2, AlertCircle, Eye, EyeOff,
} from 'lucide-react'
import { popupApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { getImageUrl } from '@/utils/index'

/** Halaman publik yang bisa dipilih untuk penayangan popup. */
const PAGE_OPTIONS = [
  { path: '/',              label: 'Beranda' },
  { path: '/search',        label: 'Cari Penginapan' },
  { path: '/hotel',         label: 'Detail Akomodasi' },
  { path: '/properti',      label: 'Properti Jual-Beli' },
  { path: '/interior',      label: 'Design Interior' },
  { path: '/tiket/pesawat', label: 'Tiket Pesawat' },
  { path: '/tiket/kereta',  label: 'Tiket KAI' },
  { path: '/tiket/pelni',   label: 'Tiket PELNI' },
  { path: '/topup-tagihan', label: 'Top Up & Tagihan' },
  { path: '/promo',         label: 'Promo & Flash Sale' },
  { path: '/orders',        label: 'Pesanan Saya' },
]

const PLATFORMS = [
  { val: 'all',    label: 'Semua',  icon: Layers },
  { val: 'web',    label: 'Web',    icon: Globe },
  { val: 'mobile', label: 'Mobile', icon: Smartphone },
]

const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-shadow'
const labelCls = 'block text-xs font-bold text-slate-600 mb-1.5'

export default function AdminPopups() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  const { data: popups = [], isLoading } = useQuery({
    queryKey: ['admin-popups'],
    queryFn : () => popupApi.getAll().then(r => r.data?.data ?? []),
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-popups'] })

  const delMutation = useMutation({
    mutationFn: (id) => popupApi.remove(id),
    onSuccess : () => { setConfirmDel(null); refresh(); toast({ title: 'Popup dihapus' }) },
    onError   : (e) => toast({ title: 'Gagal menghapus', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  // Tayangkan / nonaktifkan tanpa membuka form
  const toggleMutation = useMutation({
    mutationFn: (p) => {
      const fd = new FormData()
      fd.append('title', p.title ?? '')
      fd.append('description', p.description ?? '')
      fd.append('url', p.url ?? '')
      fd.append('button_text', p.buttonText ?? '')
      fd.append('display_scope', p.displayScope ?? 'all')
      fd.append('pages', JSON.stringify(p.pages ?? []))
      fd.append('platform', p.platform ?? 'all')
      fd.append('sort_order', String(p.sortOrder ?? 0))
      fd.append('is_active', p.isActive ? '0' : '1')
      return popupApi.update(p.id, fd)
    },
    onSuccess: () => { refresh(); toast({ title: 'Status penayangan diperbarui' }) },
    onError  : (e) => toast({ title: 'Gagal', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit   = (p) => { setEditing(p); setFormOpen(true) }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MonitorSmartphone className="w-5 h-5 text-indigo-600" /> Popup Website
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Popup promosi yang tampil di website ArahInn dan aplikasi mobile.
          </p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm">
          <Plus className="w-4 h-4" /> Buat Popup
        </button>
      </div>

      {/* Daftar */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : popups.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <MonitorSmartphone className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-900">Belum ada popup</h3>
          <p className="text-sm text-slate-500 mt-1">Buat popup pertama untuk menyapa pengunjung.</p>
          <button onClick={openCreate} className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
            Buat Popup
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {popups.map(p => (
            <PopupCard
              key={p.id} popup={p}
              onEdit={() => openEdit(p)}
              onDelete={() => setConfirmDel(p)}
              onToggle={() => toggleMutation.mutate(p)}
              toggling={toggleMutation.isPending}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <PopupForm
          popup={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); refresh() }}
        />
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Hapus popup ini?</h3>
            <p className="text-sm text-slate-500 mb-5">{confirmDel.title} akan dihapus permanen.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDel(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button onClick={() => delMutation.mutate(confirmDel.id)} disabled={delMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors">
                {delMutation.isPending ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Kartu popup ─────────────────────────────────────────────────────── */
function PopupCard({ popup, onEdit, onDelete, onToggle, toggling }) {
  const img = getImageUrl(popup.image)
  const scopeLabel = popup.displayScope === 'selected'
    ? `${(popup.pages ?? []).length} halaman`
    : 'Semua halaman'
  const platform = PLATFORMS.find(x => x.val === (popup.platform ?? 'all')) ?? PLATFORMS[0]
  const PIcon = platform.icon

  return (
    <div className={`group relative bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${
      popup.isActive ? 'border-slate-200' : 'border-slate-200 opacity-70'
    }`}>
      <div className="flex gap-3 p-3">
        <div className="w-24 h-24 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
          {img
            ? <img src={img} alt={popup.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            : popup.video
              ? <Video className="w-7 h-7 text-slate-300" />
              : <ImageIcon className="w-7 h-7 text-slate-300" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="font-bold text-sm text-slate-900 line-clamp-1 flex-1">{popup.title}</h3>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              popup.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {popup.isActive ? 'Tayang' : 'Nonaktif'}
            </span>
          </div>

          {popup.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{popup.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-100">
              <Layers className="w-3 h-3" /> {scopeLabel}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              <PIcon className="w-3 h-3" /> {platform.label}
            </span>
            {popup.url && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                <Link2 className="w-3 h-3" /> CTA
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex border-t border-slate-100 divide-x divide-slate-100">
        <button onClick={onToggle} disabled={toggling}
          className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
          {popup.isActive
            ? <><EyeOff className="w-3.5 h-3.5" /> Nonaktifkan</>
            : <><Eye className="w-3.5 h-3.5" /> Tayangkan</>}
        </button>
        <button onClick={onEdit}
          className="flex-1 py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1.5">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <button onClick={onDelete}
          className="flex-1 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
          <Trash2 className="w-3.5 h-3.5" /> Hapus
        </button>
      </div>
    </div>
  )
}

/* ── Form (panel slide-over) ─────────────────────────────────────────── */
function PopupForm({ popup, onClose, onSaved }) {
  const { toast } = useToast()
  const isEdit = !!popup
  const imgRef = useRef(null)
  const vidRef = useRef(null)

  const [form, setForm] = useState({
    title       : popup?.title ?? '',
    description : popup?.description ?? '',
    url         : popup?.url ?? '',
    buttonText  : popup?.buttonText ?? '',
    displayScope: popup?.displayScope ?? 'all',
    pages       : popup?.pages ?? [],
    platform    : popup?.platform ?? 'all',
    sortOrder   : popup?.sortOrder ?? 0,
    isActive    : popup?.isActive ?? true,
  })
  const [imageFile, setImageFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [removeVideo, setRemoveVideo] = useState(false)
  const [preview, setPreview] = useState({
    image: getImageUrl(popup?.image),
    video: getImageUrl(popup?.video),
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Esc menutup + kunci scroll latar
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const pickFile = (kind, file) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    if (kind === 'image') {
      setImageFile(file); setRemoveImage(false); setPreview(p => ({ ...p, image: url }))
    } else {
      setVideoFile(file); setRemoveVideo(false); setPreview(p => ({ ...p, video: url }))
    }
  }

  const clearFile = (kind) => {
    if (kind === 'image') {
      setImageFile(null); setRemoveImage(true); setPreview(p => ({ ...p, image: null }))
      if (imgRef.current) imgRef.current.value = ''
    } else {
      setVideoFile(null); setRemoveVideo(true); setPreview(p => ({ ...p, video: null }))
      if (vidRef.current) vidRef.current.value = ''
    }
  }

  const togglePage = (path) => {
    set('pages', form.pages.includes(path)
      ? form.pages.filter(p => p !== path)
      : [...form.pages, path])
  }

  const save = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('title', form.title.trim())
      fd.append('description', form.description ?? '')
      fd.append('url', form.url ?? '')
      fd.append('button_text', form.buttonText ?? '')
      fd.append('display_scope', form.displayScope)
      fd.append('pages', JSON.stringify(form.displayScope === 'selected' ? form.pages : []))
      fd.append('platform', form.platform)
      fd.append('sort_order', String(form.sortOrder || 0))
      fd.append('is_active', form.isActive ? '1' : '0')
      if (imageFile) fd.append('image', imageFile)
      if (videoFile) fd.append('video', videoFile)
      if (removeImage) fd.append('remove_image', '1')
      if (removeVideo) fd.append('remove_video', '1')
      return isEdit ? popupApi.update(popup.id, fd) : popupApi.create(fd)
    },
    onSuccess: () => { toast({ title: isEdit ? 'Popup diperbarui' : 'Popup dibuat' }); onSaved() },
    onError  : (e) => toast({
      title: 'Gagal menyimpan',
      description: e?.response?.data?.message ?? 'Periksa isian Anda.',
      variant: 'destructive',
    }),
  })

  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast({ title: 'Judul wajib diisi', variant: 'destructive' })
    if (form.displayScope === 'selected' && form.pages.length === 0)
      return toast({ title: 'Pilih minimal satu halaman', variant: 'destructive' })
    save.mutate()
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}>

        {/* Header panel */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <MonitorSmartphone className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{isEdit ? 'Edit Popup' : 'Buat Popup'}</h2>
              <p className="text-[11px] text-slate-500">Tayang di web dan aplikasi mobile</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Isi form */}
        <form onSubmit={submit} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div>
            <label className={labelCls}>Judul <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Mis. Promo Akhir Tahun" maxLength={150} />
          </div>

          <div>
            <label className={labelCls}>Teks Deskripsi</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={form.description}
              onChange={e => set('description', e.target.value)} maxLength={2000}
              placeholder="Kalimat singkat yang menjelaskan penawaran..." />
          </div>

          {/* Media */}
          <div className="grid sm:grid-cols-2 gap-4">
            <MediaBox
              label="Gambar" hint="JPG/PNG/WebP - maks 4 MB" icon={ImageIcon}
              inputRef={imgRef} accept="image/*" kind="image"
              onPick={(f) => pickFile('image', f)} onClear={() => clearFile('image')}
              preview={preview.image}
            />
            <MediaBox
              label="Video" hint="MP4/WebM - maks 10 MB" icon={Video}
              inputRef={vidRef} accept="video/*" kind="video"
              onPick={(f) => pickFile('video', f)} onClear={() => clearFile('video')}
              preview={preview.video}
            />
          </div>

          {/* CTA */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>URL Tujuan</label>
              <input className={inputCls} value={form.url} onChange={e => set('url', e.target.value)}
                placeholder="https://market.arahinn.com/" />
            </div>
            <div>
              <label className={labelCls}>Teks Tombol</label>
              <input className={inputCls} value={form.buttonText} onChange={e => set('buttonText', e.target.value)}
                placeholder="Lihat Promo" maxLength={60} />
            </div>
          </div>

          {/* Modul penayangan */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <label className={labelCls}>Modul Penayangan</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { val: 'all',      label: 'Semua halaman' },
                { val: 'selected', label: 'Halaman tertentu' },
              ].map(opt => (
                <button key={opt.val} type="button" onClick={() => set('displayScope', opt.val)}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    form.displayScope === opt.val
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>

            {form.displayScope === 'selected' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {PAGE_OPTIONS.map(pg => {
                  const on = form.pages.includes(pg.path)
                  return (
                    <button key={pg.path} type="button" onClick={() => togglePage(pg.path)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all ${
                        on
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${on ? 'text-indigo-600' : 'text-slate-300'}`} />
                      <span className="truncate">{pg.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Platform */}
          <div>
            <label className={labelCls}>Tampilkan di</label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map(pf => {
                const PIcon = pf.icon
                const on = form.platform === pf.val
                return (
                  <button key={pf.val} type="button" onClick={() => set('platform', pf.val)}
                    className={`py-2.5 rounded-xl text-sm font-bold border flex items-center justify-center gap-1.5 transition-all ${
                      on ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}>
                    <PIcon className="w-4 h-4" /> {pf.label}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Aplikasi ArahInn mobile membaca popup yang sama lewat API.
            </p>
          </div>

          {/* Urutan + status */}
          <div className="grid sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className={labelCls}>Urutan Tampil</label>
              <input type="number" min={0} className={inputCls} value={form.sortOrder}
                onChange={e => set('sortOrder', Number(e.target.value))} />
              <p className="text-[11px] text-slate-400 mt-1">Angka kecil tampil lebih dulu.</p>
            </div>
            <button type="button" onClick={() => set('isActive', !form.isActive)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                form.isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
              }`}>
              <span className={`text-sm font-bold ${form.isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                {form.isActive ? 'Tayang' : 'Nonaktif'}
              </span>
              <span className={`relative w-10 h-6 rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isActive ? 'left-[18px]' : 'left-0.5'}`} />
              </span>
            </button>
          </div>
        </form>

        {/* Footer panel */}
        <div className="flex gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} type="button"
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button onClick={submit} disabled={save.isPending}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {save.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
              : (isEdit ? 'Simpan Perubahan' : 'Buat Popup')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Kotak upload media ──────────────────────────────────────────────── */
function MediaBox({ label, hint, icon: Icon, inputRef, accept, onPick, onClear, preview, kind }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 overflow-hidden hover:border-indigo-300 transition-colors">
        {preview ? (
          <>
            {kind === 'image'
              ? <img src={preview} alt={label} className="w-full h-32 object-cover" />
              : <video src={preview} className="w-full h-32 object-cover" muted playsInline />}
            <button type="button" onClick={onClear}
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-red-600/90 text-white flex items-center justify-center hover:bg-red-700 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()}
            className="w-full h-32 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-indigo-500 transition-colors">
            <Icon className="w-6 h-6" />
            <span className="text-xs font-semibold">Pilih {label}</span>
          </button>
        )}
      </div>
      <p className="text-[11px] text-slate-400 mt-1">{hint}</p>
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])} />
    </div>
  )
}
