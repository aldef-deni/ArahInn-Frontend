import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { userApi } from '@/services/index'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { getImageUrl } from '@/utils'
import {
  Search, Plus, Pencil, Trash2,
  X, Save, User, Mail, Phone, Lock, Shield, AlertTriangle,
  Eye, EyeOff, ChevronLeft, ChevronRight, Users, UserCog,
} from 'lucide-react'

// ── Constants ────────────────────────────────────────────────────────────
const PENGELOLA_ROLES = ['superadmin', 'admin', 'finance', 'design_interior']

const ROLE_META = {
  superadmin     : { label: 'Super Admin',     cls: 'bg-red-100    text-red-700'    },
  admin          : { label: 'Market Manager',  cls: 'bg-purple-100 text-purple-700' },
  owner          : { label: 'Hotel Owner',     cls: 'bg-blue-100   text-blue-700'   },
  finance        : { label: 'Finance Staff',   cls: 'bg-green-100  text-green-700'  },
  admin_property : { label: 'Admin Property',  cls: 'bg-indigo-100 text-indigo-700' },
  design_interior: { label: 'Design Interior', cls: 'bg-orange-100 text-orange-700' },
  user           : { label: 'User',            cls: 'bg-slate-100  text-slate-600'  },
}

const getRole = (u) => u?.roles?.[0]?.name || u?.role || 'user'

