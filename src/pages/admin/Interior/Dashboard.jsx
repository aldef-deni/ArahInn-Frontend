import { useQuery } from '@tanstack/react-query'
import { interiorDesignApi } from '@/services/index'
import { CheckCircle2, Clock, XCircle, Loader2, Sofa } from 'lucide-react'

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    green : 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red   : 'bg-red-50 text-red-600',
  }
  return (
    <div className="bg-white rounded-2xl p-5 border shadow-card">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{title}</p>
    </div>
  )
}

export default function DesignInteriorDashboard() {
  const { data: designs = [], isLoading } = useQuery({
    queryKey: ['admin-interior-designs'],
    queryFn : () => interiorDesignApi.adminList().then(r => r.data.data),
    staleTime: 0,
  })

  const approved = designs.filter(d => d.status === 'approved').length
  const pending  = designs.filter(d => d.status === 'pending').length
  const rejected = designs.filter(d => d.status === 'rejected').length

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <Sofa className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard Design Interior</h1>
          <p className="text-sm text-slate-500 mt-0.5">Ringkasan status desain yang Anda kelola.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Desain Disetujui" value={approved} icon={CheckCircle2} color="green" />
        <StatCard title="Desain Menunggu" value={pending}  icon={Clock}        color="yellow" />
        <StatCard title="Desain Ditolak"  value={rejected} icon={XCircle}      color="red" />
      </div>
    </div>
  )
}
