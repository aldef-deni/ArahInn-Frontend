import { useMemo, useState, useEffect } from 'react'
import { formatRupiah } from '@/utils'
import { Wallet, AlertCircle, Loader2, Check } from 'lucide-react'

/**
 * Layout khusus Top Up E-Wallet:
 * - Card pilih e-wallet (GoPay, OVO, DANA, ShopeePay, LinkAja, dst)
 * - Input nomor HP / akun e-wallet
 * - Grid nominal (auto-sorted dari produk yg ter-grant)
 *
 * Props:
 *   products             - array produk e-wallet
 *   loadingProducts
 *   customerNumber       - nomor akun e-wallet
 *   onCustomerChange
 *   selectedProduct
 *   onSelectProduct
 */

// Mapping keyword di nama produk → brand label & styling
const EWALLET_BRANDS = [
  { id: 'GOPAY',      label: 'GoPay',     match: /\bGO[\s-]?PAY\b|\bGOPAY\b/,             color: 'bg-emerald-500',  soft: 'bg-emerald-50',  accent: 'text-emerald-700',  border: 'border-emerald-500' },
  { id: 'OVO',        label: 'OVO',       match: /\bOVO\b/,                                color: 'bg-violet-600',   soft: 'bg-violet-50',   accent: 'text-violet-700',   border: 'border-violet-600' },
  { id: 'DANA',       label: 'DANA',      match: /\bDANA\b/,                               color: 'bg-sky-500',      soft: 'bg-sky-50',      accent: 'text-sky-700',      border: 'border-sky-500' },
  { id: 'SHOPEEPAY',  label: 'ShopeePay', match: /\bSHOPEE[\s-]?PAY\b|\bSHOPEE\b|\bSPAY\b/,color: 'bg-orange-500',   soft: 'bg-orange-50',   accent: 'text-orange-700',   border: 'border-orange-500' },
  { id: 'LINKAJA',    label: 'LinkAja',   match: /\bLINK[\s-]?AJA\b|\bLINKAJA\b/,          color: 'bg-red-500',      soft: 'bg-red-50',      accent: 'text-red-700',      border: 'border-red-500' },
  { id: 'SPEEDCASH',  label: 'SpeedCash', match: /\bSPEED[\s-]?CASH\b|\bSPEEDCASH\b/,      color: 'bg-rose-600',     soft: 'bg-rose-50',     accent: 'text-rose-700',     border: 'border-rose-600' },
  { id: 'SAKUKU',     label: 'Sakuku',    match: /\bSAKUKU\b/,                             color: 'bg-blue-600',     soft: 'bg-blue-50',     accent: 'text-blue-700',     border: 'border-blue-600' },
  { id: 'TAPCASH',    label: 'TapCash',   match: /\bTAP[\s-]?CASH\b|\bTAPCASH\b/,          color: 'bg-orange-600',   soft: 'bg-orange-50',   accent: 'text-orange-700',   border: 'border-orange-600' },
  { id: 'FLAZZ',      label: 'Flazz',     match: /\bFLAZZ\b/,                              color: 'bg-blue-500',     soft: 'bg-blue-50',     accent: 'text-blue-700',     border: 'border-blue-500' },
  { id: 'JENIUS',     label: 'Jenius',    match: /\bJENIUS\b/,                             color: 'bg-cyan-600',     soft: 'bg-cyan-50',     accent: 'text-cyan-700',     border: 'border-cyan-600' },
  { id: 'BRIZZI',     label: 'Brizzi',    match: /\bBRIZZI\b/,                             color: 'bg-indigo-600',   soft: 'bg-indigo-50',   accent: 'text-indigo-700',   border: 'border-indigo-600' },
]

// Nominal default untuk e-wallet open-denom
const EWALLET_NOMINALS = [10000, 20000, 50000, 100000, 200000, 500000, 1000000]

// Produk dianggap variable-nominal kalau priceSell-nya ≤ 5000 (admin fee saja, butuh extra.nominal)
function isOpenNominal(product) {
  return Number(product?.priceSell || 0) <= 5000
}

function classifyBrand(name) {
  const n = (name || '').toUpperCase()
  for (const b of EWALLET_BRANDS) {
    if (b.match.test(n)) return b.id
  }
  return 'OTHER'
}

const OTHER_STYLE = {
  id: 'OTHER', label: 'E-Wallet Lain', color: 'bg-slate-600', soft: 'bg-slate-50', accent: 'text-slate-700', border: 'border-slate-600',
}

