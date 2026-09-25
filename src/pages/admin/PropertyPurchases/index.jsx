import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Handshake, Coins, Wallet, Plus, Search, X, Loader2, Inbox,
  ChevronLeft, ChevronRight, MapPin, AlertTriangle,
} from 'lucide-react'
import { propertyPurchaseApi, adminLoyaltyApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'

const TZ = 'Asia/Jakarta'
const fmtTanggal = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric' })

/** Intl.format() MELEMPAR untuk tanggal tak valid — satu baris rusak tidak
 *  boleh memutihkan seluruh panel admin. */
const amanTanggal = (nilai) => {
  const d = new Date(nilai)
  return Number.isNaN(d.getTime()) ? '—' : fmtTanggal.format(d)
}

const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
const angka  = (n) => Number(n || 0).toLocaleString('id-ID')

const hariIni = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function AdminPropertyPurchases() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [formTerbuka, setFormTerbuka] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-property-purchases', q, page],
    queryFn : () => propertyPurchaseApi.list({ q: q || undefined, page, limit: 20 }).then(r => r.data),
    placeholderData: (prev) => prev,
  })

  const rows       = data?.data ?? []
  const stats      = data?.stats ?? {}
  const config     = data?.config ?? {}
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0 }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-6 sm:p-7 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center">
              <Handshake className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">Pembelian Properti</h1>
              <p className="text-sm text-emerald-100/80 mt-0.5">
                Catat transaksi yang sudah terjadi — pembeli otomatis menerima poin loyalitas.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFormTerbuka(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-sm hover:bg-emerald-50 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Catat Pembelian
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Kartu Icon={Handshake} label="Transaksi tercatat" nilai={angka(stats.total)} />
          <Kartu Icon={Wallet}    label="Total nilai properti" nilai={rupiah(stats.totalValue)} />
          <Kartu Icon={Coins}     label="Total poin diberikan" nilai={angka(stats.totalPoints)} sorot />
        </div>

        <p className="mt-4 text-[11px] text-emerald-100/70">
          Berlaku saat ini: <b className="text-white">{config.percent ?? 0}%</b> dari nilai transaksi
          {Number(config.maxPoints) > 0
            ? <> · dibatasi <b className="text-white">{angka(config.maxPoints)}</b> poin per transaksi</>
            : <> · tanpa batas</>}
          . Diatur di menu Poin Loyalitas.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
              placeholder="Cari pembeli atau properti..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <span className="text-xs text-slate-400">{angka(pagination.total)} transaksi</span>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-emerald-600" /></div>
        ) : rows.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">Belum ada pembelian tercatat</p>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              Transaksi properti terjadi di luar sistem. Catat di sini setelah pembelian benar-benar terjadi.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map(r => (
              <div key={r.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 line-clamp-1">{r.property?.title ?? '—'}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{r.property?.city ?? '—'} · #{r.propertyListingId}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Pembeli: <b>{r.buyer?.name ?? '—'}</b>
                    <span className="text-slate-400"> · {r.buyer?.email}</span>
                  </p>
                </div>
                <div className="sm:text-right shrink-0">
                  <p className="text-sm font-extrabold text-slate-900">{rupiah(r.price)}</p>
                  <p className="text-xs font-bold text-emerald-600 mt-0.5">
                    +{angka(r.pointsAwarded)} poin <span className="font-normal text-slate-400">({r.pointsPercent}%)</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{amanTanggal(r.purchasedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-500">Halaman {pagination.page} dari {pagination.totalPages}</p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {formTerbuka && (
        <FormPembelian
          config={config}
          onClose={() => setFormTerbuka(false)}
          onSaved={(pesan) => {
            setFormTerbuka(false)
            toast({ title: 'Pembelian dicatat', description: pesan })
            qc.invalidateQueries({ queryKey: ['admin-property-purchases'] })
          }}
        />
      )}
    </div>
  )
}

