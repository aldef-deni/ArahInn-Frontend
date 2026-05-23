import { useState } from 'react'
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { useToast } from '@/hooks/use-toast'
import {
  Plus, Pencil, Trash2, Coffee, X, Info, Search, RotateCcw,
  ChevronRight, Eye, Copy as CopyIcon, AlertTriangle,
} from 'lucide-react'

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

/* ── Toggle Switch (mirip tiket.com) ── */
function ToggleSwitch({ on, onToggle, disabled }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      role="switch"
      aria-checked={on}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        on ? 'bg-blue-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

/* ── Action button (icon + label di bawah, mirip tiket.com) ── */
function ActionBtn({ icon: Icon, label, onClick, disabled, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors disabled:opacity-50 ${
        danger
          ? 'text-red-500 hover:bg-red-50'
          : 'text-blue-600 hover:bg-blue-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  )
}

/* ── Detail "Lihat" modal ── */
function ViewModal({ plan, rooms, onClose }) {
  if (!plan) return null

  const connectedRooms = (plan.room_ids?.length)
    ? (rooms || []).filter(r => plan.room_ids.includes(r.id)).map(r => r.name)
    : ['Semua Kamar']

  const mealLabel = plan.breakfast ? 'Sarapan termasuk' : 'Tidak termasuk'
  const cancelLabel = plan.cancelable ? 'Bisa dibatalkan' : 'Tidak bisa dibatalkan'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 truncate">{plan.name}</h3>
              {plan.is_default && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">DEFAULT</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">RP-{String(plan.id).padStart(4, '0')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 text-sm">
          {plan.description && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Deskripsi</p>
              <p className="text-slate-700 leading-relaxed">{plan.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Tipe</p>
              <p className="text-slate-800 capitalize">{plan.type || 'custom'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Multiplier</p>
              <p className="text-slate-800">×{Number(plan.multiplier || 1).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Min Menginap</p>
              <p className="text-slate-800">{plan.min_nights || 1} malam</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Max Menginap</p>
              <p className="text-slate-800">{plan.max_nights || '—'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Plan Makanan</p>
            <p className="text-slate-800 flex items-center gap-1.5">
              {plan.breakfast && <Coffee className="w-3.5 h-3.5 text-amber-600" />}
              {mealLabel}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Kebijakan Pembatalan</p>
            <p className="text-slate-800">{cancelLabel}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Kamar Terhubung</p>
            <div className="flex flex-wrap gap-1.5">
              {connectedRooms.map((n, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold">{n}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Status</p>
            <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
              plan.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {plan.active ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Confirm Delete modal ── */
function ConfirmDelete({ plan, onCancel, onConfirm, pending }) {
  if (!plan) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Hapus rate plan?</h3>
            <p className="text-sm text-slate-500 mt-1">
              <span className="font-semibold text-slate-700">{plan.name}</span> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Batal
          </button>
          <button onClick={onConfirm} disabled={pending}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50">
            {pending ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
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

  // modal state: null | 'type-picker' | { mode: 'view', plan } | { mode: 'delete', plan }
  const [modal, setModal]       = useState(null)
  const [search, setSearch]     = useState('')
  const [inputVal, setInputVal] = useState('')

  const { data: plans, isLoading } = useQuery({
    queryKey: ['rate-plans', hotel?.id],
    queryFn: () => hotelApi.getRatePlans(hotel.id).then(r => r.data?.data || []),
    enabled: !!hotel?.id,
  })

  const { data: rooms } = useQuery({
    queryKey: ['owner-rooms', hotel?.id],
    queryFn: () => hotelApi.getRooms(hotel.id).then(r => r.data?.data || r.data || []),
    enabled: !!hotel?.id,
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => hotelApi.deleteRatePlan(hotel.id, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rate-plans', hotel?.id] })
      setModal(null)
      toast({ title: 'Rate plan berhasil dihapus.' })
    },
    onError: () => toast({ title: 'Gagal menghapus rate plan.', variant: 'destructive' }),
  })

  const toggleMutation = useMutation({
    mutationFn: (p) => hotelApi.updateRatePlan(hotel.id, p.id, { active: !p.active }),
    onSuccess: (_, p) => {
      qc.invalidateQueries({ queryKey: ['rate-plans', hotel?.id] })
      toast({ title: p.active ? 'Rate plan dinonaktifkan.' : 'Rate plan diaktifkan.' })
    },
    onError: () => toast({ title: 'Gagal memperbarui status.', variant: 'destructive' }),
  })

  const copyMutation = useMutation({
    mutationFn: async (plan) => {
      // ambil data terbaru lalu duplikasi tanpa id
      const fresh = await hotelApi.getRatePlan(hotel.id, plan.id).then(r => r.data?.data || plan)
      const { id, hotel_id, created_at, updated_at, parentPlan, parent_plan,
              is_default, ...rest } = fresh
      const payload = {
        ...rest,
        name: `${fresh.name} (Copy)`,
        active: false,
        is_default: false,
      }
      return hotelApi.createRatePlan(hotel.id, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rate-plans', hotel?.id] })
      toast({ title: 'Rate plan berhasil diduplikasi.' })
    },
    onError: () => toast({ title: 'Gagal menduplikasi rate plan.', variant: 'destructive' }),
  })

  const filtered = (plans || []).filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSearch = () => setSearch(inputVal)
  const handleReset  = () => { setSearch(''); setInputVal('') }

  const openTypePicker = () => setModal({ mode: 'type-picker' })
  const closeModal     = () => setModal(null)

  const handleTypeSelect = (planType) => {
    setModal(null)
    navigate(`${basePath}/new`, { state: { planType } })
  }

  const openEdit   = (plan) => navigate(`${basePath}/${plan.id}/edit`)
  const openView   = (plan) => setModal({ mode: 'view', plan })
  const openDelete = (plan) => setModal({ mode: 'delete', plan })
  const doCopy     = (plan) => copyMutation.mutate(plan)

  const getConnectedRoomsLabel = (plan) => {
    if (!plan.room_ids?.length) return 'Semua Kamar'
    const names = (rooms || [])
      .filter(r => plan.room_ids.includes(r.id))
      .map(r => r.name)
    if (!names.length) return `${plan.room_ids.length} kamar`
    return names.length > 2
      ? `${names.slice(0, 2).join(', ')} +${names.length - 2}`
      : names.join(', ')
  }

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
              <tr className="border-b border-slate-100 bg-slate-50/60">
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
                      <td className="px-5 py-4"><div className="skeleton h-4 w-24 rounded" /></td>
                      <td className="px-5 py-4"><div className="skeleton h-4 w-24 rounded" /></td>
                      <td className="px-5 py-4"><div className="skeleton h-4 w-20 rounded" /></td>
                      <td className="px-5 py-4"><div className="skeleton h-6 w-11 rounded-full" /></td>
                      <td className="px-5 py-4"><div className="skeleton h-8 w-40 rounded" /></td>
                    </tr>
                  ))
                : filtered.map(p => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors align-top">
                      {/* Nama */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          {p.is_default && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                              DEFAULT
                            </span>
                          )}
                        </div>
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
                          <span className="text-[10px] font-semibold text-slate-400">×{Number(p.multiplier || 1).toFixed(2)}</span>
                          {Number(p.discount_percent || 0) > 0 && (
                            <span className="text-[10px] font-semibold text-rose-500">−{Number(p.discount_percent).toFixed(0)}%</span>
                          )}
                        </div>
                      </td>

                      {/* ID Rate Plan */}
                      <td className="px-5 py-4">
                        <p className="text-xs text-slate-700">
                          <span className="text-slate-400">arahinn.com:</span>{' '}
                          <span className="font-mono font-semibold">{String(p.id).padStart(6, '0')}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">Property: -</p>
                      </td>

                      {/* Kamar Terhubung */}
                      <td className="px-5 py-4">
                        <p className="text-slate-700 text-xs">{getConnectedRoomsLabel(p)}</p>
                      </td>

                      {/* Plan Makanan */}
                      <td className="px-5 py-4">
                        {p.breakfast ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                            <Coffee className="w-3.5 h-3.5" /> Sarapan Pagi
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Tidak</span>
                        )}
                      </td>

                      {/* Status — toggle switch */}
                      <td className="px-5 py-4">
                        <ToggleSwitch
                          on={!!p.active}
                          onToggle={() => toggleMutation.mutate(p)}
                          disabled={toggleMutation.isPending}
                        />
                      </td>

                      {/* Action — 4 ikon dengan label */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <ActionBtn icon={Eye}      label="Lihat" onClick={() => openView(p)} />
                          <ActionBtn icon={Pencil}   label="Ubah"  onClick={() => openEdit(p)} />
                          <ActionBtn icon={CopyIcon} label="Copy"  onClick={() => doCopy(p)} disabled={copyMutation.isPending} />
                          <ActionBtn icon={Trash2}   label="Hapus" onClick={() => openDelete(p)} danger />
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

        {/* Pagination footer (info saja) */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
            Menampilkan 1 - {filtered.length} dari {filtered.length}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modal?.mode === 'type-picker' && (
        <TypePicker onSelect={handleTypeSelect} onClose={closeModal} />
      )}
      {modal?.mode === 'view' && (
        <ViewModal plan={modal.plan} rooms={rooms} onClose={closeModal} />
      )}
      {modal?.mode === 'delete' && (
        <ConfirmDelete
          plan={modal.plan}
          onCancel={closeModal}
          onConfirm={() => deleteMutation.mutate(modal.plan.id)}
          pending={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
