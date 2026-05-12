import { useOutletContext } from 'react-router-dom'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/utils'
import { Plus, Pencil, Trash2, X, BedDouble } from 'lucide-react'

const ROOM_TYPES = [
  { value: 'single_room',      label: 'Single Room'           },
  { value: 'standard',         label: 'Standard'              },
  { value: 'superior',         label: 'Superior'              },
  { value: 'deluxe',           label: 'Deluxe'                },
  { value: 'family',           label: 'Family'                },
  { value: 'suite',            label: 'Suite'                 },
  { value: 'apartment_studio', label: 'Apartment - Studio'    },
  { value: 'apartment_2br',    label: 'Apartment - 2 Bedroom' },
  { value: 'apartment_3br',    label: 'Apartment - 3 Bedroom' },
  { value: 'villa',            label: 'Villa'                 },
]

const roomTypeLabel = (val) => ROOM_TYPES.find(t => t.value === val)?.label ?? val
const FACILITIES = ['ac','tv','wifi','minibar','bathtub','jacuzzi','balcony','kitchen','living_room','extra_bed']

const emptyForm = { name: '', type: 'standard', base_price: '', max_guests: 2, total_units: 1, facilities: [] }

export default function PropertiUnit() {
  const { hotel }  = useOutletContext()
  const { toast }  = useToast()
  const qc         = useQueryClient()
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]     = useState(emptyForm)

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['owner-rooms', hotel?.id],
    queryFn : () => hotelApi.getRooms(hotel.id).then(r => r.data?.data || r.data),
    enabled : !!hotel?.id,
  })

  const addMutation = useMutation({
    mutationFn: (d) => hotelApi.addRoom(hotel.id, d),
    onSuccess : () => { qc.invalidateQueries({ queryKey: ['owner-rooms'] }); closeModal(); toast({ title: 'Kamar ditambahkan.' }) },
    onError   : () => toast({ title: 'Gagal menyimpan.', variant: 'destructive' }),
  })

  const editMutation = useMutation({
    mutationFn: (d) => hotelApi.updateRoom(hotel.id, editing.id, d),
    onSuccess : () => { qc.invalidateQueries({ queryKey: ['owner-rooms'] }); closeModal(); toast({ title: 'Kamar diperbarui.' }) },
    onError   : () => toast({ title: 'Gagal menyimpan.', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => hotelApi.deleteRoom(hotel.id, id),
    onSuccess : () => { qc.invalidateQueries({ queryKey: ['owner-rooms'] }); toast({ title: 'Kamar dihapus.' }) },
    onError   : () => toast({ title: 'Gagal menghapus.', variant: 'destructive' }),
  })

  const openAdd  = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit = (r) => { setEditing(r); setForm({ name: r.name, type: r.type, base_price: r.basePrice, max_guests: r.maxGuests, total_units: r.totalUnits, facilities: r.facilities || [] }); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null) }
  const toggleFacility = (f) => setForm(p => ({ ...p, facilities: p.facilities.includes(f) ? p.facilities.filter(x => x !== f) : [...p.facilities, f] }))

  const handleSubmit = () => editing ? editMutation.mutate(form) : addMutation.mutate(form)
  const isPending    = addMutation.isPending || editMutation.isPending

  if (!hotel) return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <BedDouble className="w-10 h-10 mb-3 opacity-30" />
      <p className="text-sm font-semibold text-slate-500">Properti tidak ditemukan</p>
      <p className="text-sm mt-1">Pastikan Anda sudah mendaftarkan properti terlebih dahulu.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{rooms?.length || 0} tipe kamar terdaftar</p>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Tambah Kamar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Kamar','Tipe','Harga / Malam','Kapasitas','Unit','Aksi'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading
              ? Array(3).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              : rooms?.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{roomTypeLabel(r.type)}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatRupiah(r.basePrice)}</td>
                    <td className="px-4 py-3 text-slate-500">{r.maxGuests} tamu</td>
                    <td className="px-4 py-3 text-slate-500">{r.totalUnits} unit</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(r)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm('Hapus kamar ini?')) deleteMutation.mutate(r.id) }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
        {!isLoading && !rooms?.length && (
          <div className="py-14 text-center space-y-2">
            <BedDouble className="w-10 h-10 text-slate-200 mx-auto" />
            <p className="text-slate-400 text-sm">Belum ada kamar. Tambah sekarang.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">{editing ? 'Edit Kamar' : 'Tambah Kamar'}</h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Kamar</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tipe</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30">
                    {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Harga / Malam (Rp)</label>
                  <input type="number" value={form.base_price} onChange={e => setForm(p => ({ ...p, base_price: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kapasitas Tamu</label>
                  <select value={form.max_guests} onChange={e => setForm(p => ({ ...p, max_guests: +e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30">
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} tamu</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jumlah Unit</label>
                  <input type="number" min={1} value={form.total_units} onChange={e => setForm(p => ({ ...p, total_units: +e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Fasilitas Kamar</label>
                <div className="flex flex-wrap gap-2">
                  {FACILITIES.map(f => (
                    <button key={f} type="button" onClick={() => toggleFacility(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                        form.facilities.includes(f)
                          ? 'bg-brand/10 border-brand text-brand-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}>
                      {f.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeModal}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button onClick={handleSubmit} disabled={isPending}
                className="px-5 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50">
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
