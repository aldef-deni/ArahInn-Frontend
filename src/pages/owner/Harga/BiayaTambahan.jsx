import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah, cn } from '@/utils'
import {
  Plus, Pencil, Trash2, Receipt, Calendar as CalendarIcon, ArrowLeft, ChevronDown,
} from 'lucide-react'
import PriceInput from '@/components/ui/PriceInput'

/* ──────────────────────────────────────────────────────────────────────── */
/* Konstanta                                                                */
/* ──────────────────────────────────────────────────────────────────────── */
const PER_LABEL = { night: '/malam', stay: '/menginap', person: '/orang' }

// Tipe surcharge → mapping ke field 'per' di backend
const SURCHARGE_TYPES = [
  { id: 'room',  label: 'Kamar', per: 'night',
    desc: 'Biaya dihitung per kamar per malam.' },
  { id: 'guest', label: 'Tamu',  per: 'person',
    desc: 'Biaya dihitung per orang per malam.' },
]

// Template "Surcharge Info" — mengisi nama otomatis saat dipilih
const SURCHARGE_TEMPLATES = [
  'Biaya Tambahan Tahun Baru Imlek',
  'Biaya Tambahan Tahun Baru',
  'Biaya Tambahan High Season',
  'Biaya Tambahan Ekstra',
  'Biaya Tambahan Gala Dinner',
  'Biaya Tambahan Peak Season',
  'Biaya Tambahan Hari Raya Paskah',
  'Biaya Tambahan Idul Fitri',
]

