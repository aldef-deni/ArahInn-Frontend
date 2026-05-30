import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import {
  Settings as SettingsIcon, Landmark, CreditCard, Save, RefreshCw,
  Building2, User, Hash, Clock, CheckCircle2, AlertTriangle, Info,
  ToggleLeft, ToggleRight,
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
