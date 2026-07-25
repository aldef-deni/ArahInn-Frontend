import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ppobApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import { pdamRegion, pdamProvinces } from '@/utils/pdamRegion'
import { multifinanceGroup, multifinanceGroupsAvailable } from '@/utils/multifinanceGroup'
import { useAuthStore } from '@/store/authStore'
import {
  Smartphone, Wifi, Zap, Lightbulb, Droplets, HeartPulse, Router, Wallet,
  ChevronLeft, AlertCircle, Loader2, CheckCircle, Tv, CreditCard, Landmark, Car, Receipt,
  AlertTriangle,
} from 'lucide-react'
import PpobPulsaDataView from './PpobPulsaDataView'
import PpobPlnView from './PpobPlnView'
import PpobEwalletView from './PpobEwalletView'
import PpobGameView from './PpobGameView'
import PpobConfirmModal from './PpobConfirmModal'
import RedeemPoints from '@/components/ui/RedeemPoints'

const ICONS = { Smartphone, Wifi, Zap, Lightbulb, Droplets, HeartPulse, Router, Wallet, Tv, CreditCard, Landmark, Car, Receipt }

// Label & format input NOMOR per kategori tagihan (override default "Nomor Pelanggan").
const CAT_INPUT = {
  'kartu-kredit':  { label: 'Nomor Kartu Kredit',        placeholder: '16 digit nomor kartu',        maxLen: 16 },
  'multifinance':  { label: 'Nomor Kontrak',             placeholder: 'Nomor kontrak / pelanggan',   maxLen: 20 },
  'telepon-pasca': { label: 'Nomor Telepon',             placeholder: 'Contoh: 0217xxxxxx',          maxLen: 15 },
  'telkom':        { label: 'Nomor Telepon / IndiHome',  placeholder: 'Nomor telepon / IndiHome',    maxLen: 16 },
  'pajak':         { label: 'Nomor Objek Pajak (NOP)',   placeholder: '18 digit NOP',                maxLen: 18 },
}

// Meta (ikon + warna) tiap jenis Multifinance.
const MF_META = {
  'Pembiayaan Kendaraan':        { Icon: Car,        color: '#2563eb' },
  'Pinjaman Online / Multiguna': { Icon: Smartphone, color: '#7c3aed' },
  'BPR & BPRS':                  { Icon: Landmark,   color: '#0d9488' },
  'Koperasi / KSP':              { Icon: Wallet,     color: '#ea580c' },
  'Bank & Lainnya':              { Icon: CreditCard, color: '#475569' },
}

