import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { useToast } from '@/hooks/use-toast'
import { Check } from 'lucide-react'

const MODELS = [
  {
    id: 'room',
    title: 'Room-Based',
    desc: 'Model ini memungkinkan Anda untuk menetapkan harga kamar dan jumlah maksimum tamu yang bisa menginap di kamar tersebut. Harga yang ditetapkan juga berlaku jika jumlah tamu yang menginap lebih sedikit.',
  },
  {
    id: 'occupancy',
    title: 'Occupancy-Based',
    desc: 'Model ini memungkinkan Anda untuk mengatur harga kamar berdasarkan jumlah tamu yang menginap. Harga kamar bisa lebih tinggi atau rendah sesuai jumlah tamu.',
  },
]

export default function PricingModel() {
  const { hotel } = useOutletContext()
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['hotel-settings', hotel?.id],
    queryFn: () => hotelApi.getSettings(hotel.id).then(r => r.data?.data),
    enabled: !!hotel?.id,
  })

  const [selected, setSelected] = useState(null)
  const current = settings?.pricing_model ?? 'room'
  const active  = selected ?? current

  const mutation = useMutation({
    mutationFn: (d) => hotelApi.updateSettings(hotel.id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotel-settings', hotel?.id] })
      setSelected(null)
      toast({ title: 'Pricing model berhasil diperbarui.' })
    },
    onError: () => toast({ title: 'Gagal menyimpan.', variant: 'destructive' }),
  })

  const isDirty = selected !== null && selected !== current

  return (
    <div className="space-y-5">
      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
        Pricing Model adalah penentuan model rate plan yang akan digunakan untuk pengaturan harga kamar.
        Di halaman ini, Anda bisa memilih Pricing Model yang ingin diterapkan di properti Anda.
      </p>

      {/* Options card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading
          ? Array(2).fill(0).map((_, i) => (
              <div key={i} className={`px-6 py-5 ${i < 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="skeleton h-4 w-32 rounded mb-2" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-3/4 rounded mt-1" />
              </div>
            ))
          : MODELS.map((m, idx) => {
              const isActive  = active === m.id
              const isCurrent = current === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setSelected(m.id)}
                  className={`w-full text-left px-6 py-5 transition-colors ${
                    idx < MODELS.length - 1 ? 'border-b border-slate-100' : ''
                  } ${isActive ? 'bg-blue-50/40' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="font-bold text-slate-900 text-sm">{m.title}</span>
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                        <Check className="w-3.5 h-3.5" /> Sedang aktif
                      </span>
                    )}
                    {isActive && !isCurrent && (
                      <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Dipilih
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-blue-700/80 leading-relaxed">{m.desc}</p>
                </button>
              )
            })
        }
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <button
          onClick={() => mutation.mutate({ pricing_model: active })}
          disabled={mutation.isPending || isLoading || !isDirty}
          className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 text-sm font-bold px-8 py-2.5 rounded-full transition-colors"
        >
          {mutation.isPending ? 'Menyimpan...' : 'UBAH'}
        </button>
      </div>
    </div>
  )
}
