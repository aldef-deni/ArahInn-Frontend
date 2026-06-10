import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { campaignApi } from '@/services/index'
import { getImageUrl } from '@/utils'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import CampaignDetailModal from './CampaignDetailModal'

// "banner,popup" → ['banner','popup']
const parseTypes = (t) => String(t || 'banner').split(',').map(s => s.trim()).filter(Boolean)

// Banner landscape campaign (memanjang di bawah banner utama, ala Traveloka)
// + pop-up otomatis untuk campaign tipe "popup". Klik → modal detail.
export default function CampaignBanner() {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [popupOpen, setPopupOpen] = useState(false)

  const { data: campaigns = [] } = useQuery({
    queryKey: ['home-campaign-banners'],
    queryFn: () => campaignApi.active().then(r => r.data?.data || []),
  })

  // Banner landscape (punya banner).
  const banners = campaigns.filter(c => getImageUrl(c.banner))
  // Pop-up: tipe "popup" yang punya image flyer.
  const popupCampaign = campaigns.find(c => parseTypes(c.type).includes('popup') && getImageUrl(c.image))

  // Auto-buka pop-up tiap halaman dimuat (reload).
  useEffect(() => {
    if (popupCampaign) setPopupOpen(true)
  }, [popupCampaign?.id])

  const hasBanners = banners.length > 0
  if (!hasBanners && !popupOpen && !selected) return null

  const safeIdx = idx % (banners.length || 1)
  const current = banners[safeIdx]
  const prev = () => setIdx(i => (i - 1 + banners.length) % banners.length)
  const next = () => setIdx(i => (i + 1) % banners.length)

  return (
    <>
      {hasBanners && (
        <section className="container pt-5 sm:pt-7">
          <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <button onClick={() => setSelected(current)} className="block w-full bg-slate-50 active:scale-[0.995] transition-transform">
              <img src={getImageUrl(current.banner)} alt={current.title}
                className="w-full h-[140px] sm:h-[200px] lg:h-[280px] object-contain block mx-auto" />
            </button>

            {banners.length > 1 && (
              <>
                <button onClick={prev}
                  className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white shadow-md flex items-center justify-center transition-colors">
                  <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>
                <button onClick={next}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white shadow-md flex items-center justify-center transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-700" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {banners.map((_, i) => (
                    <button key={i} onClick={() => setIdx(i)}
                      className={`h-2 rounded-full transition-all ${i === safeIdx ? 'w-5 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'}`}
                      aria-label={`Banner ${i + 1}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Pop-up otomatis (image only) — campaign tipe popup, muncul saat load */}
      {popupOpen && popupCampaign && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setPopupOpen(false)}>
          <div className="relative w-full max-w-md animate-slide-up-popup" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPopupOpen(false)}
              className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all">
              <X className="w-4 h-4 text-slate-700" />
            </button>
            <button onClick={() => { setSelected(popupCampaign); setPopupOpen(false) }}
              className="block w-full rounded-2xl overflow-hidden shadow-2xl active:scale-[0.99] transition-transform">
              <img src={getImageUrl(popupCampaign.image)} alt={popupCampaign.title} className="w-full h-auto block" />
            </button>
            <p className="text-center text-white/85 text-xs mt-3 font-medium">Ketuk gambar untuk lihat detail</p>
          </div>
          <style>{`
            @keyframes slide-up-popup { from { transform: scale(0.92); opacity: 0 } to { transform: scale(1); opacity: 1 } }
            .animate-slide-up-popup { animation: slide-up-popup 0.28s cubic-bezier(0.32,0.72,0,1) }
          `}</style>
        </div>
      )}

      {selected && <CampaignDetailModal campaign={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