function Kartu({ Icon, label, nilai, sorot }) {
  return (
    <div className={`rounded-2xl px-4 py-3.5 ring-1 ${sorot ? 'bg-emerald-400/10 ring-emerald-300/25' : 'bg-white/[0.06] ring-white/10'}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-100/80">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className="mt-1 text-lg font-extrabold">{nilai}</p>
    </div>
  )
}

function FormPembelian({ config, onClose, onSaved }) {
  const { toast } = useToast()
  const [propertyId, setPropertyId] = useState('')
  const [buyerId, setBuyerId]       = useState('')
  const [cariPembeli, setCariPembeli] = useState('')
  const [harga, setHarga]           = useState('')
  const [tanggal, setTanggal]       = useState(hariIni())
  const [catatan, setCatatan]       = useState('')

  const { data: properties = [] } = useQuery({
    queryKey: ['admin-property-purchases-options'],
    queryFn : () => propertyPurchaseApi.properties().then(r => r.data?.data ?? []),
  })

  // Memakai daftar member loyalitas yang sudah ada: endpoint itu sekalian
  // mengembalikan saldo poin, jadi superadmin bisa melihat konteks pembelinya.
  const { data: usersResp } = useQuery({
    queryKey: ['admin-loyalty-users-search', cariPembeli],
    queryFn : () => adminLoyaltyApi.users({ q: cariPembeli, per_page: 10 }).then(r => r.data),
    enabled : cariPembeli.trim().length >= 2,
  })
  const users = usersResp?.data ?? []

  const propertiTerpilih = useMemo(
    () => properties.find(p => String(p.id) === String(propertyId)),
    [properties, propertyId],
  )

  // Harga listing dijadikan nilai awal, tapi tetap bisa diubah: properti hampir
  // selalu ditawar, dan poin dihitung dari nilai transaksi yang sebenarnya.
  useEffect(() => {
    if (propertiTerpilih) setHarga(String(propertiTerpilih.price ?? ''))
  }, [propertiTerpilih])

  const persen = Number(config.percent ?? 0)
  const batas  = Number(config.maxPoints ?? 0)
  const poinPerkiraan = useMemo(() => {
    const h = Number(harga)
    if (!h || persen <= 0) return 0
    const p = Math.floor((h * persen) / 100)
    return batas > 0 ? Math.min(p, batas) : p
  }, [harga, persen, batas])

  const simpan = useMutation({
    mutationFn: () => propertyPurchaseApi.create({
      propertyListingId: Number(propertyId),
      buyerId          : Number(buyerId),
      price            : Number(harga),
      purchasedAt      : tanggal,
      notes            : catatan.trim() || undefined,
    }).then(r => r.data),
    onSuccess: (res) => onSaved(res?.message),
    onError  : (err) => toast({
      title      : 'Gagal mencatat',
      description: err?.response?.data?.message
        ?? Object.values(err?.response?.data?.errors ?? {})[0]?.[0]
        ?? 'Periksa kembali isian Anda.',
      variant    : 'destructive',
    }),
  })

  const siap = propertyId && buyerId && Number(harga) > 0 && tanggal

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 sm:p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Handshake className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-slate-900">Catat Pembelian Properti</h2>
            <p className="text-xs text-slate-500 mt-0.5">Poin langsung masuk ke saldo pembeli setelah disimpan.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <Kolom label="Properti" wajib>
            <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className={gayaInput}>
              <option value="">Pilih properti yang terjual</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>#{p.id} · {p.title} — {p.city}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Properti yang sudah pernah dicatat terjual tidak muncul di daftar ini.
            </p>
          </Kolom>

          <Kolom label="Pembeli" wajib>
            <input
              value={cariPembeli} onChange={e => { setCariPembeli(e.target.value); setBuyerId('') }}
              placeholder="Ketik nama atau email pembeli (min. 2 huruf)" className={gayaInput}
            />
            {users.length > 0 && (
              <div className="mt-1.5 max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                {users.map(u => (
                  <button key={u.id} type="button"
                    onClick={() => { setBuyerId(String(u.id)); setCariPembeli(`${u.name} · ${u.email}`) }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${String(u.id) === buyerId ? 'bg-emerald-50 font-semibold' : ''}`}>
                    {u.name} <span className="text-slate-400 text-xs">· {u.email}</span>
                    {u.balance != null && <span className="text-slate-400 text-xs"> · {angka(u.balance)} poin</span>}
                  </button>
                ))}
              </div>
            )}
            {buyerId && <p className="text-[11px] text-emerald-600 mt-1 font-semibold">Pembeli dipilih (ID {buyerId})</p>}
          </Kolom>

          <Kolom label="Harga transaksi (Rp)" wajib>
            <input type="number" min={1} value={harga} onChange={e => setHarga(e.target.value)} className={gayaInput} />
            <p className="text-[11px] text-slate-400 mt-1">
              Terisi dari harga listing, ubah bila harga akhirnya berbeda. Poin dihitung dari angka ini.
            </p>
          </Kolom>

          <Kolom label="Tanggal transaksi" wajib>
            <input type="date" value={tanggal} max={hariIni()} onChange={e => setTanggal(e.target.value)} className={gayaInput} />
          </Kolom>

          <Kolom label="Catatan (opsional)">
            <input value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Mis. nomor akta, nama notaris" className={gayaInput} />
          </Kolom>

          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3">
            <p className="text-xs text-emerald-800">Poin yang akan diberikan</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">{angka(poinPerkiraan)}</p>
            <p className="text-[11px] text-emerald-700/80 mt-1">
              Setara {rupiah(poinPerkiraan)} · {persen}% dari nilai transaksi
              {batas > 0 && poinPerkiraan >= batas ? ' (kena batas maksimum)' : ''}
            </p>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
            <span>Poin tidak bisa ditarik kembali lewat halaman ini. Pastikan pembeli dan nilai transaksinya benar.</span>
          </div>

          <button
            onClick={() => simpan.mutate()} disabled={!siap || simpan.isPending}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
          >
            {simpan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />}
            Simpan & Berikan Poin
          </button>
        </div>
      </div>
    </div>
  )
}

const gayaInput = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30'

function Kolom({ label, wajib, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}{wajib ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  )
}
