import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatDateTime, roleLabel } from '@/utils'
import { Search, UserCheck, UserX, ShieldCheck } from 'lucide-react'

const ROLES = ['','superadmin','owner','admin_property','admin','finance','user']
const ROLE_COLORS = {
  superadmin    : 'bg-red-100 text-red-700',
  owner         : 'bg-blue-100 text-blue-700',
  admin_property: 'bg-indigo-100 text-indigo-700',
  admin         : 'bg-purple-100 text-purple-700',
  finance       : 'bg-green-100 text-green-700',
  user          : 'bg-gray-100 text-gray-600',
}

export default function AdminUsers() {
  const { toast } = useToast()
  const qc        = useQueryClient()
  const [search, setSearch] = useState('')
  const [role, setRole]     = useState('')
  const [page, setPage]     = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role, page],
    queryFn : () => userApi.getAll({ search: search || undefined, role: role || undefined, page, limit: 15 }).then(r => r.data),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => userApi.changeRole(id, { role }),
    onSuccess : () => { qc.invalidateQueries(['admin-users']); toast({ title: 'Role berhasil diubah.' }) },
    onError   : () => toast({ title: 'Gagal mengubah role.', variant: 'destructive' }),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => userApi.toggleStatus(id),
    onSuccess : () => { qc.invalidateQueries(['admin-users']); toast({ title: 'Status pengguna diperbarui.' }) },
  })

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="bg-white border rounded-2xl p-4 shadow-card flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cari nama atau email..."
            className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
        </div>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1) }}
          className="px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/50">
          <option value="">Semua Role</option>
          {ROLES.filter(Boolean).map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
        </select>
        <span className="text-sm text-muted-foreground ml-auto">{data?.pagination?.total || 0} pengguna</span>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {['Pengguna','Email','Role','Status','Bergabung','Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array(8).fill(0).map((_, i) => (
                    <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>)}</tr>
                  ))
                : data?.data?.map(u => (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                            {u.avatar
                              ? <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                              : u.name?.[0]?.toUpperCase()}
                          </div>
                          <p className="font-medium whitespace-nowrap">{u.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          defaultValue={u.role}
                          onChange={e => roleMutation.mutate({ id: u.id, role: e.target.value })}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border-0 focus:outline-none cursor-pointer ${ROLE_COLORS[u.role]}`}>
                          {ROLES.filter(Boolean).map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleMutation.mutate(u.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.isActive
                              ? 'hover:bg-red-50 text-red-500'
                              : 'hover:bg-green-50 text-green-600'
                          }`}
                          title={u.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                          {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!isLoading && !data?.data?.length && (
            <div className="py-12 text-center text-muted-foreground text-sm">Tidak ada pengguna ditemukan.</div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {data?.pagination?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(data.pagination.totalPages, 10) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                page === p ? 'bg-brand text-white border-brand' : 'hover:bg-muted'
              }`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}
