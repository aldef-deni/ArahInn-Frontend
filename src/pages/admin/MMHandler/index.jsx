import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mmHandlerApi, userApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { getImageUrl } from '@/utils'
import {
  Search, Save, X, Users, Building2, UserCog,
} from 'lucide-react'

// ── Assign Owner Modal ────────────────────────────────────────────────────
function AssignModal({ mm, onClose }) {
  const { toast }                   = useToast()
  const qc                          = useQueryClient()
  const [selected,    setSelected]  = useState(null)
  const [initialized, setInit]      = useState(false)
  const [search,      setSearch]    = useState('')

  const { data: allOwnersData, isLoading: loadingOwners } = useQuery({
    queryKey: ['all-owners-list'],
    queryFn : () => userApi.getAll({ role: 'owner', limit: 999 }).then(r => r.data),
  })

  const { data: assignedData } = useQuery({
    queryKey: ['mm-handler-owners', mm.id],
    queryFn : () => mmHandlerApi.getOwners(mm.id).then(r => r.data),
  })

  useEffect(() => {
    if (!initialized && assignedData) {
      setSelected(new Set((assignedData.ownerIds || []).map(Number)))
      setInit(true)
    }
  }, [assignedData, initialized])

  const saveMutation = useMutation({
    mutationFn: () => mmHandlerApi.setOwners(mm.id, { ownerIds: [...(selected || [])] }),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['mm-handler-list'] })
      qc.invalidateQueries({ queryKey: ['mm-handler-owners', mm.id] })
      toast({ title: `Owner untuk ${mm.name} berhasil diperbarui.` })
      onClose()
    },
    onError: (e) => toast({
      title      : 'Gagal menyimpan',
      description: e?.response?.data?.message || 'Terjadi kesalahan.',
      variant    : 'destructive',
    }),
  })

  const allOwners = allOwnersData?.data || []
  const isLoading = loadingOwners || !initialized

  const filtered = allOwners.filter(o =>
    !search ||
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center shrink-0">
              {mm.avatar
                ? <img src={getImageUrl(mm.avatar)} alt="" className="w-full h-full object-cover" />
                : <span className="text-sm font-bold text-indigo-700">{mm.name?.[0]?.toUpperCase()}</span>
              }
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{mm.name}</h2>
              <p className="text-xs text-slate-500">
                Pilih owner yang ditangani
                {selected && <span className="ml-1 font-semibold text-indigo-600">· {selected.size} dipilih</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama atau email owner..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1">
          {isLoading
            ? Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />
              ))
            : filtered.length === 0
              ? <p className="text-center text-sm text-slate-400 py-10">Tidak ada owner ditemukan.</p>
              : filtered.map(o => {
                  const checked = selected?.has(o.id) || false
                  return (
                    <label key={o.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors border ${
                      checked ? 'bg-indigo-50 border-indigo-200' : 'border-transparent hover:bg-slate-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(o.id)}
                        className="w-4 h-4 accent-indigo-600 shrink-0"
                      />
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm shrink-0">
                        {o.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">{o.name}</p>
                        <p className="text-xs text-slate-400 truncate">{o.email}</p>
                      </div>
                      {checked && (
                        <span className="text-xs text-indigo-600 font-semibold shrink-0">Ditangani</span>
                      )}
                    </label>
                  )
                })
          }
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t bg-slate-50 rounded-b-2xl">
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            Hapus semua pilihan
          </button>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-white transition-colors">
              Batal
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !initialized}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function MMHandler() {
  const [assignTarget, setAssignTarget] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['mm-handler-list'],
    queryFn : () => mmHandlerApi.listMMs().then(r => r.data),
  })

  const mms = data?.data || []

  return (
    <div className="space-y-5">

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Market Manager', value: mms.length,                                              icon: '👤' },
          { label: 'MM dengan Owner',      value: mms.filter(m => m.assignedCount > 0).length,             icon: '🔗' },
          { label: 'MM Belum Ditugaskan',  value: mms.filter(m => !m.assignedCount || m.assignedCount === 0).length, icon: '⚠️' },
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
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <UserCog className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">MM Handler</h3>
            <p className="text-xs text-slate-400">Atur owner akomodasi yang ditangani setiap Market Manager</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Market Manager', 'Email', 'Owner Ditangani', 'Aksi'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? Array(4).fill(0).map((_, i) => (
                    <tr key={i}>{Array(4).fill(0).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-slate-100 animate-pulse rounded-lg" /></td>
                    ))}</tr>
                  ))
                : mms.map(mm => (
                    <tr key={mm.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0 overflow-hidden">
                            {mm.avatar
                              ? <img src={getImageUrl(mm.avatar)} alt="" className="w-9 h-9 object-cover" />
                              : mm.name?.[0]?.toUpperCase()
                            }
                          </div>
                          <p className="font-semibold text-slate-900 whitespace-nowrap">{mm.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">{mm.email}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className={`font-semibold ${mm.assignedCount > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {mm.assignedCount ?? 0}
                          </span>
                          <span className="text-xs text-slate-400">owner</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setAssignTarget(mm)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors"
                        >
                          <Users className="w-3.5 h-3.5" />
                          Atur Owner
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>

          {!isLoading && !mms.length && (
            <div className="py-16 text-center">
              <UserCog className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Belum ada Market Manager terdaftar.</p>
            </div>
          )}
        </div>
      </div>

      {assignTarget && (
        <AssignModal mm={assignTarget} onClose={() => setAssignTarget(null)} />
      )}
    </div>
  )
}