export default function PpobCategoryPage() {
  const { t } = useTranslation()
  const { group } = useParams()

  // Group meta inside component so labels reactively translate
  const GROUP_META = {
    'pulsa-data': { title: t('topupLanding.pulsaData'),   placeholder: t('topup.phonePlaceholder'),       label: t('topup.phoneNumber'),         filterGroups: ['pulsa-data'] },
    'pln':        { title: t('topupLanding.listrikPln'),  placeholder: t('topup.meterPlaceholder'),      label: t('topup.selectMeter'),         filterGroups: ['pln'] },
    'tagihan':    { title: t('topupLanding.tagihan'),     placeholder: 'Nomor pelanggan',                label: 'Nomor Pelanggan',              filterGroups: ['tagihan'] },
    'ewallet':    { title: t('topupLanding.ewallet'),     placeholder: t('topup.phonePlaceholder'),      label: t('topup.phoneNumber'),         filterGroups: ['ewallet'] },
    'game':       { title: t('topupLanding.game'),        placeholder: 'User ID / ID Game',              label: 'User ID Game',                 filterGroups: ['game'] },
  }
  const meta = GROUP_META[group]
  const navigate = useNavigate()
  const { toast } = useToast()
  const { token } = useAuthStore()

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [pdamProvince, setPdamProvince]         = useState('') // filter wilayah utk PDAM
  const [mfGroup, setMfGroup]                   = useState('') // jenis pembiayaan utk Multifinance
  const [customerNumber, setCustomerNumber]     = useState('')
  const [selectedProduct, setSelectedProduct]   = useState(null)
  const [inquiry, setInquiry] = useState(null)
  const [extraParams, setExtraParams] = useState({}) // utk PLN nominal & sejenisnya
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [redeem, setRedeem] = useState({ discount: 0, usePoints: false, points: 0 })
  const openAfterInquiry = useRef(false) // PLN prabayar: buka modal konfirmasi setelah cek nama

  // Reset inquiry bila nomor/nominal berubah — hindari data cek yang basi.
  useEffect(() => { setInquiry(null) }, [customerNumber, extraParams.nominal])

  const { data: categories = [] } = useQuery({
    queryKey: ['ppob-categories'],
    queryFn : () => ppobApi.categories().then(r => r.data?.data ?? []),
  })

  const groupCategories = categories.filter(c => meta?.filterGroups.includes(c.group || c.code))

  // Status layanan: grup ini dimatikan superadmin (mis. e-wallet saat provider gangguan)?
  const { data: disabledGroups = [] } = useQuery({
    queryKey: ['ppob-groups-status'],
    queryFn : () => ppobApi.groupsStatus().then(r => r.data?.data?.disabled ?? []),
    staleTime: 60_000,
  })
  const isGroupDown = disabledGroups.map(String).includes(String(group))

  // Auto-select category untuk single-category groups
  useEffect(() => {
    if (['pulsa-data', 'pln', 'ewallet', 'game'].includes(group) && !selectedCategory && groupCategories.length === 1) {
      setSelectedCategory(groupCategories[0])
    }
  }, [group, groupCategories, selectedCategory])

  const { data: products = [], isFetching: loadingProducts } = useQuery({
    queryKey: ['ppob-products', selectedCategory?.code],
    queryFn : () => ppobApi.products({ category: selectedCategory.code }).then(r => r.data?.data ?? []),
    enabled : !!selectedCategory,
  })

  // POSTPAID Step 1: inquiry — cek tagihan, simpan trxCode untuk confirm-pay
  const inquiryMutation = useMutation({
    mutationFn: (d) => ppobApi.inquiry(d).then(r => r.data),
    onSuccess: (data) => {
      if (data.success) {
        setInquiry(data.data)
        // PLN prabayar: begitu nama pelanggan didapat, langsung buka modal konfirmasi.
        if (openAfterInquiry.current) { openAfterInquiry.current = false; setConfirmOpen(true) }
      } else {
        openAfterInquiry.current = false
        toast({ title: 'Inquiry gagal', description: data.message, variant: 'destructive' })
      }
    },
    onError: (e) => {
      openAfterInquiry.current = false
      toast({ title: 'Inquiry gagal', description: e?.response?.data?.message, variant: 'destructive' })
    },
  })

  // PREPAID 1-step purchase
  const purchaseMutation = useMutation({
    mutationFn: (d) => ppobApi.purchase(d).then(r => r.data),
    onSuccess: (data) => {
      if (!data.success) {
        setConfirmOpen(false)
        return toast({ title: 'Gagal', description: data.message, variant: 'destructive' })
      }
      const trxCode = data.data?.trxCode
      setConfirmOpen(false)
      toast({ title: 'Transaksi dibuat', description: 'Lanjut ke instruksi pembayaran.' })
      navigate(`/topup-tagihan/pay/${trxCode}`)
    },
    onError: (e) => {
      setConfirmOpen(false)
      const msg = e?.response?.data?.message || 'Transaksi gagal'
      const isDup = /duplikat|duplicate|sedang diproses/i.test(msg)
      toast({
        title: isDup ? 'Transaksi sebelumnya masih diproses' : 'Gagal',
        description: isDup
          ? 'Tunggu 5-15 menit, atau coba nominal/nomor berbeda. Vendor mencegah pembelian duplikat dalam waktu singkat.'
          : msg,
        variant: 'destructive',
      })
    },
  })

  // POSTPAID Step 2: confirm-pay (setelah user lihat tagihan dan setuju)
  const confirmPayMutation = useMutation({
    mutationFn: (vars) => ppobApi.confirmPay(vars.trxCode, { usePoints: vars.usePoints, pointsToRedeem: vars.points || 0 }).then(r => r.data),
    onSuccess: (data) => {
      if (!data.success) {
        setConfirmOpen(false)
        return toast({ title: 'Gagal', description: data.message, variant: 'destructive' })
      }
      const trxCode = data.data?.trxCode
      setConfirmOpen(false)
      toast({ title: 'Konfirmasi diterima', description: 'Lanjut ke instruksi pembayaran.' })
      navigate(`/topup-tagihan/pay/${trxCode}`)
    },
    onError: (e) => {
      setConfirmOpen(false)
      toast({ title: 'Gagal', description: e?.response?.data?.message, variant: 'destructive' })
    },
  })

  // Triggered by CTA — open konfirmasi modal dulu (kecuali postpaid yang sudah lewat inquiry).
  const handleProceed = () => {
    if (!token) {
      toast({ title: 'Login dulu', description: 'Silakan login untuk lanjut transaksi.', variant: 'destructive' })
      navigate('/login')
      return
    }
    if (!selectedProduct || !customerNumber.trim()) return

    if (group === 'pln' && !inquiry && !extraParams.nominal) {
      toast({ title: 'Pilih nominal token PLN dulu', variant: 'destructive' })
      return
    }

    // PLN Prabayar (token): cek pelanggan dulu agar nama tampil di modal konfirmasi.
    if (group === 'pln' && extraParams.nominal && !inquiry) {
      openAfterInquiry.current = true
      triggerInquiry(selectedProduct, customerNumber)
      return
    }

    setConfirmOpen(true)
  }

  // Triggered when user click "Ya, Lanjut Bayar" di confirm modal
  const handleConfirmPurchase = () => {
    // Postpaid path (PLN Pascabayar, PDAM, BPJS, dll) — inquiry → confirm-pay
    if (inquiry) {
      confirmPayMutation.mutate({ trxCode: inquiry.trxCode, usePoints: redeem.usePoints, points: redeem.points || 0 })
      return
    }
    purchaseMutation.mutate({
      product_id: selectedProduct.id,
      customer_number: customerNumber,
      extra: extraParams,
      usePoints: redeem.usePoints,
      pointsToRedeem: redeem.points || 0,
    })
  }

  // Helper trigger inquiry untuk view PLN (dan view postpaid lainnya nanti)
  const triggerInquiry = (product, idpel) => {
    inquiryMutation.mutate({
      product_id: product.id,
      customer_number: idpel,
      extra: extraParams,
    })
  }

  if (!meta) {
    return (
      <div className="container py-16 text-center">
        <p className="text-slate-500">Kategori tidak ditemukan.</p>
      </div>
    )
  }

  const isPulsaData = group === 'pulsa-data'
  const isPln       = group === 'pln'
  const isEwallet   = group === 'ewallet'
  const isGame      = group === 'game'

  return (
    <div className="bg-slate-50 sm:bg-transparent min-h-[60vh] pb-32 sm:pb-28">
      {/* ── Sticky header mobile ─────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 sm:hidden">
        <div className="container py-3 flex items-center gap-2">
          <button
            onClick={() => navigate("/topup-tagihan")}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-90 transition-all"
            aria-label="Kembali"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="font-bold text-slate-900 text-base leading-tight flex-1 truncate">
            {meta.title}
          </h1>
        </div>
      </header>

      <div className={`container py-4 sm:py-6 max-w-3xl ${isGroupDown ? 'pointer-events-none select-none opacity-50 blur-[1px]' : ''}`} aria-hidden={isGroupDown}>
        {/* Desktop back button + title */}
        <div className="hidden sm:block">
          <button onClick={() => navigate("/topup-tagihan")}
            className="flex items-center gap-1 text-xs sm:text-sm text-slate-500 hover:text-brand active:scale-95 mb-2 sm:mb-3 transition-all">
            <ChevronLeft className="w-4 h-4" /> Kembali ke PPOB
          </button>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 leading-tight">{meta.title}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-4 sm:mb-6">
            {isPulsaData
              ? 'Masukkan nomor HP, pilih jenis layanan, lalu lanjut pembayaran.'
              : 'Pilih kategori, pilih opsi pembayaran, isi nomor, lalu lanjut pembayaran.'}
          </p>
        </div>

      {/* ════════ LAYOUT BARU: PULSA & DATA ════════ */}
      {isPulsaData && selectedCategory && (
        <PpobPulsaDataView
          products={products}
          loadingProducts={loadingProducts}
          customerNumber={customerNumber}
          onCustomerChange={(v) => { setCustomerNumber(v); setInquiry(null); setSelectedProduct(null) }}
          selectedProduct={selectedProduct}
          onSelectProduct={setSelectedProduct}
        />
      )}

      {/* ════════ LAYOUT BARU: PLN (Prabayar / Pascabayar / Non Taglist) ════════ */}
      {isPln && selectedCategory && (
        <PpobPlnView
          products={products}
          loadingProducts={loadingProducts}
          customerNumber={customerNumber}
          onCustomerChange={(v) => { setCustomerNumber(v); setInquiry(null) }}
          selectedProduct={selectedProduct}
          onSelectProduct={setSelectedProduct}
          onExtraChange={setExtraParams}
          inquiry={inquiry}
          inquiryPending={inquiryMutation.isPending}
          onInquiry={triggerInquiry}
        />
      )}

      {/* ════════ LAYOUT BARU: E-WALLET (GoPay / OVO / DANA / dst) ════════ */}
      {isEwallet && selectedCategory && (
        <PpobEwalletView
          products={products}
          loadingProducts={loadingProducts}
          customerNumber={customerNumber}
          onCustomerChange={setCustomerNumber}
          selectedProduct={selectedProduct}
          onSelectProduct={setSelectedProduct}
          onExtraChange={setExtraParams}
        />
      )}

      {/* ════════ LAYOUT BARU: GAME ONLINE (pilih game → User ID/Server → nominal) ════════ */}
      {isGame && selectedCategory && (
        <PpobGameView
          products={products}
          loadingProducts={loadingProducts}
          customerNumber={customerNumber}
          onCustomerChange={(v) => { setCustomerNumber(v); setInquiry(null) }}
          selectedProduct={selectedProduct}
          onSelectProduct={setSelectedProduct}
          onExtraChange={setExtraParams}
        />
      )}

      {/* ════════ LAYOUT: Tagihan (kategori → opsi/produk → nomor → cek/bayar) ════════ */}
      {!isPulsaData && !isPln && !isEwallet && !isGame && (
        <>
          {/* Step 1: Pilih layanan (kategori) */}
          <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-3 sm:mb-4">
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 sm:mb-3">1. Pilih layanan</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {groupCategories.map(cat => {
                const Icon = ICONS[cat.icon] || Wallet
                const active = selectedCategory?.id === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat); setSelectedProduct(null); setCustomerNumber(''); setInquiry(null); setExtraParams({}); setPdamProvince(''); setMfGroup('') }}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all active:scale-95 ${
                      active ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: cat.color || '#1d4ed8' }}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-700 text-center leading-tight">{cat.name}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Pilih opsi/produk — LANGSUNG muncul saat kategori diklik.
              PDAM: dropdown WILAYAH dulu. Multifinance: 5 kartu JENIS dulu. */}
          {selectedCategory && (() => {
            const code = String(selectedCategory.code).toLowerCase()
            const isRegion = code === 'pdam' || code === 'pajak' // dikelompokkan per WILAYAH (provinsi)
            const isMf = code === 'multifinance'
            const provinces = isRegion ? pdamProvinces(products) : []
            const mfGroups = isMf ? multifinanceGroupsAvailable(products) : []
            const shownProducts = isRegion
              ? (pdamProvince ? products.filter(p => pdamRegion(p.name) === pdamProvince) : [])
              : isMf
                ? (mfGroup ? products.filter(p => multifinanceGroup(p.name) === mfGroup) : [])
                : products
            const showList = !loadingProducts && products.length > 0 && (isRegion ? !!pdamProvince : isMf ? !!mfGroup : true)
            return (
              <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-3 sm:mb-4">
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 sm:mb-3">
                  2. {isRegion ? 'Pilih wilayah' : isMf ? 'Pilih jenis pembiayaan' : `Pilih ${selectedCategory.name}`}
                </p>

                {loadingProducts && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Memuat opsi...</div>
                )}
                {!loadingProducts && products.length === 0 && (
                  <div className="text-center py-6">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-slate-500">Belum ada opsi untuk kategori ini.</p>
                  </div>
                )}

                {/* Dropdown wilayah (PDAM & Pajak PBB) */}
                {isRegion && !loadingProducts && products.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-[11px] sm:text-xs font-semibold text-slate-500 mb-1.5">Wilayah (Provinsi)</label>
                    <select
                      value={pdamProvince}
                      onChange={e => { setPdamProvince(e.target.value); setSelectedProduct(null); setInquiry(null) }}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    >
                      <option value="">— Pilih provinsi —</option>
                      {provinces.map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Kartu jenis pembiayaan (Multifinance) */}
                {isMf && !loadingProducts && products.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                    {mfGroups.map(key => {
                      const meta = MF_META[key] || {}
                      const MfIcon = meta.Icon || Wallet
                      const count = products.filter(p => multifinanceGroup(p.name) === key).length
                      const active = mfGroup === key
                      return (
                        <button
                          key={key}
                          onClick={() => { setMfGroup(key); setSelectedProduct(null); setInquiry(null) }}
                          className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all active:scale-95 ${
                            active ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: meta.color || '#1d4ed8' }}>
                            <MfIcon className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-[11px] sm:text-xs font-semibold text-slate-700 text-center leading-tight">{key}</p>
                          <span className="text-[10px] text-slate-400">{count} penyedia</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Daftar produk (langsung; PDAM setelah provinsi; Multifinance setelah jenis) */}
                {showList && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {shownProducts.map(p => {
                      const active = selectedProduct?.id === p.id
                      return (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedProduct(p); setInquiry(null) }}
                          className={`p-3 rounded-xl border-2 text-left transition-all active:scale-95 ${
                            active ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <p className="text-[11px] sm:text-xs font-semibold text-slate-700 leading-snug line-clamp-2">{p.name}</p>
                          {selectedCategory.type === 'prabayar' && (
                            <p className="text-sm font-bold text-brand mt-1">{formatRupiah(p.priceSell)}</p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Step 3: Nomor pelanggan — setelah opsi dipilih (label & format per kategori) */}
          {selectedProduct && (() => {
            const ci = CAT_INPUT[String(selectedCategory.code).toLowerCase()] || { label: meta.label, placeholder: meta.placeholder, maxLen: 20 }
            return (
            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-3 sm:mb-4">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 sm:mb-3">3. {ci.label}</p>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={ci.maxLen}
                value={customerNumber}
                onChange={e => { setCustomerNumber(e.target.value.replace(/\D/g, '')); setInquiry(null) }}
                placeholder={ci.placeholder}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />

              {/* Pascabayar: tombol Cek Tagihan (pakai produk yang dipilih) */}
              {selectedCategory.type === 'pascabayar' && customerNumber.length >= 4 && !inquiry && (
                <button
                  onClick={() => inquiryMutation.mutate({ product_id: selectedProduct.id, customer_number: customerNumber })}
                  disabled={inquiryMutation.isPending}
                  className="w-full mt-3 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50 transition-all"
                >
                  {inquiryMutation.isPending ? 'Mengecek...' : 'Cek Tagihan'}
                </button>
              )}

              {inquiry && (
                <div className="mt-4 p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs sm:text-sm font-bold text-emerald-700">Tagihan ditemukan</p>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700">Nama: <b>{inquiry.customer?.name || '-'}</b></p>
                  <p className="text-xs sm:text-sm text-slate-700">Tagihan: <b>{formatRupiah(inquiry.pricing?.tagihan || 0)}</b></p>
                  <p className="text-xs sm:text-sm text-slate-700">Biaya admin: <b>{formatRupiah(inquiry.pricing?.adminFee || 0)}</b></p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 mt-2">Total: {formatRupiah(inquiry.pricing?.totalAmount || 0)}</p>
                </div>
              )}
            </div>
            )
          })()}
        </>
      )}

      {/* CTA — sticky bottom on mobile */}
      {selectedProduct && customerNumber.trim().length >= 3 && (selectedCategory?.type !== 'pascabayar' || inquiry) && (() => {
        const submitting = purchaseMutation.isPending || confirmPayMutation.isPending
        const checking   = inquiryMutation.isPending
        const hasNominal = !!extraParams.nominal
        // Variable nominal (PLN Prabayar & E-Wallet open denom): nominal di extra
        // Pulsa fixed nominal: priceSell langsung
        // Postpaid: total dari inquiry
        const totalAmount = inquiry?.pricing?.totalAmount
          ?? (hasNominal ? Number(extraParams.nominal) : selectedProduct?.priceSell)
        // PLN/E-Wallet: kalau belum inquiry & belum pilih nominal → disable
        const needsNominal = (isPln || isEwallet) && !inquiry && !hasNominal
        const ctaDisabled = submitting || checking || needsNominal || !totalAmount
        return (
          // Sticky CTA bottom — visible di mobile + desktop tanpa perlu scroll.
          <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:pb-4">
            <div className="container max-w-3xl px-4">
              <button
                onClick={handleProceed}
                disabled={ctaDisabled}
                className="w-full py-3.5 sm:py-4 bg-brand text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-brand/30 transition-all"
              >
                {checking ? 'Mengecek pelanggan...' : submitting ? 'Membuat transaksi...' : `Lanjut Bayar · ${formatRupiah(totalAmount)}`}
              </button>
            </div>
          </div>
        )
      })()}
      </div>

      {/* Konfirmasi modal sebelum buat transaksi real */}
      <PpobConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmPurchase}
        isLoading={purchaseMutation.isPending || confirmPayMutation.isPending}
        product={selectedProduct}
        customerNumber={customerNumber}
        customerName={inquiry?.customer?.name}
        customerLabel={CAT_INPUT[String(selectedCategory?.code).toLowerCase()]?.label || meta?.label || 'Nomor Tujuan'}
        operatorLabel={selectedProduct?.operator || meta?.title}
        totalAmount={inquiry?.pricing?.totalAmount ?? (extraParams.nominal ? Number(extraParams.nominal) : selectedProduct?.priceSell)}
        discount={redeem.discount}
        redeemSlot={
          <RedeemPoints
            total={inquiry?.pricing?.totalAmount ?? (extraParams.nominal ? Number(extraParams.nominal) : selectedProduct?.priceSell)}
            onChange={setRedeem}
          />
        }
        note={
          isPln
            ? 'Pastikan nomor meter & nominal sudah benar. Token akan terbit untuk meter ini.'
            : isEwallet
              ? 'Saldo akan masuk ke nomor e-wallet ini. Tidak bisa dialihkan setelah konfirmasi.'
              : isGame
                ? 'Item akan dikirim ke akun game ini. Pastikan User ID (dan Server/Zone) sudah benar — tidak bisa dibatalkan.'
                : 'Pulsa/paket akan dikirim ke nomor ini. Tidak bisa dialihkan setelah konfirmasi.'
        }
      />

      {/* ── Overlay gangguan layanan (grup dimatikan superadmin) ── */}
      {isGroupDown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Aksen atas */}
            <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />
            <div className="p-6 sm:p-7 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4 ring-8 ring-amber-50/60">
                <AlertTriangle className="w-8 h-8 text-amber-500" strokeWidth={2.25} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1.5">Layanan Sedang Gangguan</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Layanan sedang dalam gangguan, cobalah beberapa saat lagi.
              </p>
              <button
                onClick={() => navigate('/topup-tagihan')}
                className="mt-6 w-full py-3 rounded-xl bg-brand text-white font-semibold text-sm hover:brightness-95 active:scale-[0.98] transition-all"
              >
                Kembali ke PPOB
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