// ── UserFormDrawer ────────────────────────────────────────────────────────
function UserFormDrawer({ user: editUser, defaultRole = 'user', roleOptions, onClose }) {
  const { toast } = useToast()
  const qc        = useQueryClient()
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: editUser ? {
      name    : editUser.name,
      email   : editUser.email,
      phone   : editUser.phone || '',
      role    : getRole(editUser),
      isActive: editUser.isActive !== false,
    } : { role: defaultRole, isActive: true },
  })

  const saveMutation = useMutation({
    mutationFn: (d) => editUser ? userApi.adminUpdate(editUser.id, d) : userApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users-pengelola'] })
      qc.invalidateQueries({ queryKey: ['admin-users-pengguna'] })
      toast({ title: editUser ? 'Pengguna berhasil diperbarui.' : 'Pengguna berhasil ditambahkan.' })
      onClose()
    },
    onError: (e) => toast({
      title      : 'Gagal menyimpan',
      description: e?.response?.data?.message || 'Terjadi kesalahan.',
      variant    : 'destructive',
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
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
              <User className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{editUser ? 'Edit Pengguna' : 'Tambah Pengguna'}</h2>
              <p className="text-xs text-slate-500">{editUser ? editUser.email : 'Buat akun baru'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('name', { required: 'Nama wajib diisi' })} placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('email', { required: 'Email wajib diisi', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Format email tidak valid' } })}
                  type="email" placeholder="email@contoh.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password {!editUser && <span className="text-red-500">*</span>}
                {editUser && <span className="text-xs text-slate-400 font-normal ml-1">Kosongkan jika tidak diubah</span>}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('password', { required: editUser ? false : 'Password wajib diisi', minLength: { value: 6, message: 'Minimal 6 karakter' } })}
                  type={showPass ? 'text' : 'password'} placeholder={editUser ? '••••••••' : 'Minimal 6 karakter'}
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor Telepon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('phone')} type="tel" placeholder="08xxxxxxxxxx"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Role <span className="text-red-500">*</span></label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select {...register('role', { required: 'Role wajib dipilih' })}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand appearance-none">
                  {(roleOptions || PENGELOLA_ROLES).map(r => (
                    <option key={r} value={r}>{ROLE_META[r]?.label || r}</option>
                  ))}
                </select>
              </div>
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status Akun</label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" {...register('isActive')} className="sr-only peer" />
                  <div className="w-10 h-5.5 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-all peer-checked:translate-x-[18px]" />
                </div>
                <span className="text-sm text-slate-600">Akun aktif</span>
              </label>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors">
              Batal
            </button>
            <button type="submit" disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm">
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Menyimpan...' : editUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── DeleteConfirm ─────────────────────────────────────────────────────────
function DeleteUserConfirm({ user: targetUser, onClose }) {
  const { toast } = useToast()
  const qc        = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => userApi.delete(targetUser.id),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-users-pengelola'] })
      qc.invalidateQueries({ queryKey: ['admin-users-pengguna'] })
      toast({ title: `Pengguna "${targetUser.name}" berhasil dihapus.` })
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
        <h3 className="text-lg font-bold text-slate-900 mb-1">Hapus Pengguna?</h3>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-sm">
            {targetUser.name?.[0]?.toUpperCase()}
          </div>
          <span className="font-medium text-slate-800">{targetUser.name}</span>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          {targetUser.email}<br />
          Semua data terkait tidak akan ikut terhapus (booking, chat, dll).
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

// ── UserTable ─────────────────────────────────────────────────────────────
function UserTable({ users, isLoading, me, isSuperAdmin, toggleMutation, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {['Pengguna', 'Email', 'Role', 'Status', 'Bergabung'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
            {isSuperAdmin && (
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Aksi</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading
            ? Array(5).fill(0).map((_, i) => (
                <tr key={i}>{Array(isSuperAdmin ? 6 : 5).fill(0).map((_, j) => (
                  <td key={j} className="px-4 py-3.5"><div className="skeleton h-4 rounded-lg" /></td>
                ))}</tr>
              ))
            : users.map(u => {
                const currentRole = getRole(u)
                const roleMeta    = ROLE_META[currentRole] || ROLE_META.user
                const isSelf      = u.id === me?.id

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-sm shrink-0 overflow-hidden">
                          {u.avatar ? <img src={getImageUrl(u.avatar)} alt="" className="w-9 h-9 object-cover" /> : u.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 whitespace-nowrap">{u.name}</p>
                          {isSelf && <span className="text-[10px] text-brand font-medium">Anda</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${roleMeta.cls}`}>
                        {roleMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {isSelf ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Aktif
                        </span>
                      ) : (
                        <button onClick={() => toggleMutation.mutate(u.id)} disabled={toggleMutation.isPending}
                          title={u.isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer hover:opacity-80 active:scale-95 ${
                            u.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {u.isActive ? 'Aktif' : 'Nonaktif'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => onEdit(u)} title="Edit"
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          {!isSelf && (
                            <button onClick={() => onDelete(u)} title="Hapus"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
          }
        </tbody>
      </table>
      {!isLoading && !users.length && (
        <div className="py-12 text-center">
          <p className="text-3xl mb-2">👤</p>
          <p className="text-sm text-slate-400">Tidak ada data.</p>
        </div>
      )}
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-1.5 px-4 py-3 border-t border-slate-100">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={`w-9 h-9 rounded-xl text-sm font-medium border transition-colors ${
            page === p ? 'bg-brand text-white border-brand' : 'border-slate-200 hover:bg-slate-50'
          }`}>{p}</button>
      ))}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────
export default function AdminUsers() {
  const { user: me }   = useAuthStore()
  const { toast }      = useToast()
  const qc             = useQueryClient()
  const isSuperAdmin   = me?.role === 'superadmin'
  const [searchParams] = useSearchParams()
  const section        = searchParams.get('section') || 'pengelola'
  const isPengelola    = section !== 'pengguna'

  // Pengelola state
  const [pSearch, setPSearch] = useState('')
  const [pRole,   setPRole]   = useState('')
  const [pPage,   setPPage]   = useState(1)

  // Pengguna state
  const [uSearch, setUSearch] = useState('')
  const [uPage,   setUPage]   = useState(1)

  // Drawer & delete
  const [drawer,       setDrawer]       = useState(null)   // { user, roleOptions, defaultRole }
  const [deleteTarget, setDeleteTarget] = useState(null)

  // ── Queries ──
  const { data: pData, isLoading: pLoading } = useQuery({
    queryKey: ['admin-users-pengelola', pSearch, pRole, pPage],
    queryFn : () => userApi.getAll({
      group : pRole ? undefined : 'pengelola',
      role  : pRole || undefined,
      search: pSearch || undefined,
      page  : pPage,
      limit : 10,
    }).then(r => r.data),
    enabled: isPengelola,
  })

  const { data: uData, isLoading: uLoading } = useQuery({
    queryKey: ['admin-users-pengguna', uSearch, uPage],
    queryFn : () => userApi.getAll({
      group : 'pengguna',
      search: uSearch || undefined,
      page  : uPage,
      limit : 10,
    }).then(r => r.data),
    enabled: !isPengelola,
  })

  // ── Toggle status ──
  const toggleMutation = useMutation({
    mutationFn: (id) => userApi.toggleStatus(id),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-users-pengelola'] })
      qc.invalidateQueries({ queryKey: ['admin-users-pengguna'] })
      toast({ title: 'Status pengguna diperbarui.' })
    },
    onError: () => toast({ title: 'Gagal memperbarui status.', variant: 'destructive' }),
  })

  const pengelolaUsers = (pData?.data || []).filter(u => getRole(u) !== 'owner')
  const penggunaUsers  = uData?.data || []

  return (
    <div className="space-y-6">

      {/* ── Section: User Pengelola ── */}
      {isPengelola && <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <UserCog className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">User Pengelola</h3>
              <p className="text-xs text-slate-400">{pData?.pagination?.total ?? 0} pengelola</p>
            </div>
          </div>

          <div className="relative ml-auto flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={pSearch} onChange={e => { setPSearch(e.target.value); setPPage(1) }}
              placeholder="Cari pengelola..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
          </div>

          <select value={pRole} onChange={e => { setPRole(e.target.value); setPPage(1) }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 min-w-[140px]">
            <option value="">Semua Role</option>
            {PENGELOLA_ROLES.map(r => (
              <option key={r} value={r}>{ROLE_META[r]?.label || r}</option>
            ))}
          </select>

          {isSuperAdmin && (
            <button onClick={() => setDrawer({ user: null, roleOptions: PENGELOLA_ROLES, defaultRole: 'admin' })}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Tambah Pengelola
            </button>
          )}
        </div>

        <UserTable
          users={pengelolaUsers}
          isLoading={pLoading}
          me={me}
          isSuperAdmin={isSuperAdmin}
          toggleMutation={toggleMutation}
          onEdit={(u) => setDrawer({ user: u, roleOptions: PENGELOLA_ROLES, defaultRole: getRole(u) })}
          onDelete={(u) => setDeleteTarget(u)}
        />
        <Pagination page={pPage} totalPages={pData?.pagination?.totalPages || 1} onChange={setPPage} />
      </div>}

      {/* ── Section: Pengguna ── */}
      {!isPengelola && <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Pengguna</h3>
              <p className="text-xs text-slate-400">{uData?.pagination?.total ?? 0} pengguna terdaftar</p>
            </div>
          </div>

          <div className="relative ml-auto flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={uSearch} onChange={e => { setUSearch(e.target.value); setUPage(1) }}
              placeholder="Cari pengguna..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
          </div>

        </div>

        <UserTable
          users={penggunaUsers}
          isLoading={uLoading}
          me={me}
          isSuperAdmin={isSuperAdmin}
          toggleMutation={toggleMutation}
          onEdit={(u) => setDrawer({ user: u, roleOptions: ['user'], defaultRole: 'user' })}
          onDelete={(u) => setDeleteTarget(u)}
        />
        <Pagination page={uPage} totalPages={uData?.pagination?.totalPages || 1} onChange={setUPage} />
      </div>}

      {/* Drawer */}
      {drawer && (
        <UserFormDrawer
          user={drawer.user}
          defaultRole={drawer.defaultRole}
          roleOptions={drawer.roleOptions}
          onClose={() => setDrawer(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteUserConfirm
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
