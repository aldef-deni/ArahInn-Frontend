import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { campaignApi } from '@/services/index'
import { getImageUrl } from '@/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CampaignDetailModal from './CampaignDetailModal'

// Banner landscape campaign — tampil memanjang di bawah banner utama (ala Traveloka).
// Klik → buka modal detail campaign (komponen yang sama dengan carousel).
export default function CampaignBanner() {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)

  const { data: campaigns = [] } = useQuery({
    queryKey: ['home-campaign-banners'],
    queryFn: () => campaignApi.active().then(r => r.data?.data || []),
  })

  // Hanya campaign yang punya banner landscape.
  const banners = campaigns.filter(c => getImageUrl(c.banner))
  if (!banners.length) return null

  const safeIdx = idx % banners.length
  const current = banners[safeIdx]
  const prev = () => setIdx(i => (i - 1 + banners.length) % banners.length)
  const next = () => setIdx(i => (i + 1) % banners.length)

  return (
    <section className="container pt-5 sm:pt-7">
      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-100">
        <button onClick={() => setSelected(current)} className="block w-full active:scale-[0.995] transition-transform">
          <img src={getImageUrl(current.banner)} alt={current.title}
            className="w-full h-auto block" />
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

      {selected && <CampaignDetailModal campaign={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}
