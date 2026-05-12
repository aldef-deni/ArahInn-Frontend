import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { userApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { getImageUrl } from '@/utils'
import {
  Search, Plus, Pencil, Trash2, X, Save,
  User, Mail, Phone, Lock, Eye, EyeOff,
  ChevronLeft, ChevronRight, Hotel, AlertTriangle,
  Building2, CheckCircle2,
} from 'lucide-react'

const getRole = (u) => u?.roles?.[0]?.name || u?.role || 'user'

// ── Owner Form Drawer ─────────────────────────────────────────────────────
function OwnerFormDrawer({ editUser, onClose }) {
  const { toast } = useToast()
  const qc        = useQueryClient()
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: editUser ? {
      name    : editUser.name,
      email   : editUser.email,
      phone   : editUser.phone || '',
      isActive: editUser.isActive !== false,
    } : { role: 'owner', isActive: true },
  })

  const saveMutation = useMutation({
    mutationFn: (d) => editUser
      ? userApi.adminUpdate(editUser.id, d)
      : userApi.create({ ...d, role: 'owner' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-owners'] })
      toast({ title: editUser ? 'Data owner diperbarui.' : 'Akun owner berhasil dibuat.' })
      onClose()
    },
    onError: (e) => toast({
      title: 'Gagal menyimpan',
      description: e?.response?.data?.message || 'Terjadi kesalahan.',
      variant: 'destructive',
    }),
  })

  const onSubmit = (data) => {
    const payload = { ...data }
    if (!payload.password) delete payload.password
    saveMutation.mutate(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-[440px] bg-white shadow-2xl flex flex-col h-full animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">
                {editUser ? 'Edit Owner' : 'Tambah Owner Akomodasi'}
              </h2>
              <p className="text-xs text-slate-500">
                {editUser ? editUser.email : 'Buat akun baru dengan role Owner'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Info box */}
            {!editUser && (
              <div className="flex gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Akun owner akan dapat mengakses <strong>portal Extranet</strong> untuk mengelola properti akomodasi mereka.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('name', { required: 'Nama wajib diisi' })}
                  placeholder="Nama pemilik properti"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('email', {
                  required: 'Email wajib diisi',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Format email tidak valid' },
                })} type="email" placeholder="email@contoh.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nomor Telepon / WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('phone')} type="tel" placeholder="08xxxxxxxxxx"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password {!editUser && <span className="text-red-500">*</span>}
                {editUser && <span className="text-xs text-slate-400 font-normal ml-1">Kosongkan jika tidak diubah</span>}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('password', {
                  required: editUser ? false : 'Password wajib diisi',
                  minLength: { value: 6, message: 'Minimal 6 karakter' },
                })} type={showPass ? 'text' : 'password'}
                  placeholder={editUser ? '••••••••' : 'Minimal 6 karakter'}
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status Akun</label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" {...register('isActive')} className="sr-only peer" />
                  <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-all peer-checked:translate-x-5" />
                </div>
                <span className="text-sm text-slate-600">Akun aktif (dapat login ke Extranet)</span>
              </label>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors">
              Batal
            </button>
            <button type="submit" disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm">
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Menyimpan...' : editUser ? 'Simpan Perubahan' : 'Buat Akun Owner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete Confirm ────────────────────────────────────────────────────────
function DeleteConfirm({ target, onClose }) {
  const { toast } = useToast()
  const qc        = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => userApi.delete(target.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-owners'] })
      toast({ title: `Akun "${target.name}" berhasil dihapus.` })
      onClose()
    },
    onError: (e) => toast({
      title: 'Gagal menghapus',
      description: e?.response?.data?.message,
      variant: 'destructive',
    }),
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Hapus Akun Owner?</h3>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
            {target.name?.[0]?.toUpperCase()}
          </div>
          <span className="font-medium text-slate-800">{target.name}</span>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          {target.email}<br />
          Data properti & booking terkait tidak akan ikut terhapus.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
            {mutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function AdminOwners() {
  const { user: me } = useAuthStore()
  const { toast }    = useToast()
  const qc           = useQueryClient()
  const isSuperAdmin = me?.role === 'superadmin'

  const [search,    setSearch] = useState('')
  const [status,    setStatus] = useState('')
  const [page,      setPage]   = useState(1)
  const [drawer,    setDrawer] = useState(null)
  const [delTarget, setDel]    = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-owners', search, status, page],
    queryFn : () => userApi.getAll({
      role  : 'owner',
      search: search || undefined,
      active: status || undefined,
      page, limit: 12,
    }).then(r => r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => userApi.toggleStatus(id),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-owners'] })
      toast({ title: 'Status akun diperbarui.' })
    },
    onError: () => toast({ title: 'Gagal memperbarui status.', variant: 'destructive' }),
  })

  const owners     = data?.data || []
  const totalPages = data?.pagination?.totalPages || 1

  return (
    <div className="space-y-5">

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Owner Terdaftar', value: data?.pagination?.total || 0,                                    icon: '🏨' },
          { label: 'Akun Aktif',            value: owners.filter(u => u.isActive !== false).length,                 icon: '✅' },
          { label: 'Akun Nonaktif',         value: owners.filter(u => u.isActive === false).length,                 icon: '🔒' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white border rounded-2xl p-5 shadow-card">
            <p className="text-2xl mb-2">{icon}</p>
            <p className="font-display text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Owner Akomodasi</h3>
              <p className="text-xs text-slate-400">{data?.pagination?.total ?? 0} owner terdaftar</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Cari owner..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
          </div>

          {/* Status filter */}
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30">
            <option value="">Semua Status</option>
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </select>

          {isSuperAdmin && (
            <button onClick={() => setDrawer('new')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Tambah Owner
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Owner', 'Email', 'Telepon', 'Hotel Terdaftar', 'Status', 'Bergabung', isSuperAdmin ? 'Aksi' : ''].filter(Boolean).map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? Array(6).fill(0).map((_, i) => (
                    <tr key={i}>{Array(isSuperAdmin ? 7 : 6).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3.5"><div className="skeleton h-4 rounded-lg" /></td>
                    ))}</tr>
                  ))
                : owners.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm shrink-0 overflow-hidden">
                            {u.avatar
                              ? <img src={getImageUrl(u.avatar)} alt="" className="w-9 h-9 object-cover" />
                              : u.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 whitespace-nowrap">{u.name}</p>
                            {u.id === me?.id && <span className="text-[10px] text-brand font-medium">Anda</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">{u.email}</td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{u.phone || '–'}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Hotel className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-700">
                            {u.hotelsCount ?? u.hotels?.length ?? '–'}
                          </span>
                          <span className="text-xs text-slate-400">properti</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {u.id === me?.id ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Aktif
                          </span>
                        ) : (
                          <button
                            onClick={() => toggleMutation.mutate(u.id)}
                            disabled={toggleMutation.isPending}
                            title={u.isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 hover:opacity-80 active:scale-95 ${
                              u.isActive !== false
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {u.isActive !== false ? 'Aktif' : 'Nonaktif'}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '–'}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setDrawer(u)} title="Edit"
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            {u.id !== me?.id && (
                              <button onClick={() => setDel(u)} title="Hapus"
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
              }
            </tbody>
          </table>

          {!isLoading && !owners.length && (
            <div className="py-16 text-center">
              <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Belum ada owner akomodasi terdaftar.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 px-4 py-3 border-t border-slate-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-medium border transition-colors ${
                  page === p ? 'bg-brand text-white border-brand' : 'border-slate-200 hover:bg-slate-50'
                }`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Drawer */}
      {drawer && (
        <OwnerFormDrawer
          editUser={drawer === 'new' ? null : drawer}
          onClose={() => setDrawer(null)}
        />
      )}

      {/* Delete confirm */}
      {delTarget && (
        <DeleteConfirm
          target={delTarget}
          onClose={() => setDel(null)}
        />
      )}

    </div>
  )
}