/* ──────────────────────────────────────────────────────────────────────── */
/* Section card                                                             */
/* ──────────────────────────────────────────────────────────────────────── */
function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-base">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Radio card (untuk Type & Info)                                           */
/* ──────────────────────────────────────────────────────────────────────── */
function RadioOption({ name, value, checked, onChange, label, sublabel }) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 cursor-pointer rounded-xl px-4 py-3 transition-all',
        checked ? 'bg-blue-50/60 border border-blue-200' : 'border border-transparent hover:bg-slate-50'
      )}
    >
      <div className={cn(
        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
        checked ? 'border-blue-600' : 'border-slate-300'
      )}>
        {checked && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
      </div>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium', checked ? 'text-slate-900' : 'text-slate-700')}>{label}</p>
        {sublabel && <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>}
      </div>
    </label>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Form: Surcharge Baru / Edit                                              */
/* ──────────────────────────────────────────────────────────────────────── */
function SurchargeForm({ initial, hotelId, onCancel, onSaved }) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const isEdit = !!initial?.id

  const initType = useMemo(() => {
    if (!initial) return 'room'
    if (initial.per === 'person') return 'guest'
    return 'room'
  }, [initial])

  const [form, setForm] = useState({
    name:        initial?.name        || '',
    category:    initial?.category    || '',
    start_date:  initial?.start_date  ? String(initial.start_date).slice(0, 10) : '',
    end_date:    initial?.end_date    ? String(initial.end_date).slice(0, 10)   : '',
    surchargeType: initType,
    amount:      initial?.amount      || '',
    type:        initial?.type        || 'fixed',   // 'fixed' | 'percent'
    per:         initial?.per         || 'night',
    mandatory:   initial?.mandatory   ?? true,
    active:      initial?.active      ?? true,
  })

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const pickType = (typeId) => {
    const t = SURCHARGE_TYPES.find(x => x.id === typeId)
    setForm(f => ({ ...f, surchargeType: typeId, per: t?.per || f.per }))
  }

  const pickTemplate = (tpl) => {
    setForm(f => ({
      ...f,
      category: tpl,
      // Auto-fill nama kalau masih kosong
      name: f.name?.trim() ? f.name : tpl,
    }))
  }

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? hotelApi.updateHotelFee(hotelId, initial.id, payload)
        : hotelApi.createHotelFee(hotelId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotel-fees', hotelId] })
      toast({ title: isEdit ? 'Surcharge berhasil diperbarui.' : 'Surcharge baru berhasil dibuat.' })
      onSaved?.()
    },
    onError: (e) => {
      const msg = e?.response?.data?.message
        || (e?.response?.status === 422 ? 'Data tidak valid. Lengkapi semua kolom wajib.' : 'Gagal menyimpan.')
      toast({ title: 'Gagal', description: msg, variant: 'destructive' })
    },
  })

  const validate = () => {
    if (!form.name.trim()) { toast({ title: 'Nama Surcharge wajib diisi.', variant: 'destructive' }); return false }
    if (!form.start_date)  { toast({ title: 'Tanggal Check-in Dimulai wajib diisi.', variant: 'destructive' }); return false }
    if (!form.end_date)    { toast({ title: 'Tanggal Check-in Berakhir wajib diisi.', variant: 'destructive' }); return false }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      toast({ title: 'Tanggal Berakhir tidak boleh sebelum Tanggal Dimulai.', variant: 'destructive' }); return false
    }
    if (!form.amount || +form.amount <= 0) { toast({ title: 'Jumlah biaya wajib diisi (> 0).', variant: 'destructive' }); return false }
    if (form.type === 'percent' && +form.amount > 100) {
      toast({ title: 'Persentase tidak boleh lebih dari 100%.', variant: 'destructive' }); return false
    }
    return true
  }

  const handleSubmit = () => {
    if (!validate()) return
    mutation.mutate({
      name:       form.name.trim(),
      category:   form.category || null,
      amount:     Number(form.amount),
      type:       form.type,
      per:        form.per,
      mandatory:  !!form.mandatory,
      active:     !!form.active,
      start_date: form.start_date || null,
      end_date:   form.end_date   || null,
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? 'Edit Surcharge' : 'Surcharge Baru'}
        </h1>
      </div>

      {/* Nama */}
      <Card title="Nama Surcharge">
        <input
          value={form.name}
          onChange={e => upd('name', e.target.value)}
          placeholder="Nama Surcharge"
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </Card>

      {/* Stay Date */}
      <Card title="Stay Date">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Check-in Dimulai</label>
            <div className="relative">
              <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={form.start_date}
                onChange={e => upd('start_date', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Check-in Berakhir</label>
            <div className="relative">
              <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={form.end_date}
                min={form.start_date}
                onChange={e => upd('end_date', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Surcharge Type */}
      <Card title="Surcharge Type">
        <p className="text-sm text-slate-500 mb-3">Pilih Tipe Surcharge</p>
        <div className="space-y-2">
          {SURCHARGE_TYPES.map(t => (
            <RadioOption
              key={t.id}
              name="surchargeType"
              value={t.id}
              checked={form.surchargeType === t.id}
              onChange={pickType}
              label={t.label}
              sublabel={t.desc}
            />
          ))}
        </div>
      </Card>

      {/* Surcharge Info (templates) */}
      <Card title="Surcharge Info">
        <p className="text-sm text-slate-500 mb-3">Pilih Surcharge Info</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
          {SURCHARGE_TEMPLATES.map(tpl => (
            <RadioOption
              key={tpl}
              name="category"
              value={tpl}
              checked={form.category === tpl}
              onChange={pickTemplate}
              label={tpl}
            />
          ))}
        </div>
      </Card>

      {/* Detail Biaya */}
      <Card title="Detail Biaya">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tipe Biaya</label>
            <div className="relative">
              <select
                value={form.type}
                onChange={e => upd('type', e.target.value)}
                className="w-full appearance-none px-4 py-3 pr-10 border border-slate-200 rounded-xl text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="fixed">Nominal Tetap (Rp)</option>
                <option value="percent">Persentase (%)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {form.type === 'percent' ? 'Persentase (%)' : 'Jumlah (Rp)'}
            </label>
            {form.type === 'percent' ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.amount}
                  onChange={e => upd('amount', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <span className="text-sm font-semibold text-slate-500 shrink-0">%</span>
              </div>
            ) : (
              <PriceInput value={form.amount} onChange={v => upd('amount', v || '')} className="w-full" />
            )}
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.mandatory}
            onChange={e => upd('mandatory', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
          />
          <span className="text-sm text-slate-700">Wajib dibayar tamu (tidak bisa dilewati)</span>
        </label>
      </Card>

      {/* Footer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-3 rounded-full border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          BATAL
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="px-8 py-3 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-900 text-sm font-bold transition-colors disabled:opacity-60 shadow-sm"
        >
          {mutation.isPending ? 'Menyimpan...' : 'SUBMIT'}
        </button>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Main: list + form switcher                                               */
/* ──────────────────────────────────────────────────────────────────────── */
export default function BiayaTambahan() {
  const { hotel } = useOutletContext()
  const { toast } = useToast()
  const qc = useQueryClient()

  // 'list' | 'create' | feeObject (edit)
  const [view, setView] = useState('list')

  const { data: fees, isLoading } = useQuery({
    queryKey: ['hotel-fees', hotel?.id],
    queryFn: () => hotelApi.getHotelFees(hotel.id).then(r => r.data?.data || []),
    enabled: !!hotel?.id,
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => hotelApi.deleteHotelFee(hotel.id, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotel-fees', hotel?.id] })
      toast({ title: 'Biaya dihapus.' })
    },
    onError: () => toast({ title: 'Gagal menghapus.', variant: 'destructive' }),
  })

  const toggleMutation = useMutation({
    mutationFn: (fee) => hotelApi.updateHotelFee(hotel.id, fee.id, { active: !fee.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel-fees', hotel?.id] }),
    onError: () => toast({ title: 'Gagal memperbarui.', variant: 'destructive' }),
  })

  /* ─── Form mode ─── */
  if (view === 'create' || (view && typeof view === 'object')) {
    return (
      <SurchargeForm
        initial={typeof view === 'object' ? view : null}
        hotelId={hotel?.id}
        onCancel={() => setView('list')}
        onSaved={() => setView('list')}
      />
    )
  }

  /* ─── List mode ─── */
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Biaya Tambahan</h2>
            <p className="text-xs text-slate-400 mt-0.5">Surcharge musiman dan biaya ekstra di luar harga kamar</p>
          </div>
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Surcharge
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {isLoading
            ? Array(3).fill(0).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="skeleton w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-2"><div className="skeleton h-4 w-28 rounded" /><div className="skeleton h-3 w-20 rounded" /></div>
                </div>
              ))
            : fees?.map(f => (
                <div key={f.id} className={cn('px-6 py-4 flex items-center gap-4', !f.active && 'opacity-50')}>
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    f.active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                  )}>
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-900">{f.name}</p>
                      {f.category && f.category !== f.name && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{f.category}</span>
                      )}
                      {f.mandatory && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Wajib</span>}
                      {!f.active && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Nonaktif</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {f.type === 'percent' ? `${f.amount}%` : formatRupiah(f.amount)}
                      {PER_LABEL[f.per] || ''}
                      {(f.start_date || f.end_date) && (
                        <>
                          {' · '}
                          <CalendarIcon className="inline w-3 h-3 -mt-0.5" />{' '}
                          {String(f.start_date || '').slice(0, 10) || '—'} → {String(f.end_date || '').slice(0, 10) || '—'}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleMutation.mutate(f)} disabled={toggleMutation.isPending}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50">
                      {f.active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button onClick={() => setView(f)} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteMutation.mutate(f.id)} disabled={deleteMutation.isPending}
                      className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
          }
          {!isLoading && !fees?.length && (
            <div className="py-14 text-center text-slate-400 text-sm">Belum ada biaya tambahan.</div>
          )}
        </div>
      </div>
    </div>
  )
}
