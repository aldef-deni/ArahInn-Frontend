import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ppobApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import { useAuthStore } from '@/store/authStore'
import {
  Smartphone, Wifi, Zap, Lightbulb, Droplets, HeartPulse, Router, Wallet,
  ChevronLeft, AlertCircle, Loader2, CheckCircle,
} from 'lucide-react'

const ICONS = { Smartphone, Wifi, Zap, Lightbulb, Droplets, HeartPulse, Router, Wallet }

/**
 * Generic category page — handles Pulsa/Data, PLN Token, Tagihan, E-wallet.
 * Route: /ppob/:group  (group = 'pulsa', 'pln', 'tagihan', 'ewallet')
 */
const GROUP_META = {
  'pulsa-data': { title: 'Pulsa & Paket Data', placeholder: 'Nomor HP (08...)', label: 'Nomor HP', filterGroups: ['pulsa'] },
  'pln':        { title: 'Listrik PLN',         placeholder: 'Nomor Meter / ID Pelanggan', label: 'No. Meter / ID Pelanggan', filterGroups: ['pln'] },
  'tagihan':    { title: 'Bayar Tagihan',       placeholder: 'Nomor pelanggan', label: 'Nomor Pelanggan', filterGroups: ['tagihan'] },
  'ewallet':    { title: 'Top Up E-Wallet',     placeholder: 'Nomor HP terdaftar', label: 'Nomor HP E-Wallet', filterGroups: ['ewallet'] },
}

export default function PpobCategoryPage() {
  const { group } = useParams()
  const meta = GROUP_META[group]
  const navigate = useNavigate()
  const { toast } = useToast()
  const { token } = useAuthStore()

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [customerNumber, setCustomerNumber]     = useState('')
  const [selectedProduct, setSelectedProduct]   = useState(null)
  const [inquiry, setInquiry] = useState(null)

  const { data: categories = [] } = useQuery({
    queryKey: ['ppob-categories'],
    queryFn : () => ppobApi.categories().then(r => r.data?.data ?? []),
  })

  const groupCategories = categories.filter(c => meta?.filterGroups.includes(c.group))

  const { data: products = [], isFetching: loadingProducts } = useQuery({
    queryKey: ['ppob-products', selectedCategory?.code],
    queryFn : () => ppobApi.products({ category: selectedCategory.code }).then(r => r.data?.data ?? []),
    enabled : !!selectedCategory,
  })

  const inquiryMutation = useMutation({
    mutationFn: (d) => ppobApi.inquiry(d).then(r => r.data),
    onSuccess: (data) => {
      if (data.success) setInquiry(data)
      else toast({ title: 'Inquiry gagal', description: data.message, variant: 'destructive' })
    },
    onError: (e) => toast({ title: 'Inquiry gagal', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const createMutation = useMutation({
    mutationFn: (d) => ppobApi.createTrx(d),
    onSuccess: (r) => {
      const trxCode = r.data?.data?.transaction?.trx_code
      toast({ title: 'Transaksi dibuat', description: 'Lanjut pembayaran VA.' })
      // TODO: redirect ke payment page setelah fase berikut
      navigate(`/ppob/history`)
    },
    onError: (e) => toast({ title: 'Gagal', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  const handleProceed = () => {
    if (!token) {
      toast({ title: 'Login dulu', description: 'Silakan login untuk lanjut transaksi.', variant: 'destructive' })
      navigate('/login')
      return
    }
    if (!selectedProduct || !customerNumber.trim()) return

    if (selectedCategory.type === 'pascabayar' && !inquiry) {
      inquiryMutation.mutate({ product_id: selectedProduct.id, customer_number: customerNumber })
      return
    }
    createMutation.mutate({ product_id: selectedProduct.id, customer_number: customerNumber })
  }

  if (!meta) {
    return (
      <div className="container py-16 text-center">
        <p className="text-slate-500">Kategori tidak ditemukan.</p>
      </div>
    )
  }

  return (
    <div className="container py-6 max-w-3xl">
      <button onClick={() => navigate('/ppob')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand mb-3">
        <ChevronLeft className="w-4 h-4" /> Kembali ke PPOB
      </button>

      <h1 className="text-2xl font-display font-bold text-slate-900">{meta.title}</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">Pilih kategori, isi nomor, lalu lanjut pembayaran.</p>

      {/* Step 1: Pilih kategori */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">1. Pilih layanan</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {groupCategories.map(cat => {
            const Icon = ICONS[cat.icon] || Wallet
            const active = selectedCategory?.id === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat); setSelectedProduct(null); setInquiry(null) }}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                  active ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: cat.color || '#1d4ed8' }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-semibold text-slate-700">{cat.name}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step 2: Nomor pelanggan */}
      {selectedCategory && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">2. {meta.label}</p>
          <input
            type="tel"
            value={customerNumber}
            onChange={e => { setCustomerNumber(e.target.value.replace(/\D/g, '')); setInquiry(null) }}
            placeholder={meta.placeholder}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
        </div>
      )}

      {/* Step 3: Pilih produk / nominal */}
      {selectedCategory && customerNumber.length >= 4 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
            3. {selectedCategory.type === 'pascabayar' ? 'Cek tagihan' : 'Pilih nominal'}
          </p>
          {loadingProducts && (
            <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Memuat produk...</div>
          )}
          {!loadingProducts && products.length === 0 && (
            <div className="text-center py-6">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Belum ada produk untuk kategori ini.</p>
              <p className="text-xs text-slate-400 mt-1">Akan tersedia setelah sync ke Raja Biller selesai.</p>
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
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      active ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-700">{p.name}</p>
                    <p className="text-sm font-bold text-brand mt-1">{formatRupiah(p.price_sell)}</p>
                  </button>
                )
              })}
            </div>
          )}
          {selectedCategory.type === 'pascabayar' && products[0] && (
            <button
              onClick={() => { setSelectedProduct(products[0]); inquiryMutation.mutate({ product_id: products[0].id, customer_number: customerNumber }) }}
              disabled={inquiryMutation.isPending}
              className="w-full py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50"
            >
              {inquiryMutation.isPending ? 'Mengecek...' : 'Cek Tagihan'}
            </button>
          )}
          {inquiry && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-bold text-emerald-700">Tagihan ditemukan</p>
              </div>
              <p className="text-sm text-slate-700">Nama: <b>{inquiry.customer_name}</b></p>
              <p className="text-sm text-slate-700">Tagihan: <b>{formatRupiah(inquiry.total - (inquiry.admin_fee || 0))}</b></p>
              <p className="text-sm text-slate-700">Biaya admin: <b>{formatRupiah(inquiry.admin_fee || 0)}</b></p>
              <p className="text-base font-bold text-slate-900 mt-2">Total: {formatRupiah(inquiry.total)}</p>
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      {selectedProduct && (selectedCategory.type === 'prabayar' || inquiry) && (
        <button
          onClick={handleProceed}
          disabled={createMutation.isPending}
          className="w-full py-4 bg-brand text-white rounded-2xl font-bold text-base hover:bg-brand-700 disabled:opacity-50 shadow-lg shadow-brand/30"
        >
          {createMutation.isPending ? 'Membuat transaksi...' : 'Lanjut Bayar'}
        </button>
      )}
    </div>
  )
}
