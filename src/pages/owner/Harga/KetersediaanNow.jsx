import { useOutletContext } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { BedDouble, Activity } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'

export default function KetersediaanNow() {
  const { hotel } = useOutletContext()
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['owner-rooms', hotel?.id],
    queryFn: () => hotelApi.getRooms(hotel.id).then(r => r.data?.data || r.data),
    enabled: !!hotel?.id,
  })

  const toggleMutation = useMutation({
    mutationFn: (roomId) => hotelApi.toggleRoomNow(hotel.id, roomId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['owner-rooms', hotel?.id] })
      toast({ title: res.data?.message || 'Status kamar diperbarui.' })
    },
    onError: () => toast({ title: 'Gagal memperbarui status.', variant: 'destructive' }),
  })

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
        <Activity className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900">Ketersediaan Real-time</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            Menonaktifkan kamar di sini akan menghentikan penjualan kamar tersebut hingga diaktifkan kembali.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Status Kamar</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="divide-y divide-slate-50">
          {isLoading
            ? Array(3).fill(0).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="skeleton h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2"><div className="skeleton h-4 w-32 rounded" /><div className="skeleton h-3 w-20 rounded" /></div>
                  <div className="skeleton h-8 w-24 rounded-xl" />
                </div>
              ))
            : rooms?.map(r => {
                const avail = r.isActive !== false && r.is_active !== false
                return (
                  <div key={r.id} className="px-6 py-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${avail ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                      <BedDouble className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{r.name}</p>
                      <p className="text-xs text-slate-400">{r.totalUnits || r.total_units} unit · {formatRupiah(r.basePrice || r.base_price)}/malam</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${avail ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        {avail ? 'Tersedia' : 'Ditutup'}
                      </span>
                      <button
                        onClick={() => toggleMutation.mutate(r.id)}
                        disabled={toggleMutation.isPending}
                        className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-60 ${avail ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${avail ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                )
              })
          }
          {!isLoading && !rooms?.length && (
            <div className="py-14 text-center text-slate-400 text-sm">Belum ada kamar.</div>
          )}
        </div>
      </div>
    </div>
  )
}
