import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { promoApi, campaignApi } from '@/services/index'
import { formatRupiah, formatDateShort, getImageUrl } from '@/utils'
import { useToast } from '@/hooks/use-toast'
import {
  Clock, CheckCircle2, X, Tag, Copy, Check, Sparkles, CalendarDays, Wallet, Percent, Search, Megaphone,
} from 'lucide-react'
import SEO from '@/components/SEO'

function checkIsUpcoming(startDate) {
  if (!startDate) return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = new Date(startDate); start.setHours(0, 0, 0, 0)
  return start.getTime() > today.getTime()
}

function PromoDetailModal({ promo, onClose }) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  if (!promo) return null

  const isUpcoming = checkIsUpcoming(promo.startDate)
  const discountLabel = promo.discountType === 'percent'
    ? `${promo.discountValue}%`
    : formatRupiah(promo.discountValue)

  const copy = () => {
    if (!promo.code) return
    navigator.clipboard.writeText(promo.code)
    setCopied(true)
    toast({ title: 'Kode promo disalin.' })
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-slide-up-promo"
        onClick={(e) => e.stopPropagation()}>

        <div className="relative bg-slate-50">
          {promo.image ? (
            <img src={getImageUrl(promo.image)} alt={promo.name}
              className="w-full h-auto block" />
          ) : (
            <div className="w-full aspect-[16/9] bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-white/80" />
            </div>
          )}
          <button onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center hover:bg-white active:scale-90 transition-all shadow-md">
            <X className="w-4 h-4 text-slate-700" />
          </button>
          {isUpcoming ? (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-amber-500 text-white rounded-full text-[10px] sm:text-xs font-bold shadow-md">
              <Clock className="w-3 h-3" /> Segera Hadir
            </span>
          ) : (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-emerald-500 text-white rounded-full text-[10px] sm:text-xs font-bold shadow-md">
              <CheckCircle2 className="w-3 h-3" /> Sedang Berjalan
            </span>
          )}
        </div>

        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{promo.name}</h2>
            <p className="mt-1 sm:mt-1.5 text-[11px] sm:text-xs text-slate-400 uppercase tracking-wide font-semibold">
              {promo.type === 'flash_sale' ? 'Flash Sale' : promo.type === 'loyalty' ? 'Loyalty' : 'Voucher'}
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-4 sm:p-5">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-orange-500">Diskon</p>
            <p className="mt-1 text-3xl sm:text-4xl font-black text-orange-600 break-all">{discountLabel}</p>
            {promo.maxDiscount > 0 && promo.discountType === 'percent' && (
              <p className="mt-1 text-[11px] sm:text-xs text-orange-700/80">Maks. {formatRupiah(promo.maxDiscount)}</p>
            )}
          </div>

          {promo.code && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Kode Promo</p>
              <button onClick={copy}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span className="font-mono font-bold text-blue-700 tracking-wider">{promo.code}</span>
                </div>
                <span className="text-xs text-blue-600 font-semibold inline-flex items-center gap-1.5">
                  {copied ? <><Check className="w-3.5 h-3.5" /> Tersalin</> : <><Copy className="w-3.5 h-3.5" /> Salin</>}
                </span>
              </button>
            </div>
          )}

          <div className="space-y-2.5 text-sm">
            {promo.minPurchase > 0 && (
              <div className="flex items-center gap-3 text-slate-600">
                <Wallet className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Min. transaksi <strong className="text-slate-900">{formatRupiah(promo.minPurchase)}</strong></span>
              </div>
            )}
            {promo.startDate && (
              <div className="flex items-center gap-3 text-slate-600">
                <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Mulai berlaku <strong className="text-slate-900">{formatDateShort(promo.startDate)}</strong></span>
              </div>
            )}
            {promo.endDate && (
              <div className="flex items-center gap-3 text-slate-600">
                <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Berakhir <strong className="text-slate-900">{formatDateShort(promo.endDate)}</strong></span>
              </div>
            )}
            {promo.quota && (
              <div className="flex items-center gap-3 text-slate-600">
                <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Sisa kuota <strong className="text-slate-900">{Math.max(0, promo.quota - (promo.usedCount || 0))}</strong> / {promo.quota}</span>
              </div>
            )}
          </div>

          {promo.description && (
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Detail & Syarat</p>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{promo.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CampaignDetailModal({ campaign, onClose }) {
  if (!campaign) return null
  const discount = Number(campaign.discountPercent || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto scrollbar-hide animate-slide-up-promo"
        onClick={(e) => e.stopPropagation()}>

        <div className="relative bg-slate-50">
          {campaign.image ? (
            <img src={getImageUrl(campaign.image)} alt={campaign.title} className="w-full h-auto block" />
          ) : (
            <div className="w-full aspect-[16/9] bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Megaphone className="w-16 h-16 text-white/80" />
            </div>
          )}
          <button onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center hover:bg-white active:scale-90 transition-all shadow-md">
            <X className="w-4 h-4 text-slate-700" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{campaign.title}</h2>
            <p className="mt-1 sm:mt-1.5 text-[11px] sm:text-xs text-orange-500 uppercase tracking-wide font-semibold">Campaign ArahInn</p>
          </div>

          {discount > 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-4 sm:p-5">
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-orange-500">Diskon</p>
              <p className="mt-1 text-3xl sm:text-4xl font-black text-orange-600">{discount}%</p>
            </div>
          )}

          <div className="space-y-2.5 text-sm">
            {campaign.startDate && (
              <div className="flex items-center gap-3 text-slate-600">
                <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Mulai berlaku <strong className="text-slate-900">{formatDateShort(campaign.startDate)}</strong></span>
              </div>
            )}
            {campaign.endDate && (
              <div className="flex items-center gap-3 text-slate-600">
                <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Berakhir <strong className="text-slate-900">{formatDateShort(campaign.endDate)}</strong></span>
              </div>
            )}
          </div>

          {campaign.description && (
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Detail</p>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{campaign.description}</p>
            </div>
          )}

          {discount > 0 && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700">
              Diskon ini berlaku otomatis untuk akomodasi yang mengikuti campaign ini — tampil sebagai harga coret saat Anda memesan.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PromoPage() {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')  // all | running | upcoming

  const { data: promos = [], isLoading: loadingPromos } = useQuery({
    queryKey: ['promo-active-all'],
    queryFn: () => promoApi.getActive().then(r => r.data?.data || []),
  })
  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['promo-campaigns'],
    queryFn: () => campaignApi.active().then(r => r.data?.data || []),
  })
  const isLoading = loadingPromos || loadingCampaigns

  // Gabungkan promo + campaign jadi satu daftar item
  const items = [
    ...promos.map(p => ({
      kind: 'promo', key: `p${p.id}`, raw: p,
      title: p.name, image: p.image, startDate: p.startDate, endDate: p.endDate,
    })),
    ...campaigns.map(c => ({
      kind: 'campaign', key: `c${c.id}`, raw: c,
      title: c.title, image: c.image, startDate: c.startDate, endDate: c.endDate,
    })),
  ]

  const filtered = items.filter(it => {
    if (filter === 'all') return true
    const upcoming = checkIsUpcoming(it.startDate)
    return filter === 'upcoming' ? upcoming : !upcoming
  })

  const stats = {
    total: items.length,
    upcoming: items.filter(it => checkIsUpcoming(it.startDate)).length,
  }
  const running = stats.total - stats.upcoming

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_30%,#ffffff_100%)]">
      <SEO
        title="Promo & Flash Sale"
        description="Kumpulan promo terbaru ArahInn: diskon hotel, voucher cashback, flash sale, dan penawaran spesial untuk akomodasi pilihan di seluruh Indonesia."
        url="/promo"
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden text-white">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1e3d] via-[#1d4ed8] to-[#f97316]" />

        {/* Glossy overlay light */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.25)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,200,100,0.3)_0%,transparent_55%)]" />

        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-[28rem] h-[28rem] bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-300/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        {/* Diagonal shine line */}
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.08)_50%,transparent_70%)]" />

        {/* Floating ArahInn logo — watermark glossy */}
        <img
          src="/logo-arahin.png"
          alt=""
          aria-hidden="true"
          className="hidden md:block absolute right-[-2rem] top-1/2 -translate-y-1/2 h-[18rem] lg:h-[22rem] w-auto object-contain opacity-15 pointer-events-none select-none drop-shadow-[0_8px_32px_rgba(255,255,255,0.4)]"
        />
        {/* Mobile variant — smaller, top right */}
        <img
          src="/logo-arahin.png"
          alt=""
          aria-hidden="true"
          className="md:hidden absolute right-2 top-4 h-20 w-auto opacity-20 pointer-events-none select-none"
        />

        {/* Sparkle dots scattered */}
        <div className="absolute top-12 left-1/4 w-2 h-2 bg-white rounded-full opacity-60 animate-pulse" />
        <div className="absolute top-32 right-1/3 w-1.5 h-1.5 bg-yellow-200 rounded-full opacity-70" />
        <div className="absolute bottom-24 left-1/3 w-1 h-1 bg-white rounded-full opacity-50" />

        <div className="container py-10 sm:py-14 lg:py-24 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 bg-white/15 backdrop-blur-md rounded-full text-[11px] sm:text-xs font-bold mb-3 sm:mb-5 border border-white/25 shadow-lg shadow-black/10">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="tracking-wide">PROMO ARAHINN</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
              Promo &amp; Campaign dari{' '}
              <span className="bg-gradient-to-r from-amber-200 via-orange-100 to-yellow-200 bg-clip-text text-transparent">
                ArahInn
              </span>
            </h1>
            <p className="mt-2 sm:mt-4 text-white/95 text-sm sm:text-base md:text-lg max-w-lg drop-shadow-[0_1px_4px_rgba(0,0,0,0.2)]">
              Penawaran spesial buat kamu.
            </p>

            {/* Stats */}
            {!isLoading && items.length > 0 && (
              <div className="mt-5 sm:mt-8 grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 sm:gap-3">
                <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center gap-2.5 sm:gap-3 shadow-lg shadow-black/10">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-400/30 backdrop-blur flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-200" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-white/70 font-bold">Sedang Berjalan</p>
                    <p className="font-black text-lg sm:text-2xl leading-tight">{running}</p>
                  </div>
                </div>
                <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center gap-2.5 sm:gap-3 shadow-lg shadow-black/10">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-300/30 backdrop-blur flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-100" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-white/70 font-bold">Segera Hadir</p>
                    <p className="font-black text-lg sm:text-2xl leading-tight">{stats.upcoming}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom curve fade to white */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-b from-transparent to-[#fff7ed] pointer-events-none" />
      </section>

      {/* Filter tabs */}
      <section className="container py-6 sm:py-8">
        <div className="flex items-center justify-center mb-5 sm:mb-8">
          <div className="inline-flex p-1 bg-white border border-slate-200 rounded-2xl shadow-sm w-full sm:w-auto">
            {[
              { val: 'all',      label: 'Semua' },
              { val: 'running',  label: 'Berjalan' },
              { val: 'upcoming', label: 'Segera' },
            ].map(t => (
              <button key={t.val} onClick={() => setFilter(t.val)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
                  filter === t.val
                    ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="skeleton aspect-[16/9] rounded-2xl sm:rounded-3xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 sm:py-24 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3 sm:mb-4">
              <Percent className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">Belum ada promo atau campaign</h3>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500">Pantau halaman ini untuk update penawaran terbaru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map(it => {
              const isUpcoming = checkIsUpcoming(it.startDate)
              const img = getImageUrl(it.image)
              const isCampaign = it.kind === 'campaign'
              return (
                <button
                  key={it.key}
                  onClick={() => setSelected(it)}
                  className="group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-white border border-slate-200 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all text-left"
                >
                  <div className="relative bg-slate-50 overflow-hidden">
                    {img ? (
                      <img
                        src={img}
                        alt={it.title}
                        className="w-full h-auto block group-hover:scale-[1.02] transition-transform duration-500"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    ) : (
                      <div className={`w-full aspect-[16/9] flex flex-col items-center justify-center text-white p-4 text-center ${
                        isCampaign ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-gradient-to-br from-orange-500 to-red-500'
                      }`}>
                        {isCampaign ? <Megaphone className="w-9 h-9 mb-2 text-white/90" /> : <Tag className="w-9 h-9 mb-2 text-white/90" />}
                        <p className="font-bold text-base leading-snug line-clamp-2">{it.title}</p>
                        {isCampaign && Number(it.raw.discountPercent) > 0 && (
                          <p className="mt-1 text-sm font-black">{Number(it.raw.discountPercent)}% OFF</p>
                        )}
                        {!isCampaign && it.raw.code && (
                          <p className="mt-1 font-mono text-sm tracking-wider bg-white/20 px-2 py-0.5 rounded">{it.raw.code}</p>
                        )}
                      </div>
                    )}
                    {/* Tag jenis */}
                    <span className={`absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md ${
                      isCampaign ? 'bg-orange-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {isCampaign ? 'Campaign' : 'Promo'}
                    </span>
                    {isUpcoming ? (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-white rounded-full text-[10px] sm:text-[11px] font-bold shadow-md">
                        <Clock className="w-3 h-3" /> Segera Hadir
                      </span>
                    ) : (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white rounded-full text-[10px] sm:text-[11px] font-bold shadow-md">
                        <CheckCircle2 className="w-3 h-3" /> Sedang Berjalan
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Detail modal */}
      {selected?.kind === 'promo'    && <PromoDetailModal    promo={selected.raw}    onClose={() => setSelected(null)} />}
      {selected?.kind === 'campaign' && <CampaignDetailModal campaign={selected.raw} onClose={() => setSelected(null)} />}

      <style>{`
        @keyframes slide-up-promo {
          from { transform: translateY(100%); opacity: 0.5; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @media (min-width: 640px) {
          @keyframes slide-up-promo {
            from { transform: scale(0.95); opacity: 0; }
            to   { transform: scale(1); opacity: 1; }
          }
        }
        .animate-slide-up-promo { animation: slide-up-promo 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
      `}</style>
    </div>
  )
}
