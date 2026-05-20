import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { promoApi } from '@/services/index'
import { formatRupiah, formatDateShort, getImageUrl } from '@/utils'
import { useToast } from '@/hooks/use-toast'
import {
  ChevronLeft, ChevronRight, X, Tag, Copy, Check, Sparkles, CalendarDays, Wallet, Clock, CheckCircle2, ArrowRight,
} from 'lucide-react'

// Helper: cek apakah promo "Segera Hadir" (start di masa depan, abaikan jam)
function checkIsUpcoming(startDate) {
  if (!startDate) return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = new Date(startDate); start.setHours(0, 0, 0, 0)
  return start > today
}

function PromoDetailModal({ promo, onClose }) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const copy = () => {
    if (!promo.code) return
    navigator.clipboard.writeText(promo.code)
    setCopied(true)
    toast({ title: 'Kode promo disalin.' })
    setTimeout(() => setCopied(false), 1800)
  }

  const isUpcoming = checkIsUpcoming(promo.startDate)
  const discountLabel = promo.discountType === 'percent'
    ? `${promo.discountValue}%`
    : formatRupiah(promo.discountValue)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>

        {/* Hero image */}
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
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center hover:bg-white transition-colors shadow-md">
            <X className="w-4 h-4 text-slate-700" />
          </button>
          {isUpcoming && (
            <span className="absolute top-3 left-3 px-3 py-1.5 bg-amber-500 text-white rounded-full text-xs font-bold shadow-md">
              Segera Hadir
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">{promo.name}</h2>
            <p className="mt-1.5 text-xs text-slate-400 uppercase tracking-wide font-semibold">
              {promo.type === 'flash_sale' ? 'Flash Sale' : promo.type === 'loyalty' ? 'Loyalty' : 'Voucher'}
            </p>
          </div>

          {/* Discount big */}
          <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Diskon</p>
            <p className="mt-1 text-4xl font-black text-orange-600">{discountLabel}</p>
            {promo.maxDiscount > 0 && promo.discountType === 'percent' && (
              <p className="mt-1 text-xs text-orange-700/80">Maks. {formatRupiah(promo.maxDiscount)}</p>
            )}
          </div>

          {/* Code */}
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

          {/* Details */}
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
                <span>
                  Mulai berlaku <strong className="text-slate-900">{formatDateShort(promo.startDate)}</strong>
                </span>
              </div>
            )}
            {promo.endDate && (
              <div className="flex items-center gap-3 text-slate-600">
                <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Berakhir <strong className="text-slate-900">{formatDateShort(promo.endDate)}</strong>
                </span>
              </div>
            )}
            {promo.quota && (
              <div className="flex items-center gap-3 text-slate-600">
                <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Sisa kuota <strong className="text-slate-900">{Math.max(0, promo.quota - (promo.usedCount || 0))}</strong> / {promo.quota}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
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

export default function PromoFlyerCarousel() {
  const scrollRef = useRef(null)
  const [selected, setSelected] = useState(null)

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ['promo-flyers'],
    queryFn: () => promoApi.flyers().then(r => r.data?.data || []),
  })

  const scroll = (dir) => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.firstChild?.offsetWidth || 320
    el.scrollBy({ left: dir * (cardWidth + 16), behavior: 'smooth' })
  }

  if (isLoading) return null
  if (!promos.length) return null

  return (
    <section className="container py-12">
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Promo Spesial ArahInn</h2>
          <p className="text-muted-foreground mt-1">Ikuti Promo Menarik dari ArahInn</p>
        </div>
        <div className="flex items-center gap-3">
          {promos.length > 1 && (
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={() => scroll(-1)}
                className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-sm transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button onClick={() => scroll(1)}
                className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-sm transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          )}
          <Link to="/promo"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-700 transition-colors whitespace-nowrap">
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-1 px-1"
        style={{ scrollbarWidth: 'thin' }}>
        {promos.map(promo => {
          const isUpcoming = checkIsUpcoming(promo.startDate)
          return (
            <button
              key={promo.id}
              onClick={() => setSelected(promo)}
              className="group relative shrink-0 w-[280px] sm:w-[320px] md:w-[360px] snap-start rounded-[22px] overflow-hidden bg-white hover:shadow-xl hover:-translate-y-1 transition-all text-left"
            >
              <img
                src={getImageUrl(promo.image)}
                alt={promo.name}
                className="w-full h-auto block group-hover:scale-[1.02] transition-transform duration-500"
              />
              {isUpcoming ? (
                <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-white rounded-full text-[10px] font-bold shadow">
                  <Clock className="w-3 h-3" /> Segera Hadir
                </span>
              ) : (
                <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-bold shadow">
                  <CheckCircle2 className="w-3 h-3" /> Sedang Berjalan
                </span>
              )}
            </button>
          )
        })}
      </div>

      {selected && (
        <PromoDetailModal promo={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  )
}
