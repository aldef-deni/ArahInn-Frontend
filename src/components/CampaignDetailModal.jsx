import { X, Megaphone, CalendarDays } from 'lucide-react'
import { formatDateShort, getImageUrl } from '@/utils'

// Modal detail campaign (dipakai di carousel home, banner landscape, & halaman /promo).
export default function CampaignDetailModal({ campaign, onClose }) {
  if (!campaign) return null
  const discount = Number(campaign.discountPercent || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
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
