import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ppobApi, paymentApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import {
  Clock, Copy, CheckCircle, XCircle, ArrowLeft, Info, Loader2,
  Receipt, Building2,
} from 'lucide-react'
import SEO from '@/components/SEO'

function useCountdown(expiresAt) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    if (!expiresAt) return
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000))
    setSecs(calc())
    const t = setInterval(() => setSecs(calc()), 1000)
    return () => clearInterval(t)
  }, [expiresAt])
  const h = String(Math.floor(secs / 3600)).padStart(2, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return { secs, display: `${h}:${m}:${s}`, expired: secs === 0 && !!expiresAt }
}

const STATUS_PRESENTATION = {
  pending     : { label: 'Menunggu Pembayaran', color: 'amber',   Icon: Clock },
  paid        : { label: 'Pembayaran Diterima',  color: 'blue',    Icon: CheckCircle },
  processing  : { label: 'Diproses Vendor',      color: 'blue',    Icon: Loader2 },
  inquired    : { label: 'Menunggu Konfirmasi',  color: 'amber',   Icon: Clock },
  success     : { label: 'Berhasil',             color: 'emerald', Icon: CheckCircle },
  failed      : { label: 'Gagal',                color: 'red',     Icon: XCircle },
  refundable  : { label: 'Akan Direfund',        color: 'amber',   Icon: Clock },
  refunded    : { label: 'Direfund',             color: 'slate',   Icon: Clock },
}