export default function PpobEwalletView({
  products,
  loadingProducts,
  customerNumber,
  onCustomerChange,
  selectedProduct,
  onSelectProduct,
  onExtraChange,
}) {
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [nominal, setNominal]             = useState(null)

  // Group products by brand
  const grouped = useMemo(() => {
    const out = {}
    for (const p of products) {
      const id = classifyBrand(p.name)
      if (!out[id]) out[id] = []
      out[id].push(p)
    }
    // Sort each brand by price ascending
    for (const id of Object.keys(out)) {
      out[id].sort((a, b) => (a.priceSell || 0) - (b.priceSell || 0))
    }
    return out
  }, [products])

  // Active brand list (yang ada produknya saja)
  const availableBrands = useMemo(() => {
    const list = []
    for (const b of EWALLET_BRANDS) {
      if (grouped[b.id]?.length > 0) list.push(b)
    }
    if (grouped['OTHER']?.length > 0) list.push(OTHER_STYLE)
    return list
  }, [grouped])

  const brandProducts = selectedBrand ? (grouped[selectedBrand.id] || []) : []
  const brandStyle    = selectedBrand || null
  const useOpenNominal = brandProducts.length === 1 && isOpenNominal(brandProducts[0])

  // Reset saat brand berubah
  useEffect(() => {
    setNominal(null)
    onExtraChange?.({})
    onSelectProduct(null)
  }, [selectedBrand]) // eslint-disable-line

  // Open-nominal: selectedProduct hanya di-set kalau nominal sudah dipilih.
  // Bikin CTA "Lanjut Bayar" baru muncul setelah nominal valid.
  useEffect(() => {
    if (!selectedBrand) return
    if (useOpenNominal) {
      if (nominal) {
        onSelectProduct(brandProducts[0])
        onExtraChange?.({ nominal: String(nominal) })
      } else {
        onSelectProduct(null)
        onExtraChange?.({})
      }
    }
  }, [nominal, selectedBrand]) // eslint-disable-line

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Step 1: Pilih E-Wallet */}
      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5">
        <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 sm:mb-3">
          1. Pilih E-Wallet
        </p>

        {loadingProducts && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat e-wallet...
          </div>
        )}

        {!loadingProducts && availableBrands.length === 0 && (
          <div className="text-center py-8">
            <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-medium">Belum ada e-wallet tersedia.</p>
            <p className="text-[11px] text-slate-400 mt-1">Tim sedang request akses ke vendor.</p>
          </div>
        )}

        {!loadingProducts && availableBrands.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
            {availableBrands.map(b => {
              const active = selectedBrand?.id === b.id
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBrand(b)}
                  className={`relative aspect-square sm:aspect-auto sm:p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all active:scale-[0.96] overflow-hidden p-2 ${
                    active
                      ? `${b.border} ${b.soft} shadow-sm`
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center ${b.color}`}>
                    <Wallet className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <p className={`text-[11px] sm:text-xs font-bold text-center leading-tight ${active ? b.accent : 'text-slate-800'}`}>
                    {b.label}
                  </p>
                  {active && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Check className={`w-3 h-3 ${b.accent}`} strokeWidth={3} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Step 2: Input Nomor */}
      {selectedBrand && (
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 sm:mb-3">
            2. Nomor HP / Akun {selectedBrand.label}
          </p>
          <input
            type="tel"
            inputMode="numeric"
            value={customerNumber}
            onChange={e => onCustomerChange(e.target.value.replace(/\D/g, ''))}
            placeholder="Nomor HP yang terdaftar di e-wallet"
            maxLength={14}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
          <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
            Pastikan nomor HP <strong>terdaftar dan aktif</strong> di akun {selectedBrand.label} Anda.
          </p>
        </div>
      )}

      {/* Step 3: Pilih Nominal */}
      {selectedBrand && customerNumber.length >= 4 && (
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 sm:mb-3">
            3. Pilih Nominal Top Up
          </p>

          {brandProducts.length === 0 && (
            <div className="text-center py-6">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Belum ada nominal {selectedBrand.label} tersedia.</p>
            </div>
          )}

          {/* Open nominal (variable amount, user pilih dari chip preset) */}
          {brandProducts.length > 0 && useOpenNominal && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {EWALLET_NOMINALS.map(nom => {
                const active = nominal === nom
                return (
                  <button
                    key={nom}
                    onClick={() => setNominal(nom)}
                    className={`relative p-3 sm:p-3.5 rounded-xl border-2 text-left transition-all active:scale-[0.97] overflow-hidden ${
                      active
                        ? `${brandStyle.border} ${brandStyle.soft} shadow-sm`
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`absolute top-0 right-0 w-8 h-8 ${brandStyle.color} opacity-10 rounded-bl-3xl`} />
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-500 relative">Top Up</p>
                    <p className={`mt-1 text-sm sm:text-base font-bold ${active ? brandStyle.accent : 'text-slate-900'} relative`}>
                      {formatRupiah(nom)}
                    </p>
                    {active && (
                      <div className={`absolute -top-px -right-px w-5 h-5 ${brandStyle.color} rounded-bl-lg rounded-tr-xl flex items-center justify-center`}>
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Fixed nominal (multiple products per brand with different priceSell) */}
          {brandProducts.length > 0 && !useOpenNominal && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {brandProducts.map(p => {
                const active = selectedProduct?.id === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectProduct(p)}
                    className={`relative p-3 sm:p-3.5 rounded-xl border-2 text-left transition-all active:scale-[0.97] overflow-hidden ${
                      active
                        ? `${brandStyle.border} ${brandStyle.soft} shadow-sm`
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`absolute top-0 right-0 w-8 h-8 ${brandStyle.color} opacity-10 rounded-bl-3xl`} />
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-700 leading-tight line-clamp-2 min-h-[28px] sm:min-h-[32px] relative">
                      {p.name}
                    </p>
                    <p className="mt-2 text-sm sm:text-base font-bold text-brand relative">
                      {formatRupiah(p.priceSell)}
                    </p>
                    {active && (
                      <div className={`absolute -top-px -right-px w-5 h-5 ${brandStyle.color} rounded-bl-lg rounded-tr-xl flex items-center justify-center`}>
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
