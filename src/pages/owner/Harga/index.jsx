import { useOutletContext } from 'react-router-dom'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import { Pencil, X, Save, BedDouble } from 'lucide-react'

export default function OwnerHarga() {
  const { hotel }  = useOutletContext()
  const { toast }  = useToast()
  const qc         = useQueryClient()
  const [editing, setEditing] = useState(null)
  const [price, setPrice]     = useState('')

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['owner-rooms', hotel?.id],
    queryFn : () => hotelApi.getRooms(hotel.id).then(r => r.data?.data || r.data),
    enabled : !!hotel?.id,
  })

  const mutation = useMutation({
    mutationFn: (d) => hotelApi.updateRoom(hotel.id, editing.id, d),
    onSuccess : () => {
      qc.invalidateQueries(['owner-rooms'])
      setEditing(null)
      toast({ title: 'Harga berhasil diperbarui.' })
    },
    onError: () => toast({ title: 'Gagal menyimpan.', variant: 'destructive' }),
  })

  const openEdit = (r) => { setEditing(r); setPrice(r.basePrice) }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-semibold text-slate-900">Harga per Kamar</h2>
          <p className="text-xs text-slate-400 mt-0.5">Atur harga dasar untuk setiap tipe kamar</p>
        </div>
        <div className="divide-y divide-slate-50">
          {isLoading
            ? Array(3).fill(0).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="skeleton h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-32 rounded" />
                    <div className="skeleton h-3 w-20 rounded" />
                  </div>
                  <div className="skeleton h-8 w-28 rounded-xl" />
                </div>
              ))
            : rooms?.map(r => (
                <div key={r.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                    <BedDouble className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{r.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{r.type} · {r.maxGuests} tamu · {r.totalUnits} unit</p>
                  </div>

                  {editing?.id === r.id ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">Rp</span>
                        <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                          className="pl-8 pr-3 py-2 border border-brand rounded-xl text-sm w-36 focus:outline-none focus:ring-2 focus:ring-brand/30"
                          autoFocus />
                      </div>
                      <button onClick={() => mutation.mutate({ base_price: +price })} disabled={mutation.isPending}
                        className="p-2 rounded-xl bg-brand text-white hover:bg-brand-700 transition-colors disabled:opacity-50">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditing(null)}
                        className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-slate-900">{formatRupiah(r.basePrice)}<span className="text-xs font-normal text-slate-400"> /malam</span></p>
                      <button onClick={() => openEdit(r)}
                        className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
          }
          {!isLoading && !rooms?.length && (
            <div className="py-14 text-center text-slate-400 text-sm">Belum ada kamar. Tambah kamar terlebih dahulu.</div>
          )}
        </div>
      </div>
    </div>
  )
}
