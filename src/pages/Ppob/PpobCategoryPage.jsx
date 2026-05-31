import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ppobApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import { useAuthStore } from '@/store/authStore'
import {
  Smartphone, Wifi, Zap, Lightbulb, Droplets, HeartPulse, Router, Wallet,
  ChevronLeft, AlertCircle, Loader2, CheckCircle,
} from 'lucide-react'
import PpobPulsaDataView from './PpobPulsaDataView'
import PpobPlnView from './PpobPlnView'
import PpobEwalletView from './PpobEwalletView'
import PpobConfirmModal from './PpobConfirmModal'

const ICONS = { Smartphone, Wifi, Zap, Lightbulb, Droplets, HeartPulse, Router, Wallet }

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
  const [customerNumber, setCustomerNumber]     = useState('')
  const [selectedProduct, setSelectedProduct]   = useState(null)
  const [inquiry, setInquiry] = useState(null)
  const [extraParams, setExtraParams] = useState({}) // utk PLN nominal & sejenisnya
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: ['ppob-categories'],
    queryFn : () => ppobApi.categories().then(r => r.data?.data ?? []),
  })

  const groupCategories = categories.filter(c => meta?.filterGroups.includes(c.group || c.code))

  // Auto-select category untuk single-category groups
  useEffect(() => {
    if (['pulsa-data', 'pln', 'ewallet'].includes(group) && !selectedCategory && groupCategories.length === 1) {
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
      if (data.success) setInquiry(data.data)
      else toast({ title: 'Inquiry gagal', description: data.message, variant: 'destructive' })
    },
    onError: (e) => toast({ title: 'Inquiry gagal', description: e?.response?.data?.message, variant: 'destructive' }),
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
    mutationFn: (trxCode) => ppobApi.confirmPay(trxCode).then(r => r.data),
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

    setConfirmOpen(true)
  }

  // Triggered when user click "Ya, Lanjut Bayar" di confirm modal
  const handleConfirmPurchase = () => {
    // Postpaid path (PLN Pascabayar, PDAM, BPJS, dll) — inquiry → confirm-pay
    if (inquiry) {
      confirmPayMutation.mutate(inquiry.trxCode)
      return
    }
    purchaseMutation.mutate({
      product_id: selectedProduct.id,
      customer_number: customerNumber,
      extra: extraParams,
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

      <div className="container py-4 sm:py-6 max-w-3xl">
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
              : 'Pilih kategori, isi nomor, lalu lanjut pembayaran.'}
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

      {/* ════════ LAYOUT LAMA: Tagihan / Game ════════ */}
      {!isPulsaData && !isPln && !isEwallet && (
        <>
          {/* Step 1: Pilih kategori */}
          <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-3 sm:mb-4">
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 sm:mb-3">1. Pilih layanan</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {groupCategories.map(cat => {
                const Icon = ICONS[cat.icon] || Wallet
                const active = selectedCategory?.id === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat); setSelectedProduct(null); setInquiry(null) }}
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

          {/* Step 2: Nomor pelanggan */}
          {selectedCategory && (
            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-3 sm:mb-4">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 sm:mb-3">2. {meta.label}</p>
              <input
                type="tel"
                inputMode="numeric"
                value={customerNumber}
                onChange={e => { setCustomerNumber(e.target.value.replace(/\D/g, '')); setInquiry(null) }}
                placeholder={meta.placeholder}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
          )}

          {/* Step 3: Pilih produk / nominal */}
          {selectedCategory && customerNumber.length >= 4 && (
            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-3 sm:mb-4">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 sm:mb-3">
                3. {selectedCategory.type === 'pascabayar' ? 'Cek tagihan' : 'Pilih nominal'}
              </p>
              {loadingProducts && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Memuat produk...</div>
              )}
              {!loadingProducts && products.length === 0 && (
                <div className="text-center py-6">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-slate-500">Belum ada produk untuk kategori ini.</p>
                </div>
              )}
              {selectedCategory.type === 'prabayar' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {products.map(p => {
                    const active = selectedProduct?.id === p.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className={`p-3 rounded-xl border-2 text-left transition-all active:scale-95 ${
                          active ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p className="text-[11px] sm:text-xs font-semibold text-slate-700 leading-snug line-clamp-2">{p.name}</p>
                        <p className="text-sm font-bold text-brand mt-1">{formatRupiah(p.priceSell)}</p>
                      </button>
                    )
                  })}
                </div>
              )}
              {selectedCategory.type === 'pascabayar' && products[0] && (
                <button
                  onClick={() => { setSelectedProduct(products[0]); inquiryMutation.mutate({ product_id: products[0].id, customer_number: customerNumber }) }}
                  disabled={inquiryMutation.isPending}
                  className="w-full py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50 transition-all"
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
          )}
        </>
      )}

      {/* CTA — sticky bottom on mobile */}
      {selectedProduct && (selectedCategory?.type !== 'pascabayar' || inquiry) && (() => {
        const submitting = purchaseMutation.isPending || confirmPayMutation.isPending
        const hasNominal = !!extraParams.nominal
        // Variable nominal (PLN Prabayar & E-Wallet open denom): nominal di extra
        // Pulsa fixed nominal: priceSell langsung
        // Postpaid: total dari inquiry
        const totalAmount = inquiry?.pricing?.totalAmount
          ?? (hasNominal ? Number(extraParams.nominal) : selectedProduct?.priceSell)
        // PLN/E-Wallet: kalau belum inquiry & belum pilih nominal → disable
        const needsNominal = (isPln || isEwallet) && !inquiry && !hasNominal
        const ctaDisabled = submitting || needsNominal || !totalAmount
        return (
          // Sticky CTA bottom — visible di mobile + desktop tanpa perlu scroll.
          <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:pb-4">
            <div className="container max-w-3xl px-4">
              <button
                onClick={handleProceed}
                disabled={ctaDisabled}
                className="w-full py-3.5 sm:py-4 bg-brand text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-brand/30 transition-all"
              >
                {submitting ? 'Membuat transaksi...' : `Lanjut Bayar · ${formatRupiah(totalAmount)}`}
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
        customerLabel={meta?.label || 'Nomor Tujuan'}
        operatorLabel={selectedProduct?.operator || meta?.title}
        totalAmount={inquiry?.pricing?.totalAmount ?? (extraParams.nominal ? Number(extraParams.nominal) : selectedProduct?.priceSell)}
        note={
          isPln
            ? 'Pastikan nomor meter & nominal sudah benar. Token akan terbit untuk meter ini.'
            : isEwallet
              ? 'Saldo akan masuk ke nomor e-wallet ini. Tidak bisa dialihkan setelah konfirmasi.'
              : 'Pulsa/paket akan dikirim ke nomor ini. Tidak bisa dialihkan setelah konfirmasi.'
        }
      />
    </div>
  )
}
