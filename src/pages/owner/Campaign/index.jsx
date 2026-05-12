import { useQuery } from '@tanstack/react-query'
import { formatDateShort } from '@/utils'
import {
  Megaphone, Calendar, Users, Eye, MousePointerClick,
  ShieldCheck, Mail, BellRing, Image as ImageIcon, Layout,
} from 'lucide-react'
import { campaignApi } from '@/services/index'

const TYPE_META = {
  banner : { label: 'Banner',     icon: ImageIcon, cls: 'bg-blue-100 text-blue-700',    grad: 'from-blue-500 to-blue-600'    },
  email  : { label: 'Email',      icon: Mail,      cls: 'bg-purple-100 text-purple-700', grad: 'from-purple-500 to-violet-600' },
  push   : { label: 'Push Notif', icon: BellRing,  cls: 'bg-orange-100 text-orange-700', grad: 'from-orange-500 to-red-500'   },
  popup  : { label: 'Pop-up',     icon: Layout,    cls: 'bg-pink-100 text-pink-700',    grad: 'from-pink-500 to-rose-500'    },
}

const TARGET_META = {
  all      : 'Semua Pengguna',
  new_user : 'Pengguna Baru',
  loyal    : 'Pelanggan Setia',
  inactive : 'Tidak Aktif',
}

function CampaignCard({ campaign }) {
  const type = TYPE_META[campaign.type] || TYPE_META.banner
  const Icon = type.icon
  const ctr  = campaign.views > 0
    ? ((campaign.clicks / campaign.views) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className={`bg-gradient-to-r ${type.grad} px-5 py-4 flex items-center gap-3`}>
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-snug truncate">{campaign.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-white/75">{type.label}</span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="text-xs text-white/75">{TARGET_META[campaign.target] || campaign.target}</span>
          </div>
        </div>
        <span className="px-2 py-0.5 bg-emerald-400/30 text-white text-[10px] font-bold rounded-full shrink-0">
          Aktif
        </span>
      </div>

      <div className="p-5">
        {campaign.description && (
          <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
            {campaign.description}
          </p>
        )}

        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{campaign.startDate ? formatDateShort(campaign.startDate) : '—'}</span>
          <span className="text-slate-300">–</span>
          <span>{campaign.endDate ? formatDateShort(campaign.endDate) : '—'}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <p className="text-sm font-bold text-slate-900">{(campaign.views || 0).toLocaleString('id')}</p>
            <p className="text-[10px] text-slate-400">Views</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <MousePointerClick className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <p className="text-sm font-bold text-slate-900">{(campaign.clicks || 0).toLocaleString('id')}</p>
            <p className="text-[10px] text-slate-400">Klik</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-sm font-bold text-slate-900">{ctr}%</p>
            <p className="text-[10px] text-slate-400">CTR</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OwnerCampaign() {
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['owner-campaigns'],
    queryFn : () => campaignApi.myList().then(r => r.data?.data || []),
  })

  const totalViews  = campaigns.reduce((s, c) => s + (c.views  || 0), 0)
  const totalClicks = campaigns.reduce((s, c) => s + (c.clicks || 0), 0)

  return (
    <div className="space-y-6">

      {/* Info banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-indigo-800">Campaign dari Platform Arahinn</p>
          <p className="text-xs text-indigo-600 mt-0.5">
            Campaign berikut dibuat oleh tim Arahinn. Properti Anda berpeluang mendapat eksposur lebih saat campaign aktif.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Campaign Aktif', value: campaigns.length,                  cls: 'text-indigo-600', bg: 'bg-indigo-50', icon: Megaphone        },
          { label: 'Total Views',    value: totalViews.toLocaleString('id'),    cls: 'text-blue-600',   bg: 'bg-blue-50',   icon: Eye              },
          { label: 'Total Klik',     value: totalClicks.toLocaleString('id'),   cls: 'text-orange-600', bg: 'bg-orange-50', icon: MousePointerClick },
        ].map(({ label, value, cls, bg, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${cls}`} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
              <p className={`text-xl font-black ${cls}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Campaign grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
          <Megaphone className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">Belum ada campaign aktif saat ini.</p>
          <p className="text-xs text-slate-400 mt-1">Campaign baru akan muncul di sini saat dibuat oleh tim Arahinn.</p>
        </div>
      )}
    </div>
  )
}
