import { useState, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@/services/hotelApi'
import { useToast } from '@/hooks/use-toast'
import {
  Check, ChevronDown, Plus, Trash2, ArrowLeft, ArrowRight, Save, Baby, Wallet, Info,
} from 'lucide-react'
import PriceInput from '@/components/ui/PriceInput'
import { cn } from '@/utils'

/* ──────────────────────────────────────────────────────────────────────── */
/* Konstanta & default                                                      */
/* ──────────────────────────────────────────────────────────────────────── */
const DEFAULT_POLICY = {
  // legacy (tetap dikirim agar backward-compat)
  free_under_age: 5,
  child_free_policy: 'share_bed',
  child_discount: 50,
  extra_bed_charge: 0,
  // tiket.com style
  max_child_age: 16,
  charge_mode: 'free',   // 'free' | 'paid'
  age_groups: [],         // [{ id, label, min_age, max_age }]
  prices: {},             // { [ratePlanId]: { [groupId]: { type: 'percent'|'flat', value } } }
}

const STEPS = [
  { id: 1, label: 'Atur kebijakan anak' },
  { id: 2, label: 'Buat grup umur' },
  { id: 3, label: 'Atur harga untuk anak' },
]

const newGroupId = () => `g_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

/* ──────────────────────────────────────────────────────────────────────── */
/* Stepper header                                                           */
/* ──────────────────────────────────────────────────────────────────────── */
function Stepper({ current }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {STEPS.map((s, i) => {
        const done    = current > s.id
        const active  = current === s.id
        return (
          <div key={s.id} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                done   ? 'bg-blue-600 text-white' :
                active ? 'bg-blue-600 text-white' :
                         'bg-slate-200 text-slate-500'
              )}>
                {done ? <Check className="w-3.5 h-3.5" /> : s.id}
              </div>
              <span className={cn(
                'text-sm',
                active ? 'font-bold text-slate-900' :
                done   ? 'font-medium text-slate-600' :
                         'text-slate-400'
              )}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={cn('w-8 h-px', done ? 'bg-blue-300' : 'bg-slate-200')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
/* STEP 1 — Atur kebijakan anak                                             */
/* ──────────────────────────────────────────────────────────────────────── */
function Step1({ form, setForm }) {
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const maxAge = form.max_child_age || 16

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-6 py-5 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">Kebijakan Anak</h3>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Umur maksimum */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Berapa umur maksimum tamu anak?
          </label>
          <div className="relative max-w-sm bg-blue-50/60 rounded-xl border border-slate-200">
            <select
              value={maxAge}
              onChange={e => upd('max_child_age', +e.target.value)}
              className="w-full appearance-none bg-transparent px-4 py-3 pr-10 text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 19 }, (_, i) => i).map(n => (
                <option key={n} value={n}>Umur maks. anak: {n}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Mode biaya */}
        <div>
          <p className="text-sm text-slate-700 mb-3">
            Apakah anak-anak {maxAge} tahun ke bawah diperbolehkan untuk menginap gratis?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                v: 'free',
                title: 'Izinkan anak menginap gratis',
                icon: <Baby className="w-5 h-5 text-emerald-600" />,
                iconBg: 'bg-emerald-100',
                bullets: [
                  `Anak ${maxAge} tahun ke bawah bisa menginap tanpa tambahan biaya, berlaku untuk semua rate plan.`,
                  'Anda tidak perlu mengatur grup umur dan harga tambahan untuk anak.',
                ],
              },
              {
                v: 'paid',
                title: 'Ada biaya tambahan untuk anak',
                icon: <Wallet className="w-5 h-5 text-blue-600" />,
                iconBg: 'bg-blue-100',
                bullets: [
                  'Anda dapat mengatur harga tambahan untuk tiap grup umur anak.',
                  'Harga tersebut bisa berbeda untuk tiap rate plan.',
                ],
              },
            ].map(opt => {
              const checked = form.charge_mode === opt.v
              return (
                <label
                  key={opt.v}
                  className={cn(
                    'cursor-pointer rounded-2xl border p-5 transition-all flex flex-col gap-3',
                    checked
                      ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/60'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', opt.iconBg)}>
                        {opt.icon}
                      </div>
                      <p className="font-bold text-slate-900 text-sm">{opt.title}</p>
                    </div>
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
                      checked ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                    )}>
                      {checked && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <input
                      type="radio"
                      name="charge_mode"
                      value={opt.v}
                      checked={checked}
                      onChange={() => upd('charge_mode', opt.v)}
                      className="sr-only"
                    />
                  </div>
                  <ul className="space-y-1.5 text-sm text-slate-600 leading-relaxed">
                    {opt.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </label>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
/* STEP 2 — Buat grup umur                                                  */
/* ──────────────────────────────────────────────────────────────────────── */
function Step2({ form, setForm }) {
  const maxAge = form.max_child_age || 16
  const groups = form.age_groups || []

  const addGroup = () => {
    const newGroup = {
      id: newGroupId(),
      label: `Grup ${groups.length + 1}`,
      min_age: 0,
      max_age: Math.min(maxAge, 5),
    }
    setForm(f => ({ ...f, age_groups: [...(f.age_groups || []), newGroup] }))
  }

  const removeGroup = (id) => {
    setForm(f => {
      const newPrices = { ...(f.prices || {}) }
      Object.keys(newPrices).forEach(rpId => {
        if (newPrices[rpId]?.[id]) {
          const copy = { ...newPrices[rpId] }
          delete copy[id]
          newPrices[rpId] = copy
        }
      })
      return {
        ...f,
        age_groups: (f.age_groups || []).filter(g => g.id !== id),
        prices: newPrices,
      }
    })
  }

  const updGroup = (id, patch) => {
    setForm(f => ({
      ...f,
      age_groups: (f.age_groups || []).map(g => g.id === id ? { ...g, ...patch } : g),
    }))
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-6 py-5 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">Buat Grup Umur</h3>
        <p className="text-sm text-slate-500 mt-1">
          Kelompokkan anak berdasarkan rentang umur. Misal: <em>Balita (0-5)</em>, <em>Anak (6-{maxAge})</em>.
        </p>
      </div>

      <div className="px-6 py-5 space-y-4">
        {form.charge_mode === 'free' && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Mode "Izinkan anak menginap gratis" aktif</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Grup umur opsional — sistem akan tetap menggratiskan semua anak {maxAge} tahun ke bawah. Lanjut ke langkah berikutnya jika tidak perlu.
              </p>
            </div>
          </div>
        )}

        {!groups.length && (
          <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-500 mb-3">Belum ada grup umur.</p>
            <button onClick={addGroup}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl">
              <Plus className="w-4 h-4" /> Tambah Grup Umur
            </button>
          </div>
        )}

        {groups.map((g, idx) => (
          <div key={g.id} className="border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Grup {idx + 1}</p>
              <button onClick={() => removeGroup(g.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Nama Grup</label>
                <input
                  value={g.label}
                  onChange={e => updGroup(g.id, { label: e.target.value })}
                  placeholder="Misal: Balita"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Umur Minimum</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={maxAge}
                    value={g.min_age}
                    onChange={e => updGroup(g.id, { min_age: +e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <span className="text-xs text-slate-500 shrink-0">tahun</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Umur Maksimum</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={maxAge}
                    value={g.max_age}
                    onChange={e => updGroup(g.id, { max_age: +e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <span className="text-xs text-slate-500 shrink-0">tahun</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {groups.length > 0 && (
          <button onClick={addGroup}
            className="inline-flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm font-semibold rounded-xl">
            <Plus className="w-4 h-4" /> Tambah Grup Umur
          </button>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
/* STEP 3 — Atur harga untuk anak per rate plan × grup                      */
/* ──────────────────────────────────────────────────────────────────────── */
function Step3({ form, setForm, ratePlans }) {
  const groups   = form.age_groups || []
  const prices   = form.prices || {}

  const setPrice = (rpId, gId, patch) => {
    setForm(f => {
      const cur = f.prices?.[rpId]?.[gId] || { type: 'percent', value: 0 }
      return {
        ...f,
        prices: {
          ...(f.prices || {}),
          [rpId]: {
            ...((f.prices || {})[rpId] || {}),
            [gId]: { ...cur, ...patch },
          },
        },
      }
    })
  }

  if (form.charge_mode === 'free') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <Baby className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-2">Anak Menginap Gratis</h3>
        <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
          Anda telah memilih mode <span className="font-semibold text-slate-700">"Izinkan anak menginap gratis"</span>.
          Tidak ada harga yang perlu diatur. Tekan <span className="font-semibold text-slate-700">Simpan</span> untuk menyelesaikan pengaturan.
        </p>
      </div>
    )
  }

  if (!groups.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
        <p className="text-sm text-slate-500">Tambahkan grup umur dulu di langkah 2 untuk mengatur harga.</p>
      </div>
    )
  }

  if (!ratePlans?.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
        <p className="text-sm text-slate-500">Belum ada rate plan. Buat rate plan dulu di menu Rate Plan.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-6 py-5 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">Atur Harga untuk Anak</h3>
        <p className="text-sm text-slate-500 mt-1">
          Atur biaya tambahan untuk setiap grup umur pada tiap rate plan. Bisa berupa persentase dari harga dewasa atau nominal tetap per malam.
        </p>
      </div>

      <div className="px-6 py-5 space-y-5">
        {ratePlans.map(rp => (
          <div key={rp.id} className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <p className="text-sm font-bold text-slate-800">{rp.name}</p>
              {rp.is_default && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">DEFAULT</span>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {groups.map(g => {
                const cell = prices?.[rp.id]?.[g.id] || { type: 'percent', value: 0 }
                return (
                  <div key={g.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{g.label || 'Grup'}</p>
                      <p className="text-xs text-slate-500">{g.min_age}-{g.max_age} tahun</p>
                    </div>
                    <div>
                      <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden">
                        <button onClick={() => setPrice(rp.id, g.id, { type: 'percent' })}
                          className={cn('px-3 py-1.5 text-xs font-semibold',
                            cell.type === 'percent' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}>
                          % dari harga dewasa
                        </button>
                        <button onClick={() => setPrice(rp.id, g.id, { type: 'flat' })}
                          className={cn('px-3 py-1.5 text-xs font-semibold',
                            cell.type === 'flat' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}>
                          Nominal tetap
                        </button>
                      </div>
                    </div>
                    <div>
                      {cell.type === 'percent' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={cell.value}
                            onChange={e => setPrice(rp.id, g.id, { value: Math.max(0, Math.min(100, +e.target.value || 0)) })}
                            className="w-24 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                          <span className="text-sm text-slate-500">%</span>
                        </div>
                      ) : (
                        <PriceInput
                          value={cell.value}
                          onChange={v => setPrice(rp.id, g.id, { value: +v || 0 })}
                          suffix="/malam"
                          className="w-44"
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Main wizard                                                              */
/* ──────────────────────────────────────────────────────────────────────── */
export default function HargaAnak() {
  const { hotel } = useOutletContext()
  const { toast } = useToast()
  const qc        = useQueryClient()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState(DEFAULT_POLICY)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['hotel-settings', hotel?.id],
    queryFn: () => hotelApi.getSettings(hotel.id).then(r => r.data?.data),
    enabled: !!hotel?.id,
  })

  const { data: ratePlans } = useQuery({
    queryKey: ['rate-plans', hotel?.id],
    queryFn: () => hotelApi.getRatePlans(hotel.id).then(r => r.data?.data || []),
    enabled: !!hotel?.id,
  })

  useEffect(() => {
    if (settings?.child_policy) {
      setForm(f => ({
        ...DEFAULT_POLICY,
        ...settings.child_policy,
        // Backward compat: gunakan max_child_age dari child_policy lama jika ada
        max_child_age: settings.child_policy.max_child_age ?? DEFAULT_POLICY.max_child_age,
        age_groups: Array.isArray(settings.child_policy.age_groups) ? settings.child_policy.age_groups : [],
        prices: typeof settings.child_policy.prices === 'object' && settings.child_policy.prices !== null
          ? settings.child_policy.prices : {},
      }))
    }
  }, [settings])

  const mutation = useMutation({
    mutationFn: () => hotelApi.updateSettings(hotel.id, {
      child_policy: {
        // legacy
        free_under_age:    form.free_under_age ?? form.max_child_age,
        max_child_age:     form.max_child_age,
        child_free_policy: form.child_free_policy ?? 'share_bed',
        child_discount:    form.child_discount ?? 0,
        extra_bed_charge:  form.extra_bed_charge ?? 0,
        // tiket.com-style
        charge_mode:       form.charge_mode || 'free',
        age_groups:        form.age_groups || [],
        prices:            form.prices || {},
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotel-settings', hotel?.id] })
      toast({ title: 'Kebijakan & harga untuk anak berhasil disimpan.' })
    },
    onError: () => toast({ title: 'Gagal menyimpan.', variant: 'destructive' }),
  })

  const canNext = useMemo(() => {
    if (step === 1) return form.charge_mode === 'free' || form.charge_mode === 'paid'
    if (step === 2) {
      if (form.charge_mode === 'free') return true
      // mode paid: minimal 1 grup dengan rentang valid
      const groups = form.age_groups || []
      if (!groups.length) return false
      return groups.every(g => g.label?.trim() && Number.isFinite(g.min_age) && Number.isFinite(g.max_age) && g.min_age <= g.max_age)
    }
    return true
  }, [step, form])

  const handleNext = () => {
    if (!canNext) {
      const msg = step === 2 ? 'Tambahkan minimal 1 grup umur dengan rentang yang valid.' : 'Lengkapi pilihan terlebih dahulu.'
      toast({ title: 'Lengkapi data', description: msg, variant: 'destructive' })
      return
    }
    if (step < STEPS.length) setStep(s => s + 1)
    else mutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Intro */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-base font-bold text-slate-900">Kebijakan & Harga untuk Anak</h2>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
          Atur ketentuan menginap dan biaya tambahan untuk tamu anak-anak.{' '}
          <button className="text-blue-600 hover:underline">Pelajari selengkapnya</button> untuk info lebih lengkap.
        </p>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <Stepper current={step} />
      </div>

      {/* Step content */}
      {step === 1 && <Step1 form={form} setForm={setForm} />}
      {step === 2 && <Step2 form={form} setForm={setForm} />}
      {step === 3 && <Step3 form={form} setForm={setForm} ratePlans={ratePlans || []} />}

      {/* Footer actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => step > 1 && setStep(s => s - 1)}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors shadow-sm"
        >
          {step < STEPS.length ? (
            <>Lanjutkan <ArrowRight className="w-4 h-4" /></>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
