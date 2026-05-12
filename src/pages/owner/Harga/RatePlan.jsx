import { useState } from 'react'
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Coffee, X, Info, Search, RotateCcw, ChevronRight } from 'lucide-react'

const PLAN_TYPES = [
  {
    id: 'custom',
    label: 'Rate plan custom',
    desc: 'Anda bisa membuat rate plan berdasarkan apa yang ditawarkan properti Anda.',
    minNights: null,
  },
  {
    id: 'mingguan',
    label: 'Rate plan mingguan',
    desc: 'Durasi menginap minimum 7 malam, sedangkan durasi menginap maksimum bisa Anda sesuaikan.',
    minNights: 7,
  },
  {
    id: 'bulanan',
    label: 'Rate plan bulanan',
    desc: 'Durasi menginap minimum 28 malam, sedangkan durasi menginap maksimum bisa Anda sesuaikan.',
    minNights: 28,
  },
]

/* ── Type picker modal ── */
function TypePicker({ onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-bold text-slate-900 mb-5">Pilih tipe rate plan dulu, yuk!</h3>
        <div className="space-y-3">
          {PLAN_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="w-full flex items-center gap-4 text-left p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">{t.label}</p>
                <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{t.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function RatePlan() {
  const { hotel }  = useOutletContext()
  const navigate   = useNavigate()
  const location   = useLocation()
  const { toast }  = useToast()
  const qc         = useQueryClient()

  const isAdmin    = location.pathname.startsWith('/admin/')
  const basePath   = isAdmin ? '/admin/harga/rate-plan' : '/owner/harga/rate-plan'

  // modal: null | 'type-picker'
  const [modal, setModal]       = useState(null)
  const [search, setSearch]     = useState('')
  const [inputVal, setInputVal] = useState('')

  const { data: plans, isLoading } = useQuery({
    queryKey: ['rate-plans', hotel?.id],
    queryFn: () => hotelApi.getRatePlans(hotel.id).then(r => r.data?.data || []),
    enabled: !!hotel?.id,
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => hotelApi.deleteRatePlan(hotel.id, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rate-plans', hotel?.id] })
      toast({ title: 'Rate plan dihapus.' })
    },
    onError: () => toast({ title: 'Gagal menghapus.', variant: 'destructive' }),
  })

  const toggleMutation = useMutation({
    mutationFn: (p) => hotelApi.updateRatePlan(hotel.id, p.id, { active: !p.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rate-plans', hotel?.id] }),
    onError: () => toast({ title: 'Gagal memperbarui.', variant: 'destructive' }),
  })

  const filtered = (plans || []).filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSearch = () => setSearch(inputVal)
  const handleReset  = () => { setSearch(''); setInputVal('') }

  const openTypePicker = () => setModal('type-picker')

  const handleTypeSelect = (planType) => {
    setModal(null)
    navigate(`${basePath}/new`, { state: { planType } })
  }

  const openEdit = (plan) => {
    navigate(`${basePath}/${plan.id}/edit`)
  }

  const closeModal = () => setModal(null)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Pengaturan Rate Plan</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Rate Plan adalah suatu pengaturan untuk pilihan makanan, harga, kebijakan pembatalan dan restriksi.
          </p>
          <button className="text-sm text-blue-600 hover:underline mt-0.5">
            Cari tahu tentang pengaturan rate plan.
          </button>
        </div>
        <button
          onClick={openTypePicker}
          className="flex items-center gap-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          TAMBAH RATE PLAN BARU
        </button>
      </div>

      {/* Search bar */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Apa yang Anda inginkan?"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold transition-colors"
          >
            GO
          </button>
        </div>
        <button onClick={handleReset} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
          <RotateCcw className="w-3.5 h-3.5" />
          Reset filter
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Info note */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-end">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Jika ingin mengubah <span className="font-bold text-slate-700">rate plan static</span>, silakan hubungi Market Manager.
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Nama</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">ID Rate Plan</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Kamar Terhubung</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">Plan Makanan <Info className="w-3.5 h-3.5 text-slate-400" /></span>
                </th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="px-5 py-4"><div className="skeleton h-4 w-32 rounded" /></td>
                      <td className="px-5 py-4"><div className="skeleton h-4 w-16 rounded" /></td>
                      <td className="px-5 py-4"><div className="skeleton h-4 w-24 rounded" /></td>
                      <td className="px-5 py-4"><div className="skeleton h-4 w-20 rounded" /></td>
                      <td className="px-5 py-4"><div className="skeleton h-6 w-16 rounded-full" /></td>
                      <td className="px-5 py-4"><div className="skeleton h-7 w-16 rounded" /></td>
                    </tr>
                  ))
                : filtered.map(p => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          {p.description && (
                            <p className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{p.description}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {p.cancelable && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Bisa Batal</span>
                            )}
                            {p.type && p.type !== 'custom' && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 capitalize">{p.type}</span>
                            )}
                            <span className="text-[10px] font-semibold text-slate-400">×{Number(p.multiplier).toFixed(2)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500 font-mono text-xs">
                        RP-{String(p.id).padStart(4, '0')}
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">Semua Kamar</td>
                      <td className="px-5 py-4">
                        {p.breakfast ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                            <Coffee className="w-3.5 h-3.5" /> Sarapan Pagi
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Tidak termasuk</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleMutation.mutate(p)}
                          disabled={toggleMutation.isPending}
                          className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
                            p.active
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {p.active ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(p.id)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>

          {!isLoading && !filtered.length && (
            <div className="py-14 text-center text-sm text-slate-400">
              {search ? `Tidak ada rate plan yang cocok dengan "${search}".` : 'Data tidak ditemukan'}
            </div>
          )}
        </div>
      </div>

      {/* ── Type picker modal ── */}
      {modal === 'type-picker' && (
        <TypePicker onSelect={handleTypeSelect} onClose={closeModal} />
      )}
    </div>
  )
}
