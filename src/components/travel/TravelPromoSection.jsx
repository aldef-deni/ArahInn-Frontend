import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plane, Ship, Ticket, TrainFront, ArrowRight, Clock } from 'lucide-react'
import { promoApi } from '@/services/index'
import { getImageUrl } from '@/utils'
import { PromoDetailModal, checkIsUpcoming } from '@/components/PromoFlyerCarousel'

// Tema & label per moda (kelas Tailwind ditulis literal agar ke-scan JIT)
const CONFIG = {
  pesawat: {
    Icon: Plane, grad: 'from-sky-500 to-blue-600', glow: 'shadow-sky-200/60',
    chipBg: 'bg-sky-50', chipText: 'text-sky-700', badge: 'text-sky-600', link: 'text-sky-600 hover:text-sky-700',
    emptyBg: 'bg-sky-50', emptyIcon: 'text-sky-300',
    tTitle: 'travel.flightPromoTitle', tSub: 'travel.flightPromoSubtitle', tBadge: 'travel.flightBadge', tEmpty: 'travel.flightEmptyPrompt',
  },
  pelni: {
    Icon: Ship, grad: 'from-cyan-500 to-blue-600', glow: 'shadow-cyan-200/60',
    chipBg: 'bg-cyan-50', chipText: 'text-cyan-700', badge: 'text-cyan-600', link: 'text-cyan-600 hover:text-cyan-700',
    emptyBg: 'bg-cyan-50', emptyIcon: 'text-cyan-300',
    tTitle: 'travel.pelniPromoTitle', tSub: 'travel.pelniPromoSubtitle', tBadge: 'travel.pelniBadge', tEmpty: 'travel.pelniEmptyPrompt',
  },
  kereta: {
    Icon: TrainFront, grad: 'from-orange-500 to-red-600', glow: 'shadow-orange-200/60',
    chipBg: 'bg-orange-50', chipText: 'text-orange-700', badge: 'text-orange-600', link: 'text-orange-600 hover:text-orange-700',
    emptyBg: 'bg-orange-50', emptyIcon: 'text-orange-300',
    tTitle: 'travel.trainPromoTitle', tSub: 'travel.trainPromoSubtitle', tBadge: 'travel.trainBadge', tEmpty: 'travel.trainEmptyPrompt',
  },
}

/**
 * Section promo untuk halaman moda travel (pesawat / pelni).
 * Menampilkan promo superadmin (flyer) yang berlaku untuk produk `product`:
 * productTypes kosong (berlaku semua) ATAU memuat `product`.
 */
export default function TravelPromoSection({ product = 'pesawat' }) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(null)
  const cfg = CONFIG[product] || CONFIG.pesawat
  const { Icon } = cfg

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ['promo-flyers'],
    queryFn: () => promoApi.flyers().then(r => r.data?.data || []),
  })

  // Hanya promo yang produknya EKSPLISIT mencakup moda ini (mis. 'pesawat').
  // Promo tanpa product_types (umum) TIDAK ditampilkan di halaman moda.
  const list = promos.filter(p => {
    const raw = p.productTypes ?? p.product_types
    const types = Array.isArray(raw) ? raw.filter(Boolean) : []
    return types.includes(product)
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(3).fill(0).map((_, i) => <div key={i} className="aspect-[3/2] rounded-2xl bg-slate-100 animate-pulse" />)}
      </div>
    )
  }

  if (!list.length) {
    return (
      <div className="text-center py-14">
        <div className={`w-16 h-16 rounded-2xl ${cfg.emptyBg} flex items-center justify-center mx-auto mb-3`}><Icon className={`w-8 h-8 ${cfg.emptyIcon}`} /></div>
        <p className="text-sm text-slate-400">{t(cfg.tEmpty)}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${cfg.grad} flex items-center justify-center shadow-md ${cfg.glow}`}>
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 leading-tight">{t(cfg.tTitle)}</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{t(cfg.tSub)}</p>
          </div>
        </div>
        <Link to="/promo" className={`hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold ${cfg.link} whitespace-nowrap`}>
          {t('travel.seeAllPromos')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(promo => {
          const isUpcoming = checkIsUpcoming(promo.startDate)
          return (
            <button key={promo.id} onClick={() => setSelected(promo)}
              className="group relative rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left">
              <div className="relative overflow-hidden">
                <img src={getImageUrl(promo.image)} alt={promo.name}
                  className="w-full aspect-[3/2] object-cover block group-hover:scale-[1.04] transition-transform duration-500" />
                <span className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur ${cfg.badge} rounded-full text-[10px] font-bold shadow-sm`}>
                  <Icon className="w-3 h-3" /> {t(cfg.tBadge)}
                </span>
                {isUpcoming && (
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-white rounded-full text-[10px] font-bold shadow">
                    <Clock className="w-3 h-3" /> {t('travel.comingSoon')}
                  </span>
                )}
              </div>
              {(promo.name || promo.code) && (
                <div className="p-3.5">
                  {promo.name && <p className="font-bold text-sm text-slate-900 truncate">{promo.name}</p>}
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    {promo.code
                      ? <span className={`font-mono text-[11px] font-bold ${cfg.chipText} ${cfg.chipBg} px-2 py-0.5 rounded-md tracking-wide`}>{promo.code}</span>
                      : <span className="text-[11px] text-slate-400">{t('travel.tapForDetail')}</span>}
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${cfg.badge} group-hover:gap-1.5 transition-all`}>{t('travel.detailLabel')} <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <Link to="/promo" className={`sm:hidden mt-4 inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-slate-200 text-sm font-semibold ${cfg.badge}`}>
        {t('travel.seeAllPromos')} <ArrowRight className="w-4 h-4" />
      </Link>

      {selected && <PromoDetailModal promo={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