export default function PpobPayment() {
  const { trxCode } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [copiedField, setCopiedField] = useState('')

  // Mode pembayaran (manual/doku) + bank info
  const { data: modeData } = useQuery({
    queryKey: ['payment-mode'],
    queryFn : () => paymentApi.mode().then(r => r.data?.data),
    staleTime: 60_000,
  })
  const paymentMode = modeData?.mode ?? 'manual'
  const manualBank  = modeData?.bank

  // Transaksi PPOB
  const { data: trx, isLoading } = useQuery({
    queryKey: ['ppob-trx', trxCode],
    queryFn : () => ppobApi.getTrx(trxCode).then(r => r.data?.data),
    refetchInterval: (q) => {
      const s = q.state.data?.status
      // polling lebih sering saat menunggu konfirmasi / sedang diproses
      return ['pending', 'paid', 'processing', 'inquired'].includes(s) ? 8000 : false
    },
  })

  const expiresAt = trx?.timestamps?.expiresAt
  const { display: countdown, expired } = useCountdown(expiresAt)

  const totalAmount = Number(trx?.pricing?.totalAmount || 0)
  // Kode unik 3 digit deterministik dari trx_code agar konsisten saat refetch
  const uniqueCode = (() => {
    if (!trxCode) return 0
    let h = 0
    for (let i = 0; i < trxCode.length; i++) h = (h * 31 + trxCode.charCodeAt(i)) >>> 0
    return h % 1000
  })()
  const finalAmount = totalAmount + uniqueCode

  const copyText = (text, field) => {
    if (text == null) return
    navigator.clipboard.writeText(String(text))
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  if (isLoading) {
    return (
      <div className="container py-20 text-center">
        <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (!trx) {
    return (
      <div className="container py-16 text-center max-w-md mx-auto">
        <XCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-700 font-semibold">Transaksi tidak ditemukan.</p>
        <Link to="/ppob" className="inline-block mt-4 text-sm font-semibold text-brand hover:underline">
          Kembali ke PPOB
        </Link>
      </div>
    )
  }

  const status     = trx.status || 'pending'
  const presentation = STATUS_PRESENTATION[status] || STATUS_PRESENTATION.pending
  const StatusIcon = presentation.Icon

  // ── Terminal states ──
  if (status === 'success') {
    return (
      <SuccessView trx={trx} navigate={navigate} />
    )
  }
  if (['failed', 'refundable', 'refunded'].includes(status)) {
    return (
      <FailedView trx={trx} status={status} navigate={navigate} />
    )
  }

  // ── Active payment / waiting states ──
  return (
    <div className="bg-slate-50 sm:bg-transparent min-h-[60vh] pb-6">
      <SEO title="Selesaikan Pembayaran" description="Instruksi pembayaran transaksi PPOB ArahInn." />

      {/* Sticky header mobile */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 sm:hidden">
        <div className="container py-3 flex items-center gap-2">
          <Link to="/ppob" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-90 transition-all" aria-label="Kembali">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <h1 className="font-bold text-slate-900 text-base leading-tight flex-1 truncate">
            Selesaikan Pembayaran
          </h1>
        </div>
      </header>

      <div className="container py-4 sm:py-6 lg:py-8 max-w-2xl">
        {/* Desktop title */}
        <div className="hidden sm:block">
          <Link to="/ppob" className="inline-flex items-center gap-1 text-xs sm:text-sm text-slate-500 hover:text-brand mb-3">
            <ArrowLeft className="w-4 h-4" /> Kembali ke PPOB
          </Link>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-2 leading-tight">
            Selesaikan Pembayaran
          </h1>
        </div>

      {/* Status indicator */}
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4 text-xs sm:text-sm font-semibold bg-${presentation.color}-50 border border-${presentation.color}-200 text-${presentation.color}-700`}>
        <StatusIcon className={`w-4 h-4 shrink-0 ${status === 'processing' ? 'animate-spin' : ''}`} />
        <span className="truncate">{presentation.label}</span>
        {expiresAt && !expired && status === 'pending' && (
          <span className="ml-auto font-mono text-[10px] sm:text-xs shrink-0">{countdown}</span>
        )}
      </div>

      {/* Transaction summary */}
      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400 font-bold">Produk</p>
            <p className="font-bold text-sm sm:text-base text-slate-900 line-clamp-2">{trx.product?.name}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{trx.customer?.number}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-400 font-bold">Kode</p>
            <p className="font-mono text-xs sm:text-sm font-bold text-brand">{trx.trxCode}</p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs sm:text-sm">
          <Row label="Tagihan / Harga" value={formatRupiah(trx.pricing?.tagihan || totalAmount)} />
          {Number(trx.pricing?.adminFee || 0) > 0 && (
            <Row label="Biaya admin" value={formatRupiah(trx.pricing?.adminFee)} />
          )}
          <Row label="Subtotal" value={formatRupiah(totalAmount)} />
          {paymentMode === 'manual' && (
            <Row label="Kode unik" value={`+ ${String(uniqueCode).padStart(3, '0')}`} accent="brand" />
          )}
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center font-bold">
            <span className="text-sm sm:text-base">Total Transfer</span>
            <span className="text-base sm:text-xl text-brand">{formatRupiah(finalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Manual transfer instructions */}
      {paymentMode === 'manual' && manualBank && (
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
          {/* Amount */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs sm:text-sm text-slate-500">Nominal Transfer</p>
            <span className="text-[10px] sm:text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded">NOMINAL UNIK</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 rounded-xl px-3 sm:px-4 py-3 sm:py-4 mb-2">
            <span className="font-mono text-xl sm:text-3xl font-black tracking-tight flex-1 min-w-0 text-slate-900 truncate">
              {formatRupiah(finalAmount)}
            </span>
            <button onClick={() => copyText(finalAmount, 'amount')}
              className="p-2 rounded-xl hover:bg-white active:scale-90 transition-all shrink-0">
              {copiedField === 'amount'
                ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                : <Copy className="w-5 h-5 text-slate-500" />}
            </button>
          </div>
          <p className="text-[11px] sm:text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 sm:mb-5 flex items-start gap-2 leading-relaxed">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Transfer <strong>tepat {formatRupiah(finalAmount)}</strong> (termasuk 3 digit kode unik <strong>{String(uniqueCode).padStart(3, '0')}</strong>) supaya admin lebih cepat verifikasi.
            </span>
          </p>

          {/* Bank info */}
          <div className="space-y-2 mb-4 sm:mb-5">
            <FieldRow label="Bank Tujuan" value={manualBank.bankName} />
            <FieldRow label="Nomor Rekening" value={manualBank.accountNumber}
              onCopy={() => copyText(manualBank.accountNumber, 'rek')}
              copied={copiedField === 'rek'} mono />
            <FieldRow label="Atas Nama" value={manualBank.accountName} />
          </div>

          {/* How to pay */}
          <div className="space-y-2 text-xs sm:text-sm bg-slate-50 rounded-xl p-3.5 sm:p-4 mb-4 sm:mb-5">
            <p className="font-semibold text-slate-700 mb-2">Cara Pembayaran:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-slate-600 leading-relaxed">
              <li>Transfer <strong>tepat</strong> {formatRupiah(finalAmount)} ke rekening di atas.</li>
              <li>Pakai <strong>1 rekening yang sama</strong> agar sistem cepat mendeteksi.</li>
              <li>Admin verifikasi mutasi rekening (1-15 menit jam kerja, lebih lama di luar jam kerja).</li>
              <li>Setelah terverifikasi, pulsa/token akan dikirim ke <strong className="font-mono">{trx.customer?.number}</strong>.</li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">
              Sudah transfer? Tidak perlu konfirmasi. Status akan otomatis ter-update setelah admin verifikasi mutasi rekening.
            </p>
          </div>
        </div>
      )}

      {paymentMode !== 'manual' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          Mode pembayaran <strong>{paymentMode}</strong> belum didukung untuk PPOB. Hubungi admin.
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3">
        <Link to="/ppob/history"
          className="text-center py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all">
          Riwayat
        </Link>
        <a href="https://wa.me/6285188136009" target="_blank" rel="noopener noreferrer"
          className="text-center py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 active:scale-[0.98] transition-all">
          Chat Admin
        </a>
      </div>
      </div>
    </div>
  )
}

function Row({ label, value, accent }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500">{label}</span>
      <span className={accent === 'brand' ? 'font-semibold text-brand' : 'text-slate-700'}>{value}</span>
    </div>
  )
}

function FieldRow({ label, value, onCopy, copied, mono }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs sm:text-sm text-slate-500">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-xs sm:text-sm font-semibold text-slate-900 truncate ${mono ? 'font-mono tracking-wide' : ''}`}>{value}</span>
        {onCopy && (
          <button onClick={onCopy} className="p-1.5 rounded-lg hover:bg-slate-100 active:scale-90 transition-all shrink-0">
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
          </button>
        )}
      </div>
    </div>
  )
}

function SuccessView({ trx, navigate }) {
  return (
    <div className="container py-12 sm:py-16 lg:py-20 max-w-md mx-auto text-center px-4">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 sm:mb-6">
        <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
      </div>
      <h1 className="font-display text-xl sm:text-2xl font-bold mb-2 text-emerald-700">Transaksi Berhasil!</h1>
      <p className="text-sm sm:text-base text-slate-600 mb-1">
        <strong>{trx.product?.name}</strong> sudah dikirim ke <strong className="font-mono">{trx.customer?.number}</strong>.
      </p>
      {(() => {
        const sn = trx.serialNumber
        const hasSn = sn && String(sn).trim() && String(sn).trim() !== '-'
        if (!hasSn) return null
        return (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-left">
            <p className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase mb-1">Token / SN</p>
            <p className="font-mono text-sm sm:text-base font-bold text-emerald-900 break-all">{sn}</p>
          </div>
        )
      })()}
      <div className="mt-6 sm:mt-8 flex gap-3">
        <button onClick={() => navigate('/ppob')}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          Transaksi Lagi
        </button>
        <button onClick={() => navigate('/ppob/history')}
          className="flex-1 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 text-sm">
          Lihat Riwayat
        </button>
      </div>
    </div>
  )
}

function FailedView({ trx, status, navigate }) {
  const presentation = STATUS_PRESENTATION[status]
  const Icon = presentation?.Icon || XCircle
  return (
    <div className="container py-12 sm:py-16 max-w-md mx-auto text-center px-4">
      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-${presentation?.color || 'red'}-100 flex items-center justify-center mx-auto mb-4 sm:mb-6`}>
        <Icon className={`w-10 h-10 sm:w-12 sm:h-12 text-${presentation?.color || 'red'}-600`} />
      </div>
      <h1 className="font-display text-xl sm:text-2xl font-bold mb-2 text-slate-900">{presentation?.label || 'Gagal'}</h1>
      <p className="text-sm sm:text-base text-slate-600 mb-1">
        Kode transaksi: <strong className="font-mono">{trx.trxCode}</strong>
      </p>
      {trx.failureReason && (
        <p className="text-sm text-slate-500 mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
          {trx.failureReason}
        </p>
      )}
      {status === 'refundable' && (
        <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed">
          Dana akan dikembalikan oleh admin ke rekening pengirim. Mohon tunggu — proses 1-2 hari kerja.
        </p>
      )}
      <div className="mt-6 sm:mt-8 flex gap-3">
        <button onClick={() => navigate('/ppob')}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          Kembali
        </button>
        <a href="https://wa.me/6285188136009" target="_blank" rel="noopener noreferrer"
          className="flex-1 py-3 text-center bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 text-sm">
          Chat Admin
        </a>
      </div>
    </div>
  )
}
