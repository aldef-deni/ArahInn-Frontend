import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Save, Search, Plus, Minus, X, Award, Crown, UserCircle2 } from 'lucide-react'
import { adminLoyaltyApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'

const TIER_BADGE = {
  member:   { label: 'Member',   cls: 'bg-blue-100 text-blue-700',     Icon: UserCircle2 },
  silver:   { label: 'Silver',   cls: 'bg-slate-200 text-slate-700',   Icon: Star },
  gold:     { label: 'Gold',     cls: 'bg-amber-100 text-amber-800',   Icon: Award },
  platinum: { label: 'Platinum', cls: 'bg-zinc-900 text-white',        Icon: Crown },
}

// Key camelCase — interceptor axios konversi response snake→camel & request camel→snake.
// Pengaturan AMBANG POIN kenaikan tier (tierSilver/Gold/Platinum) ada di sini.
const FIELDS = [
  { key: 'earnPer',          label: 'Rp per 1 poin (dasar)',   hint: 'Mis. 100 = Rp100 transaksi dapat 1 poin (tier Member)' },
  { key: 'activationPoints', label: 'Poin aktivasi user baru', hint: 'Bonus saat registrasi' },
  { key: 'tierSilver',       label: 'Ambang Silver (poin)',    hint: 'Lifetime earned untuk naik Silver' },
  { key: 'tierGold',         label: 'Ambang Gold (poin)',      hint: 'Lifetime earned untuk naik Gold' },
  { key: 'tierPlatinum',     label: 'Ambang Platinum (poin)',  hint: 'Lifetime earned untuk naik Platinum' },
  { key: 'multMember',       label: 'Multiplier Member',       hint: 'Pengali poin (×)' },
  { key: 'multSilver',       label: 'Multiplier Silver',       hint: 'Pengali poin (×)' },
  { key: 'multGold',         label: 'Multiplier Gold',         hint: 'Pengali poin (×)' },
  { key: 'multPlatinum',     label: 'Multiplier Platinum',     hint: 'Pengali poin (×)' },
]

export default function AdminLoyalty() {
  const { toast } = useToast()
  const qc = useQueryClient()

  // ── Config ──
  const { data: config } = useQuery({
    queryKey: ['admin-loyalty-config'],
    queryFn: () => adminLoyaltyApi.getConfig().then(r => r.data?.data),
  })
  const [form, setForm] = useState(null)
  useEffect(() => { if (config) setForm(config) }, [config])

  const saveConfig = useMutation({
    mutationFn: (d) => adminLoyaltyApi.setConfig(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-loyalty-config'] }); toast({ title: 'Konfigurasi disimpan.' }) },
    onError: () => toast({ title: 'Gagal menyimpan konfigurasi.', variant: 'destructive' }),
  })

  // ── Users ──
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data: usersRes } = useQuery({
    queryKey: ['admin-loyalty-users', search, page],
    queryFn: () => adminLoyaltyApi.users({ q: search, per_page: 20, page }).then(r => r.data),
    keepPreviousData: true,
  })
  const users = usersRes?.data ?? []
  const pg = usersRes?.pagination ?? {}
  const perPage = pg.perPage ?? 20
  const totalUsers = pg.total ?? users.length
  const totalPages = Math.max(1, Math.ceil(totalUsers / perPage))

  const [adjustUser, setAdjustUser] = useState(null) // { id, name }
  const [adjPoints, setAdjPoints] = useState('')
  const [adjReason, setAdjReason] = useState('')

  const adjustMut = useMutation({
    mutationFn: ({ id, points, reason }) => adminLoyaltyApi.adjust(id, { points, reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-loyalty-users'] }); setAdjustUser(null); setAdjPoints(''); setAdjReason(''); toast({ title: 'Poin disesuaikan.' }) },
    onError: () => toast({ title: 'Gagal menyesuaikan poin.', variant: 'destructive' }),
  })
  const tierMut = useMutation({
    mutationFn: ({ id, tier }) => adminLoyaltyApi.setTier(id, { tier }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-loyalty-users'] }); toast({ title: 'Tier diperbarui.' }) },
    onError: () => toast({ title: 'Gagal mengubah tier.', variant: 'destructive' }),
  })

  const submitAdjust = (sign) => {
    const val = Number(adjPoints)
    if (!val || !adjReason.trim()) { toast({ title: 'Isi jumlah poin & alasan.', variant: 'destructive' }); return }
    adjustMut.mutate({ id: adjustUser.id, points: sign * Math.abs(val), reason: adjReason.trim() })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 text-amber-500" />
        <h1 className="text-xl font-bold text-slate-900">Poin Loyalitas</h1>
      </div>

      {/* ── Konfigurasi ── */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800">Konfigurasi Program</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form?.enabled}
              onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} />
            <span className="font-medium text-slate-700">Aktif</span>
          </label>
        </div>

        {form && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FIELDS.map(({ key, label, hint }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                  <input type="number" value={form[key] ?? ''} min={1}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value === '' ? '' : Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  <p className="text-[11px] text-slate-400 mt-1">{hint}</p>
                </div>
              ))}
            </div>
            <button onClick={() => saveConfig.mutate(form)} disabled={saveConfig.isPending}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              <Save className="w-4 h-4" /> {saveConfig.isPending ? 'Menyimpan...' : 'Simpan Konfigurasi'}
            </button>
          </>
        )}
      </section>

      {/* ── Manajemen Member ── */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
        <h2 className="font-bold text-slate-800 mb-4">Manajemen Member</h2>

        <form onSubmit={e => { e.preventDefault(); setSearch(q); setPage(1) }} className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 border border-slate-200 rounded-xl">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari nama / email..."
              className="flex-1 text-sm focus:outline-none" />
          </div>
          <button className="px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-semibold text-slate-700">Cari</button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="py-2.5 px-2">Member</th>
                <th className="py-2.5 px-2 text-right">Saldo</th>
                <th className="py-2.5 px-2 text-right">Lifetime</th>
                <th className="py-2.5 px-2">Tier</th>
                <th className="py-2.5 px-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const tb = TIER_BADGE[u.tier] ?? TIER_BADGE.silver
                return (
                  <tr key={u.id} className="border-b border-slate-50">
                    <td className="py-2.5 px-2">
                      <p className="font-semibold text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-slate-800">{Number(u.balance).toLocaleString('id-ID')}</td>
                    <td className="py-2.5 px-2 text-right text-slate-500">{Number(u.lifetime).toLocaleString('id-ID')}</td>
                    <td className="py-2.5 px-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${tb.cls}`}>
                        <tb.Icon className="w-3 h-3" /> {tb.label}
                      </span>
                      {u.tierOverride && <span className="block text-[10px] text-orange-500 mt-0.5">override manual</span>}
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center justify-end gap-2">
                        <select value={u.tierOverride ?? ''} onChange={e => tierMut.mutate({ id: u.id, tier: e.target.value || null })}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5">
                          <option value="">Auto</option>
                          <option value="member">Member</option>
                          <option value="silver">Silver</option>
                          <option value="gold">Gold</option>
                          <option value="platinum">Platinum</option>
                        </select>
                        <button onClick={() => setAdjustUser({ id: u.id, name: u.name })}
                          className="px-2.5 py-1.5 text-xs font-semibold text-brand bg-brand/10 rounded-lg">Poin</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-sm">Tidak ada member.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Menampilkan {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalUsers)} dari {Number(totalUsers).toLocaleString('id-ID')} member
            </p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed">
                Sebelumnya
              </button>
              <span className="text-xs text-slate-600">Hal. {page} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed">
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Modal adjust poin ── */}
      {adjustUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-slate-900">Sesuaikan Poin</h3>
              <button onClick={() => setAdjustUser(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">{adjustUser.name}</p>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jumlah Poin</label>
            <input type="number" value={adjPoints} onChange={e => setAdjPoints(e.target.value)} min={1}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm mb-3" placeholder="0" />
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Alasan</label>
            <input value={adjReason} onChange={e => setAdjReason(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm mb-5" placeholder="mis. kompensasi keluhan" />
            <div className="flex gap-3">
              <button onClick={() => submitAdjust(1)} disabled={adjustMut.isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                <Plus className="w-4 h-4" /> Tambah
              </button>
              <button onClick={() => submitAdjust(-1)} disabled={adjustMut.isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                <Minus className="w-4 h-4" /> Kurangi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
