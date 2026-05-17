import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { useToast } from '@/hooks/use-toast'
import { Users, Save } from 'lucide-react'
import PriceInput from '@/components/ui/PriceInput'

const DEFAULT_POLICY = {
  freeUnderAge: 5,
  childFreePolicy: 'share_bed',
  childDiscount: 50,
  maxChildAge: 12,
  extraBedCharge: 0,
}

export default function HargaAnak() {
  const { hotel } = useOutletContext()
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['hotel-settings', hotel?.id],
    queryFn: () => hotelApi.getSettings(hotel.id).then(r => r.data?.data),
    enabled: !!hotel?.id,
  })

  const [form, setForm] = useState(DEFAULT_POLICY)

  useEffect(() => {
    if (settings?.child_policy) {
      setForm({ ...DEFAULT_POLICY, ...settings.child_policy })
    }
  }, [settings])

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: () =>
      hotelApi.updateSettings(hotel.id, {
        child_policy: {
          free_under_age:    form.freeUnderAge,
          max_child_age:     form.maxChildAge,
          child_free_policy: form.childFreePolicy,
          child_discount:    form.childDiscount,
          extra_bed_charge:  form.extraBedCharge,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotel-settings', hotel?.id] })
      toast({ title: 'Kebijakan harga anak berhasil disimpan.' })
    },
    onError: () => toast({ title: 'Gagal menyimpan.', variant: 'destructive' }),
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Kebijakan & Harga untuk Anak</h2>
            <p className="text-xs text-slate-400">Atur ketentuan menginap untuk tamu anak-anak</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-2xl bg-slate-50 p-4 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Batas Usia</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Anak gratis di bawah usia</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} max={18} value={form.freeUnderAge} onChange={e => upd('freeUnderAge', +e.target.value)}
                      className="w-20 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    <span className="text-sm text-slate-500">tahun</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Usia maksimum anak</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} max={18} value={form.maxChildAge} onChange={e => upd('maxChildAge', +e.target.value)}
                      className="w-20 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    <span className="text-sm text-slate-500">tahun</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Kebijakan Gratis</p>
              {[
                { v: 'share_bed', label: 'Gratis jika berbagi tempat tidur dengan orang tua' },
                { v: 'all',       label: 'Semua anak gratis tanpa syarat' },
                { v: 'none',      label: 'Anak tidak mendapat gratis' },
              ].map(opt => (
                <label key={opt.v} className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="childPolicy" value={opt.v} checked={form.childFreePolicy === opt.v}
                    onChange={() => upd('childFreePolicy', opt.v)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-slate-700">{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Diskon & Biaya Tambahan</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Diskon untuk anak</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} max={100} value={form.childDiscount} onChange={e => upd('childDiscount', +e.target.value)}
                      className="w-20 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    <span className="text-sm text-slate-500">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Biaya extra bed</label>
                  <PriceInput
                    value={form.extraBedCharge}
                    onChange={v => upd('extraBedCharge', v || 0)}
                    suffix="/malam"
                    className="w-64"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || isLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> Simpan Kebijakan
          </button>
        </div>
      </div>
    </div>
  )
}
