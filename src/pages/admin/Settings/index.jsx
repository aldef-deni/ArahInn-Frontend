import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import {
  Settings as SettingsIcon, Landmark, CreditCard, Save, RefreshCw,
  Building2, User, Hash, Clock, CheckCircle2, AlertTriangle, Info,
  ToggleLeft, ToggleRight, Wrench, Power, Receipt, Percent,
} from 'lucide-react'

const BANK_OPTIONS = [
  'BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB Niaga', 'Permata', 'BSI', 'Danamon',
  'OCBC NISP', 'Maybank', 'BTN', 'Mega', 'BJB', 'Lainnya',
]

export default function AdminSettings() {
  const { toast } = useToast()
  const qc = useQueryClient()

  /* ── Fetch current settings ─────────────────────────────────────── */
  const { data: modeData, isLoading: modeLoading } = useQuery({
    queryKey: ['admin-payment-mode'],
    queryFn : () => adminApi.getPaymentMode().then(r => r.data?.data),
  })

  const { data: bankData, isLoading: bankLoading } = useQuery({
    queryKey: ['admin-payment-manual'],
    queryFn : () => adminApi.getPaymentManual().then(r => r.data?.data),
  })

  const { data: maintData, isLoading: maintLoading } = useQuery({
    queryKey: ['admin-maintenance'],
    queryFn : () => adminApi.getMaintenance().then(r => r.data?.data),
  })

  const [maintMsg, setMaintMsg] = useState('')
  useEffect(() => {
    if (maintData?.message != null) setMaintMsg(maintData.message)
  }, [maintData])

  const maintMutation = useMutation({
    mutationFn: (payload) => adminApi.setMaintenance(payload),
    onSuccess: (r) => {
      toast({
        title: r.data?.data?.enabled ? 'Maintenance AKTIF' : 'Maintenance dimatikan',
        description: r.data?.data?.enabled
          ? 'Customer arahinn.com akan diarahkan ke halaman maintenance.'
          : 'Customer arahinn.com kembali normal.',
      })
      qc.invalidateQueries({ queryKey: ['admin-maintenance'] })
      qc.invalidateQueries({ queryKey: ['maintenance-status'] })
    },
    onError: (e) => toast({ title: 'Gagal update maintenance', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const maintEnabled = !!maintData?.enabled

  /* ── PPN Tax ──────────────────────────────────────────────────────── */
  const { data: ppnData, isLoading: ppnLoading } = useQuery({
    queryKey: ['admin-ppn-tax'],
    queryFn : () => adminApi.getPpnTax().then(r => r.data?.data),
  })

  const [ppnPercent, setPpnPercent] = useState(11)
  useEffect(() => {
    if (ppnData?.percent != null) setPpnPercent(ppnData.percent)
  }, [ppnData])

  const ppnMutation = useMutation({
    mutationFn: (payload) => adminApi.setPpnTax(payload),
    onSuccess: (r) => {
      toast({
        title: r.data?.data?.enabled ? `PPN ${r.data?.data?.percent}% AKTIF` : 'PPN dimatikan',
        description: r.data?.message,
      })
      qc.invalidateQueries({ queryKey: ['admin-ppn-tax'] })
    },
    onError: (e) => toast({ title: 'Gagal update PPN', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const ppnEnabled = !!ppnData?.enabled

  /* ── Markup Travel ────────────────────────────────────────────────── */
  const { data: mkData, isLoading: mkLoading } = useQuery({
    queryKey: ['admin-travel-markup'],
    queryFn : () => adminApi.getTravelMarkup().then(r => r.data?.data),
  })
  const [mkAmount, setMkAmount] = useState(7500)
  useEffect(() => { if (mkData?.amount != null) setMkAmount(mkData.amount) }, [mkData])

  const mkMutation = useMutation({
    mutationFn: (payload) => adminApi.setTravelMarkup(payload),
    onSuccess: (r) => {
      toast({ title: 'Markup travel diperbarui', description: r.data?.message })
      qc.invalidateQueries({ queryKey: ['admin-travel-markup'] })
    },
    onError: (e) => toast({ title: 'Gagal update markup', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  /* ── Local form state ────────────────────────────────────────────── */
  const [bank, setBank] = useState({
    bank_name: '', account_number: '', account_name: '', expires_hours: 24,
  })
  const [customBank, setCustomBank] = useState(false)

  useEffect(() => {
    if (bankData) {
      setBank({
        bank_name      : bankData.bank_name      || 'BCA',
        account_number : bankData.account_number || '',
        account_name   : bankData.account_name   || '',
        expires_hours  : bankData.expires_hours  || 24,
      })
      // If bank_name not in preset list → switch to custom
      if (bankData.bank_name && !BANK_OPTIONS.slice(0, -1).includes(bankData.bank_name)) {
        setCustomBank(true)
      }
    }
  }, [bankData])

  /* ── Mutations ───────────────────────────────────────────────────── */
  const modeMutation = useMutation({
    mutationFn: (mode) => adminApi.setPaymentMode({ mode }),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['admin-payment-mode'] })
      toast({ title: 'Mode pembayaran berhasil diperbarui.' })
    },
    onError: (e) => toast({
      title: 'Gagal mengubah mode',
      description: e?.response?.data?.message,
      variant: 'destructive',
    }),
  })

  const bankMutation = useMutation({
    mutationFn: (d) => adminApi.setPaymentManual(d),
    onSuccess : (r) => {
      qc.invalidateQueries({ queryKey: ['admin-payment-manual'] })
      toast({ title: r.data?.message || 'Rekening berhasil disimpan.' })
    },
    onError: (e) => toast({
      title: 'Gagal menyimpan',
      description: e?.response?.data?.message || 'Cek koneksi atau format data.',
      variant: 'destructive',
    }),
  })

  const handleSaveBank = (e) => {
    e.preventDefault()
    bankMutation.mutate(bank)
  }

  const currentMode = modeData?.mode || 'doku'

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center shrink-0">
            <SettingsIcon className="w-5 h-5" />
          </div>
          Pengaturan Sistem
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Konfigurasi mode pembayaran dan rekening transfer manual.
        </p>
      </div>

      {/* ── Maintenance Mode ─────────────────────────────────────────── */}
      <div className={`bg-white rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6 shadow-sm transition-all ${
        maintEnabled ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200'
      }`}>
        <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl text-white flex items-center justify-center shrink-0 ${
            maintEnabled ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-slate-500 to-slate-700'
          }`}>
            <Wrench className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Maintenance Mode</h2>
              {maintEnabled && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                  </span>
                  AKTIF
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
              Saat aktif: <strong>arahinn.com</strong> (customer-facing) akan menampilkan halaman maintenance.
              Admin panel & owner portal tetap accessible.
            </p>
          </div>
        </div>

        {maintLoading ? (
          <div className="skeleton h-20 rounded-xl" />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <button
                onClick={() => maintMutation.mutate({ enabled: !maintEnabled, message: maintMsg || null })}
                disabled={maintMutation.isPending}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-50 ${
                  maintEnabled
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/30'
                }`}
              >
                <Power className="w-4 h-4" />
                {maintMutation.isPending
                  ? 'Memproses...'
                  : maintEnabled
                    ? 'Matikan Maintenance — Buka Site'
                    : 'Aktifkan Maintenance — Tutup Site'}
              </button>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-snug sm:flex-1">
                Perubahan langsung berlaku ke customer (refresh tiap 30 detik di sisi browser).
              </p>
            </div>

            <div className="mt-4">
              <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                Pesan Khusus (Opsional)
              </label>
              <textarea
                value={maintMsg}
                onChange={e => setMaintMsg(e.target.value)}
                placeholder="Misal: 'Sistem PPOB sedang ditingkatkan, estimasi 2 jam.' — kosongkan untuk pakai pesan default."
                rows={2}
                maxLength={300}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">{maintMsg.length}/300 — pesan ini ditampilkan di halaman maintenance customer.</p>
            </div>

            {maintEnabled && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Maintenance mode <strong>AKTIF sekarang</strong>. Customer di arahinn.com tidak bisa transaksi.
                  Jangan lupa <strong>matikan</strong> setelah operasi selesai.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── PPN Tax Toggle ───────────────────────────────────────────── */}
      <div className={`bg-white rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6 shadow-sm transition-all ${
        ppnEnabled ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200'
      }`}>
        <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl text-white flex items-center justify-center shrink-0 ${
            ppnEnabled ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-slate-500 to-slate-700'
          }`}>
            <Receipt className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Pajak PPN</h2>
              {ppnEnabled ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" />
                  Aktif {ppnData?.percent}%
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  Nonaktif
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
              PPN ditambahkan ke total setiap booking baru. Saat dimatikan, customer tidak dikenakan PPN.
              <strong className="text-slate-600"> Tidak memengaruhi</strong> komponen "Pajak &amp; Others" (komisi properti).
            </p>
          </div>
        </div>

        {ppnLoading ? (
          <div className="skeleton h-20 rounded-xl" />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              {/* Percent input */}
              <div className="sm:w-44">
                <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                  Persentase PPN
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    value={ppnPercent}
                    onChange={e => setPpnPercent(e.target.value)}
                    className="w-full pl-3 pr-9 py-3 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500"
                  />
                  <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Toggle button */}
              <button
                onClick={() => ppnMutation.mutate({ enabled: !ppnEnabled, percent: parseFloat(ppnPercent) || 0 })}
                disabled={ppnMutation.isPending}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-50 ${
                  ppnEnabled
                    ? 'bg-slate-700 hover:bg-slate-800 text-white shadow-md shadow-slate-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/30'
                }`}
              >
                <Power className="w-4 h-4" />
                {ppnMutation.isPending
                  ? 'Memproses...'
                  : ppnEnabled
                    ? 'Matikan PPN'
                    : 'Aktifkan PPN'}
              </button>

              {/* Save percent only (while enabled) */}
              {ppnEnabled && (
                <button
                  onClick={() => ppnMutation.mutate({ enabled: true, percent: parseFloat(ppnPercent) || 0 })}
                  disabled={ppnMutation.isPending || parseFloat(ppnPercent) === ppnData?.percent}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 active:scale-[0.97] transition-all disabled:opacity-40"
                >
                  <Save className="w-4 h-4" />
                  Simpan %
                </button>
              )}
            </div>

            <div className={`mt-4 flex items-start gap-2 p-3 rounded-lg border ${
              ppnEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <Info className={`w-4 h-4 shrink-0 mt-0.5 ${ppnEnabled ? 'text-emerald-700' : 'text-slate-500'}`} />
              <p className={`text-xs leading-relaxed ${ppnEnabled ? 'text-emerald-800' : 'text-slate-600'}`}>
                {ppnEnabled
                  ? <>PPN <strong>{ppnData?.percent}%</strong> aktif. Setiap booking baru otomatis dikenakan PPN. Booking yang sudah pending tetap pakai nilai lama.</>
                  : <>PPN <strong>nonaktif</strong>. Booking baru tidak dikenakan PPN. Aktifkan kembali kapan saja tanpa kehilangan setelan persen.</>}
              </p>
            </div>

            {ppnData?.updated_at && (
              <p className="text-[10px] sm:text-xs text-slate-400 mt-2">
                Terakhir diperbarui: {new Date(ppnData.updated_at).toLocaleString('id-ID')}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Markup Travel ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Markup Travel (Biaya Layanan)</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
              Margin flat ArahInn per penumpang di atas harga vendor — berlaku untuk <strong>kereta, pesawat, bus, pelni</strong>.
            </p>
          </div>
        </div>
        {mkLoading ? <div className="skeleton h-20 rounded-xl" /> : (
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="sm:w-56">
              <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Biaya Layanan / Penumpang</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">Rp</span>
                <input type="number" min={0} step={500} value={mkAmount} onChange={e => setMkAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-500" />
              </div>
            </div>
            <button
              onClick={() => mkMutation.mutate({ amount: parseInt(mkAmount) || 0 })}
              disabled={mkMutation.isPending || parseInt(mkAmount) === mkData?.amount}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm active:scale-[0.97] transition-all disabled:opacity-40"
            >
              <Save className="w-4 h-4" /> {mkMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
            <p className="text-[11px] sm:text-xs text-slate-500 sm:flex-1 leading-snug">
              Contoh: harga KAI Rp 100.000 + markup Rp {Number(mkAmount).toLocaleString('id-ID')} = customer bayar Rp {(100000 + (parseInt(mkAmount) || 0)).toLocaleString('id-ID')}/pax.
            </p>
          </div>
        )}
        {mkData?.updated_at && (
          <p className="text-[10px] sm:text-xs text-slate-400 mt-3">Terakhir diperbarui: {new Date(mkData.updated_at).toLocaleString('id-ID')}</p>
        )}
      </div>

      {/* ── Payment Mode Toggle ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Mode Pembayaran</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Pilih sistem pembayaran yang aktif untuk semua booking baru.
            </p>
          </div>
        </div>

        {modeLoading ? (
          <div className="skeleton h-20 rounded-xl" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => modeMutation.mutate('manual')}
              disabled={modeMutation.isPending || currentMode === 'manual'}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                currentMode === 'manual'
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Landmark className={`w-5 h-5 ${currentMode === 'manual' ? 'text-blue-600' : 'text-slate-400'}`} />
                {currentMode === 'manual' && (
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <p className="font-bold text-sm text-slate-900">Manual Transfer</p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">User transfer manual ke rekening + admin verifikasi</p>
            </button>

            <button
              onClick={() => modeMutation.mutate('doku')}
              disabled={modeMutation.isPending || currentMode === 'doku'}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                currentMode === 'doku'
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <CreditCard className={`w-5 h-5 ${currentMode === 'doku' ? 'text-blue-600' : 'text-slate-400'}`} />
                {currentMode === 'doku' && (
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <p className="font-bold text-sm text-slate-900">DOKU Gateway</p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Virtual Account otomatis (BCA, BRI, BSI, Mandiri)</p>
            </button>
          </div>
        )}

        {currentMode === 'manual' && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Mode <strong>Manual Transfer</strong> aktif. User akan diarahkan ke instruksi transfer bank di bawah. Pastikan rekening tujuan sudah benar.
            </p>
          </div>
        )}
      </div>

      {/* ── Manual Bank Settings ────────────────────────────────────── */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Rekening Pembayaran Manual</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
              Nomor rekening yang ditampilkan ke user saat memilih pembayaran manual transfer.
              Perubahan langsung aktif untuk booking baru.
            </p>
          </div>
        </div>

        {bankLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : (
          <form onSubmit={handleSaveBank} className="space-y-4 sm:space-y-5">
            {/* Bank Name */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                Bank Tujuan <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={customBank ? 'Lainnya' : bank.bank_name}
                  onChange={(e) => {
                    if (e.target.value === 'Lainnya') {
                      setCustomBank(true)
                      setBank(b => ({ ...b, bank_name: '' }))
                    } else {
                      setCustomBank(false)
                      setBank(b => ({ ...b, bank_name: e.target.value }))
                    }
                  }}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500"
                >
                  {BANK_OPTIONS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {customBank && (
                  <input
                    type="text"
                    value={bank.bank_name}
                    onChange={(e) => setBank(b => ({ ...b, bank_name: e.target.value }))}
                    placeholder="Nama bank custom"
                    required
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500"
                  />
                )}
              </div>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-slate-400" />
                Nomor Rekening <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bank.account_number}
                onChange={(e) => setBank(b => ({ ...b, account_number: e.target.value.replace(/[^0-9]/g, '') }))}
                placeholder="Contoh: 8040083848"
                required
                inputMode="numeric"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500"
              />
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Hanya angka. Akan ditampilkan apa adanya ke user.</p>
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                Atas Nama <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bank.account_name}
                onChange={(e) => setBank(b => ({ ...b, account_name: e.target.value }))}
                placeholder="Nama pemilik rekening sesuai buku tabungan"
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500"
              />
            </div>

            {/* Expires hours */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                Batas Waktu Transfer (jam)
              </label>
              <input
                type="number"
                min={1}
                max={168}
                value={bank.expires_hours}
                onChange={(e) => setBank(b => ({ ...b, expires_hours: parseInt(e.target.value) || 24 }))}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500"
              />
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                Booking akan expire jika user tidak transfer dalam waktu ini. Min 1 jam, max 168 jam (7 hari). Default: 24 jam.
              </p>
            </div>

            {/* Preview */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-orange-700 mb-2 sm:mb-3">
                ✦ Preview Tampilan ke User
              </p>
              <div className="space-y-1.5 sm:space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Bank Tujuan</span>
                  <span className="font-bold text-slate-900">{bank.bank_name || '—'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Nomor Rekening</span>
                  <span className="font-mono font-bold text-slate-900">{bank.account_number || '—'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Atas Nama</span>
                  <span className="font-bold text-slate-900 text-right">{bank.account_name || '—'}</span>
                </div>
                <div className="flex justify-between gap-3 pt-2 border-t border-orange-200">
                  <span className="text-slate-500">Batas waktu</span>
                  <span className="font-bold text-slate-900">{bank.expires_hours} jam</span>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Hati-hati:</strong> Perubahan langsung berlaku untuk semua booking baru. Booking yang sudah pending (sudah klik "Bayar Sekarang") tetap pakai rekening lama. Pastikan data benar sebelum simpan.
              </p>
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  if (bankData) setBank({
                    bank_name      : bankData.bank_name,
                    account_number : bankData.account_number,
                    account_name   : bankData.account_name,
                    expires_hours  : bankData.expires_hours,
                  })
                }}
                disabled={bankMutation.isPending}
                className="px-4 py-2.5 sm:py-3 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Form
              </button>
              <button
                type="submit"
                disabled={bankMutation.isPending}
                className="px-5 py-2.5 sm:py-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-bold hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Save className="w-4 h-4" />
                {bankMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>

            {/* Last updated info */}
            {bankData?.updated_at && (
              <p className="text-[10px] sm:text-xs text-slate-400 text-center pt-1">
                Terakhir diperbarui: {new Date(bankData.updated_at).toLocaleString('id-ID')}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
