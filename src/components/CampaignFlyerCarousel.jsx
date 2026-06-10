import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { campaignApi } from '@/services/index'
import { formatDateShort, getImageUrl } from '@/utils'
import {
  ChevronLeft, ChevronRight, X, Megaphone, CalendarDays, Clock, CheckCircle2, ArrowRight,
} from 'lucide-react'

// Cek campaign "Segera Hadir" (start di masa depan, abaikan jam)
function checkIsUpcoming(startDate) {
  if (!startDate) return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = new Date(startDate); start.setHours(0, 0, 0, 0)
  return start > today
}

function CampaignDetailModal({ campaign, onClose }) {
  const isUpcoming = checkIsUpcoming(campaign.startDate)
  const discount = Number(campaign.discountPercent || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>

        {/* Hero image */}
        <div className="relative bg-slate-50">
          {campaign.image ? (
            <img src={getImageUrl(campaign.image)} alt={campaign.title} className="w-full h-auto block" />
          ) : (
            <div className="w-full aspect-[16/9] bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Megaphone className="w-16 h-16 text-white/80" />
            </div>
          )}
          <button onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center hover:bg-white transition-colors shadow-md">
            <X className="w-4 h-4 text-slate-700" />
          </button>
          {isUpcoming ? (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-full text-xs font-bold shadow-md">
              <Clock className="w-3 h-3" /> Segera Hadir
            </span>
          ) : (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-bold shadow-md">
              <CheckCircle2 className="w-3 h-3" /> Sedang Berjalan
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">{campaign.title}</h2>
            <p className="mt-1.5 text-xs text-orange-500 uppercase tracking-wide font-semibold">Campaign ArahInn</p>
          </div>

          {discount > 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Diskon</p>
              <p className="mt-1 text-4xl font-black text-orange-600">{discount}%</p>
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
              Diskon ini berlaku otomatis untuk akomodasi yang mengikuti campaign ini — tampil sebagai harga coret saat memesan.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CampaignFlyerCarousel() {
  const scrollRef = useRef(null)
  const [selected, setSelected] = useState(null)

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['home-campaigns'],
    queryFn: () => campaignApi.active().then(r => r.data?.data || []),
  })

  const scroll = (dir) => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.firstChild?.offsetWidth || 320
    el.scrollBy({ left: dir * (cardWidth + 16), behavior: 'smooth' })
  }

  if (isLoading) return null
  if (!campaigns.length) return null

  return (
    <section className="container py-12">
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Campaign ArahInn</h2>
          <p className="text-muted-foreground mt-1">Penawaran spesial dari ArahInn untuk akomodasi pilihan</p>
        </div>
        <div className="flex items-center gap-3">
          {campaigns.length > 1 && (
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
        {campaigns.map(c => {
          const isUpcoming = checkIsUpcoming(c.startDate)
          const img = getImageUrl(c.image)
          const discount = Number(c.discountPercent || 0)
          return (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="group relative shrink-0 w-[280px] sm:w-[320px] md:w-[360px] snap-start rounded-[22px] overflow-hidden bg-white border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all text-left"
            >
              {img ? (
                <img
                  src={img}
                  alt={c.title}
                  className="w-full h-auto block group-hover:scale-[1.02] transition-transform duration-500"
                />
              ) : (
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-orange-500 to-red-500 flex flex-col items-center justify-center text-white p-5 text-center">
                  <Megaphone className="w-10 h-10 mb-3 text-white/90" />
                  <p className="font-bold text-lg leading-snug line-clamp-2">{c.title}</p>
                  {discount > 0 && <p className="mt-2 text-base font-black bg-white/25 px-3 py-1 rounded-lg">{discount}% OFF</p>}
                </div>
              )}
              {discount > 0 && img && (
                <span className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-orange-600 text-white rounded-lg text-xs font-black shadow">
                  {discount}% OFF
                </span>
              )}
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
        <CampaignDetailModal campaign={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  )
}
