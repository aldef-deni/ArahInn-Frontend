import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  PackageSearch, Search, Loader2, Inbox, ChevronLeft, ChevronRight, Layers,
} from 'lucide-react'
import { ppobItemApi } from '@/services/index'

const rupiah = (n) => (n == null ? '—' : 'Rp ' + Number(n).toLocaleString('id-ID'))
const angka  = (n) => Number(n || 0).toLocaleString('id-ID')

const fmtWaktu = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

/** Intl.format() MELEMPAR untuk tanggal tak valid — satu nilai rusak tidak
 *  boleh memutihkan seluruh panel admin. */
const amanWaktu = (v) => {
  if (!v) return 'Belum pernah'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '—' : fmtWaktu.format(d)
}

const VENDOR = [
  { key: 'all',        label: 'Semua vendor' },
  { key: 'rajabiller', label: 'Rajabiller' },
  { key: 'digiflazz',  label: 'Digiflazz' },
]

const STATUS = [
  { key: 'all',         label: 'Semua status' },
  { key: 'available',   label: 'Siap dijual' },
  { key: 'unavailable', label: 'Tidak aktif' },
]

const GAYA_VENDOR = {
  rajabiller: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  digiflazz : 'bg-teal-50 text-teal-700 ring-teal-200',
}

/**
 * Daftar item PPOB dari kedua pemasok dalam satu tabel.
 *
 * Harga yang dibandingkan adalah harga MODAL, karena itu satu-satunya angka
 * yang tersedia di kedua sisi. Harga jual hanya ada di Rajabiller — Digiflazz
 * belum melayani penjualan, dan menampilkan nol di sana akan terbaca seolah
 * produknya gratis.
 */
export default function AdminPpobItems() {
  // Menunya bernama RajaBiller, jadi itu yang tampil lebih dulu. Pilihan
  // vendor tetap ada supaya perbandingan dengan Digiflazz tidak hilang —
  // membandingkan harga modal antar pemasok justru alasan halaman ini dibuat.
  const [vendor, setVendor]     = useState('rajabiller')
  const [status, setStatus]     = useState('all')
  const [kategori, setKategori] = useState('')
  const [q, setQ]               = useState('')
  const [page, setPage]         = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ppob-items', vendor, status, kategori, q, page],
    queryFn : () => ppobItemApi.list({
      vendor, status,
      category: kategori || undefined,
      q: q || undefined,
      page, limit: 25,
    }).then(r => r.data),
    placeholderData: (prev) => prev,
  })

  const rows       = data?.data ?? []
  const kategoris  = data?.categories ?? []
  const stats      = data?.stats ?? {}
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0 }

  const saring = (setter) => (nilai) => { setter(nilai); setPage(1) }

  const judulVendor = vendor === 'rajabiller' ? 'Item RajaBiller'
                    : vendor === 'digiflazz'  ? 'Item Digiflazz'
                    : 'Item PPOB'
  const ketVendor = vendor === 'all'
    ? 'Produk dari kedua pemasok, dalam satu daftar.'
    : 'Ganti pilihan vendor untuk membandingkan dengan pemasok lain.'

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 sm:p-7 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center">
            <PackageSearch className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">{judulVendor}</h1>
            <p className="text-sm text-slate-300 mt-0.5">{ketVendor}</p>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <KartuVendor nama="Rajabiller" data={stats.rajabiller} tone="indigo" />
          <KartuVendor nama="Digiflazz"  data={stats.digiflazz}  tone="teal" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 px-5 py-3.5 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={q} onChange={e => saring(setQ)(e.target.value)}
              placeholder="Cari nama, kode, atau brand..."
              className="w-60 pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <Pilih nilai={vendor}   onUbah={saring(setVendor)} opsi={VENDOR} />
          <Pilih nilai={status}   onUbah={saring(setStatus)} opsi={STATUS} />
          <select
            value={kategori} onChange={e => saring(setKategori)(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">Semua kategori</option>
            {kategoris.map(k => <option key={k} value={k}>{k}</option>)}
          </select>

          <span className="ml-auto text-xs text-slate-400">{angka(pagination.total)} item</span>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : rows.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Inbox className="w-5 h-5 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">Tidak ada item yang cocok</p>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              Coba ubah filter, atau sinkronkan katalog vendor lebih dulu.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50/70">
                <th className="px-5 py-3 font-semibold">Produk</th>
                <th className="px-5 py-3 font-semibold">Vendor</th>
                <th className="px-5 py-3 font-semibold">Kategori</th>
                <th className="px-5 py-3 font-semibold">Kode</th>
                <th className="px-5 py-3 font-semibold text-right">Modal</th>
                <th className="px-5 py-3 font-semibold text-right">Jual</th>
                <th className="px-5 py-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p, i) => (
                <tr key={`${p.vendor}-${p.code}-${i}`} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-800">{p.productName}</p>
                    {p.brand ? <p className="text-[11px] text-slate-400">{p.brand}</p> : null}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ring-1 ${GAYA_VENDOR[p.vendor] ?? 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                      {p.vendor === 'rajabiller' ? 'Rajabiller' : 'Digiflazz'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.category || '—'}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{p.code}</td>
                  <td className="px-5 py-3 text-right font-bold text-slate-900">{rupiah(p.priceBuy)}</td>
                  <td className="px-5 py-3 text-right text-slate-600">
                    {p.priceSell != null ? rupiah(p.priceSell)
                      : <span className="text-[11px] text-slate-400">belum dijual</span>}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      p.available ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {p.available ? 'Siap' : 'Tidak aktif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  )
}

function Pilih({ nilai, onUbah, opsi }) {
  return (
    <select
      value={nilai} onChange={e => onUbah(e.target.value)}
      className="px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
    >
      {opsi.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
    </select>
  )
}

function KartuVendor({ nama, data, tone }) {
  const warna = tone === 'teal'
    ? 'bg-teal-400/10 ring-teal-300/25'
    : 'bg-indigo-400/10 ring-indigo-300/25'
  return (
    <div className={`rounded-2xl px-4 py-3.5 ring-1 ${warna}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-200">
        <Layers className="w-3.5 h-3.5" /> {nama}
      </div>
      <p className="mt-1 text-lg font-extrabold text-white">
        {angka(data?.available)} <span className="text-sm font-medium text-slate-300">/ {angka(data?.total)} siap</span>
      </p>
      <p className="mt-0.5 text-[11px] text-slate-400">Sinkron terakhir: {amanWaktu(data?.lastSync)}</p>
    </div>
  )
}
