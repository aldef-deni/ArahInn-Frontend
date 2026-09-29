import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plug, Wallet, PackageSearch, RefreshCw, Loader2, Copy, Check,
  CheckCircle2, XCircle, AlertTriangle, Webhook, Search, Inbox,
  ChevronLeft, ChevronRight, ShieldCheck,
} from 'lucide-react'
import { digiflazzApi, ppobItemApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import Saklar from '@/components/admin/SaklarTampil'

const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
const angka  = (n) => Number(n || 0).toLocaleString('id-ID')

const fmtWaktu = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
})

/** Intl.format() MELEMPAR untuk tanggal tak valid — satu nilai rusak tidak
 *  boleh memutihkan seluruh panel admin. */
const amanWaktu = (v) => {
  if (!v) return 'Belum pernah'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '—' : fmtWaktu.format(d)
}

export default function AdminDigiflazz() {
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: status, isLoading } = useQuery({
    queryKey: ['admin-digiflazz-status'],
    queryFn : () => digiflazzApi.status().then(r => r.data?.data),
    refetchOnWindowFocus: false,
  })

  const uji = useMutation({
    mutationFn: () => digiflazzApi.test().then(r => r.data),
    onSuccess : (res) => {
      toast({ title: 'Sambungan berhasil', description: res?.message })
      qc.invalidateQueries({ queryKey: ['admin-digiflazz-status'] })
    },
    onError: (err) => toast({
      title      : 'Sambungan gagal',
      description: err?.response?.data?.message ?? 'Periksa kredensial di .env server.',
      variant    : 'destructive',
    }),
  })

  const sinkron = useMutation({
    mutationFn: (kind) => digiflazzApi.sync({ kind }).then(r => r.data),
    onSuccess : (res) => {
      toast({ title: 'Katalog tersinkron', description: res?.message })
      qc.invalidateQueries({ queryKey: ['admin-digiflazz-status'] })
      qc.invalidateQueries({ queryKey: ['admin-digiflazz-products'] })
    },
    onError: (err) => toast({
      title      : 'Sinkronisasi gagal',
      description: err?.response?.data?.message ?? 'Coba lagi beberapa saat lagi.',
      variant    : 'destructive',
    }),
  })

  if (isLoading) {
    return <div className="py-24 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>
  }

  const siap     = status?.configured
  const produksi = status?.production
  const katalog  = status?.catalog ?? {}

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* ── Kepala ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 p-6 sm:p-7 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center">
              <Plug className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">Digiflazz</h1>
              <p className="text-sm text-slate-300 mt-0.5">Pemasok PPOB kedua, berdampingan dengan Rajabiller.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => uji.mutate()} disabled={uji.isPending || !siap}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              {uji.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Uji Sambungan
            </button>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Kartu
            Icon={siap ? CheckCircle2 : XCircle}
            label="Status kredensial"
            nilai={siap ? 'Terpasang' : 'Belum lengkap'}
            tone={siap ? 'hijau' : 'merah'}
          />
          <Kartu
            Icon={AlertTriangle}
            label="Mode"
            nilai={produksi ? 'PRODUKSI' : 'Dev / sandbox'}
            tone={produksi ? 'kuning' : 'netral'}
          />
          <Kartu
            Icon={Wallet}
            label="Saldo deposit"
            nilai={status?.balance != null ? rupiah(status.balance) : '—'}
            tone="netral"
          />
        </div>

        {status?.balanceError && (
          <p className="relative mt-3 text-xs text-red-200 bg-red-950/40 ring-1 ring-red-400/30 rounded-xl px-3 py-2">
            Saldo tidak terbaca: {status.balanceError}
          </p>
        )}
      </div>

      {/* ── Kredensial ─────────────────────────────────────── */}
      <Panel judul="Kredensial" Icon={ShieldCheck}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Penanda label="DIGIFLAZZ_USERNAME"       ada={status?.hasUsername} />
          <Penanda label="DIGIFLAZZ_DEV_KEY"        ada={status?.hasDevKey} />
          <Penanda label="DIGIFLAZZ_PROD_KEY"       ada={status?.hasProdKey} />
          <Penanda label="DIGIFLAZZ_WEBHOOK_SECRET" ada={status?.hasWebhookSecret} />
        </div>
        {produksi && !status?.hasProdKey && (
          <p className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
            Mode produksi menyala tetapi kunci produksi kosong. Setiap permintaan akan gagal —
            ini disengaja, agar transaksi tidak diam-diam memakai kunci dev.
          </p>
        )}
      </Panel>

      {/* ── Webhook ────────────────────────────────────────── */}
      <Panel judul="Webhook" Icon={Webhook}>
        <SalinBaris nilai={status?.webhookUrl} />
      </Panel>

      {/* ── Katalog ────────────────────────────────────────── */}
      <Panel
        judul="Katalog produk" Icon={PackageSearch}
        aksi={
          <div className="flex gap-2">
            {['prepaid', 'pasca'].map(k => (
              <button
                key={k}
                onClick={() => sinkron.mutate(k)}
                disabled={sinkron.isPending || !siap}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 text-xs font-bold hover:bg-teal-100 disabled:opacity-50 transition-colors"
              >
                {sinkron.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Sinkron {k === 'prepaid' ? 'Prabayar' : 'Pascabayar'}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Statistik label="Total produk"   nilai={angka(katalog.total)} />
          <Statistik label="Siap dijual"    nilai={angka(katalog.available)} sorot />
          <Statistik label="Kategori"       nilai={angka(katalog.categories)} />
          <Statistik label="Sinkron terakhir" nilai={amanWaktu(katalog.lastSync)} kecil />
        </div>
      </Panel>

      <DaftarProduk />
    </div>
  )
}

/* ── Bagian-bagian ──────────────────────────────────────── */

function Kartu({ Icon, label, nilai, tone }) {
  const warna = {
    hijau : 'bg-emerald-400/10 ring-emerald-300/25 text-emerald-200',
    merah : 'bg-red-400/10 ring-red-300/25 text-red-200',
    kuning: 'bg-amber-400/10 ring-amber-300/25 text-amber-200',
    netral: 'bg-white/[0.06] ring-white/10 text-slate-300',
  }[tone] ?? 'bg-white/[0.06] ring-white/10 text-slate-300'

  return (
    <div className={`rounded-2xl px-4 py-3.5 ring-1 ${warna}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className="mt-1 text-lg font-extrabold text-white">{nilai}</p>
    </div>
  )
}

function Panel({ judul, Icon, aksi, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="flex items-center gap-2 font-bold text-slate-800">
          <Icon className="w-4 h-4 text-slate-400" /> {judul}
        </h2>
        {aksi}
      </div>
      {children}
    </div>
  )
}

function Penanda({ label, ada }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-mono ${
      ada ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-500'
    }`}>
      {ada ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
      <span className="truncate">{label}</span>
      <span className="ml-auto font-sans font-bold">{ada ? 'terisi' : 'kosong'}</span>
    </div>
  )
}

function Statistik({ label, nilai, sorot, kecil }) {
  return (
    <div className={`rounded-xl border px-3.5 py-3 ${sorot ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-slate-50'}`}>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={`mt-0.5 font-extrabold text-slate-900 ${kecil ? 'text-xs' : 'text-lg'}`}>{nilai}</p>
    </div>
  )
}

function SalinBaris({ nilai }) {
  const [disalin, setDisalin] = useState(false)
  if (!nilai) return null
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 min-w-0 truncate px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
        {nilai}
      </code>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(nilai)
          setDisalin(true)
          setTimeout(() => setDisalin(false), 1800)
        }}
        className="shrink-0 w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
        title="Salin"
      >
        {disalin ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
      </button>
    </div>
  )
}

function DaftarProduk() {
  const [q, setQ] = useState('')
  const [kategori, setKategori] = useState('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-digiflazz-products', q, kategori, page],
    queryFn : () => digiflazzApi.products({
      q: q || undefined, category: kategori || undefined, page, limit: 25,
    }).then(r => r.data),
    placeholderData: (prev) => prev,
  })

  // Memakai endpoint yang sama dengan halaman RajaBiller/Digiflazz gabungan,
  // jadi menyalakan produk di sini dan di sana berarti hal yang persis sama.
  const ubahSaklar = useMutation({
    mutationFn: ({ id, enabled }) => ppobItemApi.toggle('digiflazz', id, enabled).then(r => r.data),
    onSuccess : (res) => {
      toast({ title: res?.message })
      qc.invalidateQueries({ queryKey: ['admin-digiflazz-products'] })
      qc.invalidateQueries({ queryKey: ['admin-ppob-items'] })
    },
    onError: (e) => toast({
      title: e?.response?.data?.message || 'Gagal mengubah status produk.',
      variant: 'destructive',
    }),
  })

  const rows       = data?.data ?? []
  const kategoris  = data?.categories ?? []
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0 }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2.5 px-5 py-3.5 border-b border-slate-100">
        <h2 className="font-bold text-slate-800 mr-auto">Produk tersinkron</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
            placeholder="Cari nama, SKU, atau brand..."
            className="w-56 pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>
        <select
          value={kategori} onChange={e => { setKategori(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        >
          <option value="">Semua kategori</option>
          {kategoris.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>
      ) : rows.length === 0 ? (
        <div className="py-14 flex flex-col items-center text-center px-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <Inbox className="w-5 h-5 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700">Katalog masih kosong</p>
          <p className="text-sm text-slate-400 mt-1">Tekan &quot;Sinkron Prabayar&quot; di atas untuk mengambil daftar produk.</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50/70">
              <th className="px-5 py-3 font-semibold">Produk</th>
              <th className="px-5 py-3 font-semibold">Kategori</th>
              <th className="px-5 py-3 font-semibold">SKU</th>
              <th className="px-5 py-3 font-semibold text-right">Harga modal</th>
              <th className="px-5 py-3 font-semibold text-center">Status</th>
              <th className="px-5 py-3 font-semibold text-center">Tampil ke pelanggan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(p => {
              const siap = p.isAvailable && p.buyerStatus && p.sellerStatus
              return (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-800">{p.productName}</p>
                    <p className="text-[11px] text-slate-400">{p.brand} · {p.type}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.category}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{p.buyerSkuCode}</td>
                  <td className="px-5 py-3 text-right font-bold text-slate-900">{rupiah(p.price)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      siap ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {siap ? 'Siap' : 'Tidak aktif'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {/* Sengaja tetap bisa disetel walau vendor menandai produknya
                        tidak siap: keputusan kita jangan ikut tersapu saat produk
                        pulih dari gangguan. */}
                    <Saklar
                      aktif={!!p.isEnabled}
                      sibuk={ubahSaklar.isPending}
                      onUbah={(nilai) => ubahSaklar.mutate({ id: p.id, enabled: nilai })}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-500">
            Halaman {pagination.page} dari {pagination.totalPages} · {angka(pagination.total)} produk
          </p>
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
  )
}
